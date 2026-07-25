import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { appointmentRepository } from '@/features/appointments/data/appointment-repository';
import { demoAppointmentRepository } from '@/features/appointments/data/demo-appointment-repository';
import { careRepository } from '@/features/care/data/care-repository';
import { demoCareRepository } from '@/features/care/data/demo-care-repository';

export type AppDataScope = 'account' | 'demo';

export function useAppDataSources() {
  const session = useAuthSession();
  const isDemo = session.status === 'demo';

  return {
    appointmentRepository: isDemo ? demoAppointmentRepository : appointmentRepository,
    careRepository: isDemo ? demoCareRepository : careRepository,
    isDemo,
    scope: (isDemo ? 'demo' : 'account') as AppDataScope,
  };
}
