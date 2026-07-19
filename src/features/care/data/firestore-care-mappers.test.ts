import {
  CareDataValidationError,
  mapAvailabilitySlotDocument,
  mapClinicDocument,
  mapProviderDocument,
  mapSpecialtyDocument,
} from './firestore-care-mappers';

const timestamp = (isoDate: string) => ({
  toDate: () => new Date(isoDate),
});

describe('Firestore care document mappers', () => {
  it('maps public catalogue documents using the Firestore document ID as canonical', () => {
    expect(
      mapSpecialtyDocument('family-medicine', {
        description: { ar: 'رعاية شاملة', en: 'Whole-person primary care' },
        icon: 'medical-bag',
        id: 'untrusted-field-id',
        isActive: true,
        name: { ar: 'طب الأسرة', en: 'Family medicine' },
        schemaVersion: 1,
        sortOrder: 1,
      }),
    ).toMatchObject({ id: 'family-medicine', name: { en: 'Family medicine' } });

    expect(
      mapClinicDocument('marsa-family-clinic', {
        address: { ar: 'دبي مارينا', en: 'Dubai Marina' },
        city: { ar: 'دبي', en: 'Dubai' },
        isActive: true,
        name: { ar: 'عيادة مرسى للأسرة', en: 'Marsa Family Clinic' },
        timezone: 'Asia/Dubai',
      }),
    ).toMatchObject({ id: 'marsa-family-clinic', timezone: 'Asia/Dubai' });
  });

  it('maps a validated provider and ignores server-only search metadata', () => {
    const provider = mapProviderDocument('lina-haddad', {
      bio: 'Family physician focused on preventive care.',
      clinicIds: ['marsa-family-clinic'],
      consultationFee: { amount: 340, currency: 'AED' },
      credentialSummary: 'MBBS, MRCGP',
      displayName: 'Dr. Lina Haddad',
      image: null,
      isActive: true,
      isFeatured: true,
      languages: ['Arabic', 'English'],
      nextAvailableAt: timestamp('2030-01-01T08:00:00.000Z'),
      ratingSummary: { average: 4.9, count: 128 },
      schemaVersion: 1,
      searchTerms: ['dr. lina haddad'],
      slug: 'lina-haddad',
      specialtyIds: ['family-medicine'],
      visitModes: ['in_person', 'video'],
    });

    expect(provider).toMatchObject({
      displayName: 'Dr. Lina Haddad',
      id: 'lina-haddad',
      visitModes: ['in_person', 'video'],
    });
    expect(provider).not.toHaveProperty('searchTerms');
  });

  it('converts Firestore timestamps to serializable ISO dates', () => {
    expect(
      mapAvailabilitySlotDocument('lina-slot-1', {
        clinicId: 'marsa-family-clinic',
        endsAt: timestamp('2030-01-01T08:30:00.000Z'),
        providerId: 'lina-haddad',
        startsAt: timestamp('2030-01-01T08:00:00.000Z'),
        status: 'available',
        timezone: 'Asia/Dubai',
        visitMode: 'in_person',
      }),
    ).toEqual({
      clinicId: 'marsa-family-clinic',
      endsAt: '2030-01-01T08:30:00.000Z',
      id: 'lina-slot-1',
      providerId: 'lina-haddad',
      startsAt: '2030-01-01T08:00:00.000Z',
      status: 'available',
      timezone: 'Asia/Dubai',
      visitMode: 'in_person',
    });
  });

  it('rejects malformed remote data before it reaches the UI', () => {
    expect(() =>
      mapProviderDocument('broken-provider', {
        displayName: 'Incomplete record',
        isActive: true,
      }),
    ).toThrow(CareDataValidationError);

    expect(() =>
      mapAvailabilitySlotDocument('backwards-slot', {
        clinicId: null,
        endsAt: timestamp('2030-01-01T07:30:00.000Z'),
        providerId: 'lina-haddad',
        startsAt: timestamp('2030-01-01T08:00:00.000Z'),
        status: 'available',
        timezone: 'Asia/Dubai',
        visitMode: 'video',
      }),
    ).toThrow('Invalid availabilitySlots/backwards-slot document');
  });
});
