import { appointmentRepository } from '@/features/appointments/data/appointment-repository';
import { demoAppointmentRepository } from '@/features/appointments/data/demo-appointment-repository';
import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { careRepository } from '@/features/care/data/care-repository';
import { demoCareRepository } from '@/features/care/data/demo-care-repository';
import type { AppDataScope } from '@/services/query/data-scope';

/**
 * The repositories and cache scope for the current session. Routes read them
 * here and hand them to screens and hooks, so nothing below a route needs to
 * know whether it is showing the demo or a signed-in account.
 */
export function useAppDataSources() {
  const session = useAuthSession();
  const isDemo = session.status === 'demo';
  const scope: AppDataScope = isDemo ? 'demo' : 'account';

  return {
    accountId: session.user?.id ?? null,
    appointmentRepository: isDemo ? demoAppointmentRepository : appointmentRepository,
    careRepository: isDemo ? demoCareRepository : careRepository,
    isDemo,
    scope,
  };
}
