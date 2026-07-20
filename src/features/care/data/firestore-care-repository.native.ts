import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type Firestore,
  type QueryConstraint,
} from '@react-native-firebase/firestore';

import type { CareRepository, ProviderPageCursor } from '../domain/repository';
import { parseAvailabilityWindow } from '../domain/availability';
import type { AvailabilityWindow, ProviderSearch, Specialty } from '../domain/types';
import {
  mapAvailabilitySlotDocument,
  mapClinicDocument,
  mapProviderDocument,
  mapSpecialtyDocument,
} from './firestore-care-mappers';
import { selectProviders } from './selectors';
import { createProviderCursor, parseProviderCursor } from './provider-cursor';

const DEFAULT_PROVIDER_PAGE_SIZE = 12;
const MAX_PROVIDER_PAGE_SIZE = 20;
const SLOT_RESULT_LIMIT = 31;

export class FirestoreCareRepository implements CareRepository {
  private specialtiesRequest: Promise<readonly Specialty[]> | null = null;

  public constructor(private readonly firestore: Firestore = getFirestore()) {}

  public async getClinic(id: string) {
    const snapshot = await getDoc(doc(this.firestore, 'clinics', id));
    return snapshot.exists() ? mapClinicDocument(snapshot.id, snapshot.data()) : null;
  }

  public async getProvider(id: string) {
    const snapshot = await getDoc(doc(this.firestore, 'providers', id));
    return snapshot.exists() ? mapProviderDocument(snapshot.id, snapshot.data()) : null;
  }

  public async listAvailableSlots(providerId: string, window: AvailabilityWindow) {
    const { endsBefore, startsAtOrAfter } = parseAvailabilityWindow(window);
    const snapshot = await getDocs(
      query(
        collection(this.firestore, 'availabilitySlots'),
        where('providerId', '==', providerId),
        where('status', '==', 'available'),
        where('startsAt', '>=', startsAtOrAfter),
        where('startsAt', '<', endsBefore),
        orderBy('startsAt', 'asc'),
        limit(SLOT_RESULT_LIMIT),
      ),
    );

    return snapshot.docs.map((document) =>
      mapAvailabilitySlotDocument(document.id, document.data()),
    );
  }

  public async listClinics() {
    const snapshot = await getDocs(
      query(collection(this.firestore, 'clinics'), where('isActive', '==', true)),
    );

    return snapshot.docs
      .map((document) => mapClinicDocument(document.id, document.data()))
      .sort((left, right) => left.name.en.localeCompare(right.name.en));
  }

  public async listProviderPage(
    search: ProviderSearch = {},
    cursor: ProviderPageCursor | null = null,
    requestedPageSize = DEFAULT_PROVIDER_PAGE_SIZE,
  ) {
    const pageSize = Number.isFinite(requestedPageSize)
      ? Math.max(1, Math.min(Math.floor(requestedPageSize), MAX_PROVIDER_PAGE_SIZE))
      : DEFAULT_PROVIDER_PAGE_SIZE;
    const constraints: QueryConstraint[] = [where('isActive', '==', true)];

    if (search.specialtyId) {
      constraints.push(where('specialtyIds', 'array-contains', search.specialtyId));
    }

    constraints.push(
      orderBy('isFeatured', 'desc'),
      orderBy('displayName', 'asc'),
      orderBy(documentId(), 'asc'),
    );

    if (cursor) {
      constraints.push(startAfter(...parseProviderCursor(cursor)));
    }

    constraints.push(limit(pageSize + 1));

    const [providerSnapshot, specialties] = await Promise.all([
      getDocs(query(collection(this.firestore, 'providers'), ...constraints)),
      this.listSpecialties(),
    ]);
    const pageDocuments = providerSnapshot.docs.slice(0, pageSize);
    const providers = pageDocuments.map((document) =>
      mapProviderDocument(document.id, document.data()),
    );
    const lastProvider = providers[providers.length - 1];

    return {
      items: selectProviders(providers, specialties, search),
      nextCursor:
        providerSnapshot.size > pageSize && lastProvider !== undefined
          ? createProviderCursor(lastProvider)
          : null,
    };
  }

  public async listSpecialties() {
    if (this.specialtiesRequest) {
      return this.specialtiesRequest;
    }

    this.specialtiesRequest = this.fetchSpecialties().catch((error: unknown) => {
      this.specialtiesRequest = null;
      throw error;
    });

    return this.specialtiesRequest;
  }

  private async fetchSpecialties() {
    const snapshot = await getDocs(
      query(collection(this.firestore, 'specialties'), where('isActive', '==', true)),
    );

    return snapshot.docs
      .map((document) => mapSpecialtyDocument(document.id, document.data()))
      .sort((left, right) => left.sortOrder - right.sortOrder);
  }
}
