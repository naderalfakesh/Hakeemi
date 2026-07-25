import { FixtureCareRepository } from './fixture-care-repository';
import { clinicFixtures, providerFixtures, specialtyFixtures } from './fixtures';
import { createAvailabilityWindow } from '../domain/availability';

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
    const slots = await repository.listAvailableSlots('lina-haddad', createAvailabilityWindow(now));

    expect(slots).toHaveLength(7);
    expect(slots.every((slot) => new Date(slot.startsAt) > now)).toBe(true);
    expect(slots[0]?.timezone).toBe('Asia/Dubai');
  });

  it('filters providers by specialty and human search terms', async () => {
    const repository = new FixtureCareRepository();

    await expect(repository.listProviderPage({ specialtyId: 'cardiology' })).resolves.toMatchObject(
      { items: [expect.objectContaining({ id: 'omar-rahman' })] },
    );
    await expect(repository.listProviderPage({ query: 'Malayalam' })).resolves.toMatchObject({
      items: [expect.objectContaining({ id: 'priya-menon' })],
    });
    await expect(repository.listProviderPage({ query: 'family medicine' })).resolves.toMatchObject({
      items: [expect.objectContaining({ id: 'lina-haddad' })],
    });
  });

  it('paginates with an opaque stable cursor', async () => {
    const repository = new FixtureCareRepository();
    const firstPage = await repository.listProviderPage({}, null, 2);
    const secondPage = await repository.listProviderPage({}, firstPage.nextCursor, 2);

    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.nextCursor).not.toBeNull();
    expect(secondPage.items).toHaveLength(2);
    expect(secondPage.items.map(({ id }) => id)).not.toEqual(firstPage.items.map(({ id }) => id));
  });
});
