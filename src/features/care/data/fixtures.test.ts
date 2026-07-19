import { FixtureCareRepository } from './fixture-care-repository';
import { clinicFixtures, providerFixtures, specialtyFixtures } from './fixtures';

describe('fictional care fixtures', () => {
  it('uses unique identifiers and valid relationships', () => {
    expect(new Set(providerFixtures.map((provider) => provider.id))).toHaveProperty(
      'size',
      providerFixtures.length,
    );
    expect(new Set(providerFixtures.map((provider) => provider.slug))).toHaveProperty(
      'size',
      providerFixtures.length,
    );

    const specialtyIds = new Set(specialtyFixtures.map((specialty) => specialty.id));
    const clinicIds = new Set(clinicFixtures.map((clinic) => clinic.id));

    for (const provider of providerFixtures) {
      expect(provider.specialtyIds.every((id) => specialtyIds.has(id))).toBe(true);
      expect(provider.clinicIds.every((id) => clinicIds.has(id))).toBe(true);
    }
  });

  it('builds future availability relative to the repository clock', async () => {
    const now = new Date('2026-07-19T08:00:00.000Z');
    const repository = new FixtureCareRepository(() => now);
    const slots = await repository.listAvailableSlots('lina-haddad');

    expect(slots).toHaveLength(2);
    expect(slots.every((slot) => new Date(slot.startsAt) > now)).toBe(true);
    expect(slots[0]?.timezone).toBe('Asia/Dubai');
  });

  it('filters providers by specialty and human search terms', async () => {
    const repository = new FixtureCareRepository();

    await expect(repository.listProviders({ specialtyId: 'cardiology' })).resolves.toEqual([
      expect.objectContaining({ id: 'omar-rahman' }),
    ]);
    await expect(repository.listProviders({ query: 'Malayalam' })).resolves.toEqual([
      expect.objectContaining({ id: 'priya-menon' }),
    ]);
    await expect(repository.listProviders({ query: 'family medicine' })).resolves.toEqual([
      expect.objectContaining({ id: 'lina-haddad' }),
    ]);
  });
});
