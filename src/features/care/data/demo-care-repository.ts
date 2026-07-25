import { demoAppointmentRepository } from '@/features/appointments/data/demo-appointment-repository';
import type { AppointmentRepository } from '@/features/appointments/domain/repository';

import type { CareRepository } from '../domain/repository';
import type { AvailabilityWindow, ProviderSearch } from '../domain/types';
import { fixtureCareRepository } from './fixture-care-repository';

export class DemoCareRepository implements CareRepository {
  public constructor(
    private readonly careRepository: CareRepository = fixtureCareRepository,
    private readonly appointmentRepository: AppointmentRepository = demoAppointmentRepository,
  ) {}

  public getClinic(id: string) {
    return this.careRepository.getClinic(id);
  }

  public getProvider(id: string) {
    return this.careRepository.getProvider(id);
  }

  public async listAvailableSlots(providerId: string, window: AvailabilityWindow) {
    const [slots, appointments] = await Promise.all([
      this.careRepository.listAvailableSlots(providerId, window),
      this.appointmentRepository.listAppointments(),
    ]);
    const reservedSlotIds = new Set(
      appointments
        .filter((appointment) => appointment.status === 'confirmed')
        .map((appointment) => appointment.slotId),
    );

    return slots.filter((slot) => !reservedSlotIds.has(slot.id));
  }

  public listClinics() {
    return this.careRepository.listClinics();
  }

  public listProviderPage(search?: ProviderSearch, cursor?: string | null, pageSize?: number) {
    return this.careRepository.listProviderPage(search, cursor, pageSize);
  }

  public listSpecialties() {
    return this.careRepository.listSpecialties();
  }
}

export const demoCareRepository: CareRepository = new DemoCareRepository();
