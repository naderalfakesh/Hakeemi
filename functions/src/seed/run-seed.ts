import { applicationDefault, deleteApp, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { buildSeedDocuments } from './build-seed';
import { seedCatalogSchema } from './catalog-schema';

const ALLOWED_PROJECT_IDS = new Set(['demo-hakeemi', 'hakeemi-portfolio-dev']);

type SeedOptions = {
  emulator: boolean;
  projectId: string;
  referenceDate: string;
};

function readOption(argumentsList: readonly string[], optionName: string) {
  const inlineValue = argumentsList.find((argument) => argument.startsWith(`${optionName}=`));

  if (inlineValue !== undefined) {
    return inlineValue.slice(optionName.length + 1);
  }

  const optionIndex = argumentsList.indexOf(optionName);
  return optionIndex >= 0 ? argumentsList[optionIndex + 1] : undefined;
}

function parseOptions(argumentsList: readonly string[]): SeedOptions {
  const projectId = readOption(argumentsList, '--project');
  const referenceDate =
    readOption(argumentsList, '--reference-date') ?? new Date().toISOString().slice(0, 10);
  const emulator = argumentsList.includes('--emulator');

  if (projectId === undefined || !ALLOWED_PROJECT_IDS.has(projectId)) {
    throw new Error(`Seed target must be one of: ${[...ALLOWED_PROJECT_IDS].sort().join(', ')}`);
  }

  if (!emulator && projectId.startsWith('demo-')) {
    throw new Error('A demo-* project ID requires the --emulator flag');
  }

  return { emulator, projectId, referenceDate };
}

async function loadCatalog() {
  const catalogPath = resolve(__dirname, '../../../firebase/seed/catalog.json');
  const catalogSource = await readFile(catalogPath, 'utf8');

  return seedCatalogSchema.parse(JSON.parse(catalogSource) as unknown);
}

async function readReservations(firestore: Firestore, slotIds: readonly string[]) {
  const [confirmedAppointments, existingSlots] = await Promise.all([
    firestore.collection('appointments').where('status', '==', 'confirmed').get(),
    firestore.getAll(
      ...slotIds.map((slotId) => firestore.collection('availabilitySlots').doc(slotId)),
    ),
  ]);
  const reservedSlotIds = new Set<string>();
  const confirmedReservations = new Map<
    string,
    { appointmentId: string; data: Record<string, unknown> }
  >();

  for (const slot of existingSlots) {
    if (slot.exists && slot.get('status') !== 'available') {
      reservedSlotIds.add(slot.id);
    }
  }

  for (const appointment of confirmedAppointments.docs) {
    const data = appointment.data();
    const slotId = typeof data.slotId === 'string' ? data.slotId : null;

    if (!slotId || !slotIds.includes(slotId)) {
      continue;
    }

    if (confirmedReservations.has(slotId)) {
      throw new Error(`Multiple confirmed appointments reserve availability slot ${slotId}.`);
    }

    reservedSlotIds.add(slotId);
    confirmedReservations.set(slotId, { appointmentId: appointment.id, data });
  }

  return { confirmedReservations, reservedSlotIds };
}

async function seed() {
  const options = parseOptions(process.argv.slice(2));

  if (options.emulator) {
    process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
  }

  const app = options.emulator
    ? initializeApp({ projectId: options.projectId }, 'hakeemi-seed')
    : initializeApp(
        { credential: applicationDefault(), projectId: options.projectId },
        'hakeemi-seed',
      );

  try {
    const firestore = getFirestore(app);
    const catalog = await loadCatalog();
    const { confirmedReservations, reservedSlotIds } = await readReservations(
      firestore,
      catalog.slots.map((slot) => slot.id),
    );
    const documents = buildSeedDocuments(
      {
        ...catalog,
        slots: catalog.slots.filter((slot) => !reservedSlotIds.has(slot.id)),
      },
      options.referenceDate,
    );
    const batch = firestore.batch();

    for (const [collectionName, collectionDocuments] of Object.entries(documents)) {
      for (const document of collectionDocuments) {
        batch.set(firestore.collection(collectionName).doc(document.id), document.data);
      }
    }

    for (const [slotId, reservation] of confirmedReservations) {
      const { data } = reservation;

      batch.set(
        firestore.collection('availabilitySlots').doc(slotId),
        {
          appointmentId: reservation.appointmentId,
          clinicId: data.clinicId,
          endsAt: data.endsAt,
          providerId: data.providerId,
          startsAt: data.startsAt,
          status: 'booked',
          timezone: data.timezone,
          updatedAt: data.updatedAt,
          visitMode: data.visitMode,
        },
        { merge: true },
      );
    }

    batch.set(firestore.collection('_meta').doc('seed'), {
      preservedReservationCount: reservedSlotIds.size,
      referenceDate: options.referenceDate,
      version: catalog.version,
    });

    await batch.commit();

    const documentCount = Object.values(documents).reduce(
      (total, collectionDocuments) => total + collectionDocuments.length,
      1,
    );

    console.log(
      `Seeded ${documentCount} fictional documents into ${options.projectId} using ${options.referenceDate}; preserved ${reservedSlotIds.size} reserved slots.`,
    );
  } finally {
    await deleteApp(app);
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
