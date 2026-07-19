import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { after, before, beforeEach, describe, it } from 'node:test';

const PROJECT_ID = 'demo-hakeemi';
const STORAGE_BUCKET = `gs://${PROJECT_ID}.appspot.com`;

let testEnvironment: RulesTestEnvironment;

function upload(
  reference: firebase.storage.Reference,
  data: Uint8Array,
  metadata: firebase.storage.UploadMetadata,
) {
  const task = reference.put(data, metadata);

  return new Promise<firebase.storage.UploadTaskSnapshot>((resolveUpload, rejectUpload) => {
    task.then(resolveUpload, rejectUpload);
  });
}

async function seedFirestore() {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    const batch = firestore.batch();

    batch.set(firestore.doc('specialties/family-medicine'), {
      isActive: true,
      name: { en: 'Family medicine', ar: 'طب الأسرة' },
    });
    batch.set(firestore.doc('clinics/marsa-family-clinic'), {
      isActive: true,
      name: { en: 'Marsa Family Clinic', ar: 'عيادة مرسى للأسرة' },
    });
    batch.set(firestore.doc('providers/lina-haddad'), {
      displayName: 'Dr. Lina Haddad',
      isActive: true,
      specialtyIds: ['family-medicine'],
    });
    batch.set(firestore.doc('providers/retired-provider'), {
      displayName: 'Retired provider',
      isActive: false,
      specialtyIds: ['family-medicine'],
    });
    batch.set(firestore.doc('availabilitySlots/lina-slot'), {
      providerId: 'lina-haddad',
      startsAt: new Date('2030-01-01T08:00:00.000Z'),
      status: 'available',
    });
    batch.set(firestore.doc('availabilitySlots/booked-slot'), {
      providerId: 'lina-haddad',
      startsAt: new Date('2030-01-01T09:00:00.000Z'),
      status: 'booked',
    });
    batch.set(firestore.doc('users/alice'), {
      displayName: 'Alice',
      email: 'alice@example.test',
    });
    batch.set(firestore.doc('users/bob'), {
      displayName: 'Bob',
      email: 'bob@example.test',
    });
    batch.set(firestore.doc('appointments/alice-appointment'), {
      patientId: 'alice',
      providerId: 'lina-haddad',
      startsAt: new Date('2030-01-01T08:00:00.000Z'),
      status: 'confirmed',
    });

    await batch.commit();
  });
}

async function seedStorage() {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const storage = context.storage(STORAGE_BUCKET);

    await upload(storage.ref('public/providers/lina.jpg'), new Uint8Array([1]), {
      contentType: 'image/jpeg',
    });
    await upload(storage.ref('users/alice/avatars/current.jpg'), new Uint8Array([1]), {
      contentType: 'image/jpeg',
    });
  });
}

before(async () => {
  const [firestoreRules, storageRules] = await Promise.all([
    readFile(resolve(process.cwd(), 'firebase/firestore.rules'), 'utf8'),
    readFile(resolve(process.cwd(), 'firebase/storage.rules'), 'utf8'),
  ]);

  testEnvironment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: firestoreRules },
    storage: { rules: storageRules },
  });
});

beforeEach(async () => {
  await Promise.all([testEnvironment.clearFirestore(), testEnvironment.clearStorage()]);
});

after(async () => {
  await testEnvironment.cleanup();
});

describe('Cloud Firestore rules', () => {
  it('allows anonymous discovery of active public resources', async () => {
    await seedFirestore();
    const firestore = testEnvironment.unauthenticatedContext().firestore();

    await assertSucceeds(firestore.doc('specialties/family-medicine').get());
    await assertSucceeds(firestore.doc('clinics/marsa-family-clinic').get());
    await assertSucceeds(firestore.doc('providers/lina-haddad').get());
    await assertSucceeds(firestore.doc('availabilitySlots/lina-slot').get());
    await assertSucceeds(
      firestore
        .collection('providers')
        .where('isActive', '==', true)
        .orderBy('isFeatured', 'desc')
        .orderBy('displayName')
        .orderBy(firebase.firestore.FieldPath.documentId())
        .limit(13)
        .get(),
    );
    await assertSucceeds(
      firestore
        .collection('providers')
        .where('isActive', '==', true)
        .where('specialtyIds', 'array-contains', 'family-medicine')
        .orderBy('isFeatured', 'desc')
        .orderBy('displayName')
        .orderBy(firebase.firestore.FieldPath.documentId())
        .limit(13)
        .get(),
    );
    await assertSucceeds(firestore.collection('specialties').where('isActive', '==', true).get());
    await assertSucceeds(firestore.collection('clinics').where('isActive', '==', true).get());
    await assertSucceeds(
      firestore
        .collection('availabilitySlots')
        .where('providerId', '==', 'lina-haddad')
        .where('status', '==', 'available')
        .orderBy('startsAt')
        .get(),
    );
  });

  it('does not expose inactive providers or unavailable slots', async () => {
    await seedFirestore();
    const firestore = testEnvironment.unauthenticatedContext().firestore();

    await assertFails(firestore.doc('providers/retired-provider').get());
    await assertFails(firestore.doc('availabilitySlots/booked-slot').get());
    await assertFails(firestore.collection('providers').get());
  });

  it('allows a user to read only their own profile', async () => {
    await seedFirestore();
    const alice = testEnvironment.authenticatedContext('alice').firestore();
    const bob = testEnvironment.authenticatedContext('bob').firestore();
    const anonymous = testEnvironment.unauthenticatedContext().firestore();

    await assertSucceeds(alice.doc('users/alice').get());
    await assertFails(bob.doc('users/alice').get());
    await assertFails(anonymous.doc('users/alice').get());
    await assertFails(alice.collection('users').get());
  });

  it('keeps profile creation and mutation server-controlled', async () => {
    const alice = testEnvironment.authenticatedContext('alice').firestore();

    await assertFails(alice.doc('users/alice').set({ displayName: 'Alice' }));
    await assertFails(alice.doc('users/alice').update({ displayName: 'Changed' }));
    await assertFails(alice.doc('users/alice').delete());
  });

  it('allows a user to write only validated application preferences', async () => {
    const alice = testEnvironment.authenticatedContext('alice').firestore();
    const bob = testEnvironment.authenticatedContext('bob').firestore();
    const validPreferences = {
      locale: 'ar',
      theme: 'dark',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    await assertSucceeds(alice.doc('users/alice/preferences/app').set(validPreferences));
    await assertSucceeds(alice.doc('users/alice/preferences/app').get());
    await assertFails(bob.doc('users/alice/preferences/app').get());
    await assertFails(bob.doc('users/alice/preferences/app').set(validPreferences));
    await assertFails(
      alice.doc('users/alice/preferences/app').set({
        ...validPreferences,
        locale: 'tr',
      }),
    );
    await assertFails(alice.doc('users/alice/preferences/app').delete());
  });

  it('allows an owner to save an active provider and remove the reference', async () => {
    await seedFirestore();
    const alice = testEnvironment.authenticatedContext('alice').firestore();
    const bob = testEnvironment.authenticatedContext('bob').firestore();
    const savedProvider = {
      providerId: 'lina-haddad',
      savedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    await assertSucceeds(alice.doc('users/alice/savedProviders/lina-haddad').set(savedProvider));
    await assertSucceeds(alice.doc('users/alice/savedProviders/lina-haddad').get());
    await assertFails(bob.doc('users/alice/savedProviders/lina-haddad').set(savedProvider));
    await assertFails(
      alice.doc('users/alice/savedProviders/retired-provider').set({
        providerId: 'retired-provider',
        savedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }),
    );
    await assertSucceeds(alice.doc('users/alice/savedProviders/lina-haddad').delete());
  });

  it('allows a patient to read only their own appointments', async () => {
    await seedFirestore();
    const alice = testEnvironment.authenticatedContext('alice').firestore();
    const bob = testEnvironment.authenticatedContext('bob').firestore();

    await assertSucceeds(alice.doc('appointments/alice-appointment').get());
    await assertFails(bob.doc('appointments/alice-appointment').get());
    await assertSucceeds(alice.collection('appointments').where('patientId', '==', 'alice').get());
    await assertFails(bob.collection('appointments').where('patientId', '==', 'alice').get());
    await assertFails(
      alice.doc('appointments/new-appointment').set({
        patientId: 'alice',
        status: 'confirmed',
      }),
    );
  });

  it('denies undeclared collections by default', async () => {
    const alice = testEnvironment.authenticatedContext('alice').firestore();

    await assertFails(alice.doc('admin/private').get());
    await assertFails(alice.doc('admin/private').set({ enabled: true }));
  });
});

describe('Cloud Storage rules', () => {
  it('allows public asset reads but never public client writes', async () => {
    await seedStorage();
    const storage = testEnvironment.unauthenticatedContext().storage(STORAGE_BUCKET);

    await assertSucceeds(storage.ref('public/providers/lina.jpg').getDownloadURL());
    await assertFails(
      upload(storage.ref('public/providers/other.jpg'), new Uint8Array([1]), {
        contentType: 'image/jpeg',
      }),
    );
  });

  it('allows an owner to manage a valid private avatar', async () => {
    const storage = testEnvironment.authenticatedContext('alice').storage(STORAGE_BUCKET);
    const avatar = storage.ref('users/alice/avatars/new-avatar.webp');

    await assertSucceeds(
      upload(avatar, new Uint8Array([1, 2, 3]), {
        contentType: 'image/webp',
      }),
    );
    await assertSucceeds(avatar.getDownloadURL());
    await assertSucceeds(avatar.delete());
  });

  it('denies cross-user avatar access', async () => {
    await seedStorage();
    const bob = testEnvironment.authenticatedContext('bob').storage(STORAGE_BUCKET);

    await assertFails(bob.ref('users/alice/avatars/current.jpg').getDownloadURL());
    await assertFails(
      upload(bob.ref('users/alice/avatars/replacement.jpg'), new Uint8Array([1]), {
        contentType: 'image/jpeg',
      }),
    );
  });

  it('rejects avatars with an unsafe type or excessive size', async () => {
    const storage = testEnvironment.authenticatedContext('alice').storage(STORAGE_BUCKET);

    await assertFails(
      upload(storage.ref('users/alice/avatars/avatar.svg'), new Uint8Array([1]), {
        contentType: 'image/svg+xml',
      }),
    );
    await assertFails(
      upload(storage.ref('users/alice/avatars/too-large.jpg'), new Uint8Array(5 * 1024 * 1024), {
        contentType: 'image/jpeg',
      }),
    );
  });

  it('denies undeclared storage paths by default', async () => {
    const storage = testEnvironment.authenticatedContext('alice').storage(STORAGE_BUCKET);

    await assertFails(
      upload(storage.ref('admin/private.txt'), new Uint8Array([1]), {
        contentType: 'text/plain',
      }),
    );
  });
});
