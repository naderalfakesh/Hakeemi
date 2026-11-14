import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { buildDemoAppointmentFixtures } from '@/features/appointments/data/demo-appointment-repository';
import { fixtureCareRepository } from '@/features/care/data/fixture-care-repository';
import { AppLocaleProvider } from '@/localization/locale-provider';
import { TestAppProviders } from '@/test/test-app-providers';

import { HomeScreen } from './home-screen';

describe('HomeScreen', () => {
  it('surfaces fixture-backed recommendations and opens a provider', async () => {
    const onSelectProvider = jest.fn();
    const view = await render(
      <TestAppProviders colorScheme="dark">
        <HomeScreen
          onFindCare={jest.fn()}
          onSelectProvider={onSelectProvider}
          repository={fixtureCareRepository}
        />
      </TestAppProviders>,
    );

    const provider = await waitFor(() =>
      view.getByRole('button', { name: 'View profile for Dr. Lina Haddad' }),
    );
    await fireEvent.press(provider);

    expect(view.getByRole('header', { name: 'What would help today?' })).toBeVisible();
    expect(onSelectProvider).toHaveBeenCalledWith('lina-haddad');
  });

  it('renders Arabic copy when the app locale is Arabic', async () => {
    const view = await render(
      <TestAppProviders colorScheme="light">
        <AppLocaleProvider locale="ar">
          <HomeScreen
            onFindCare={jest.fn()}
            onSelectProvider={jest.fn()}
            repository={fixtureCareRepository}
          />
        </AppLocaleProvider>
      </TestAppProviders>,
    );

    await waitFor(() =>
      expect(
        view.getByRole('button', { name: 'عرض الملف الشخصي للطبيب د. لينا حداد' }),
      ).toBeVisible(),
    );

    expect(view.getByRole('header', { name: 'كيف يمكننا مساعدتك اليوم؟' })).toBeVisible();
    expect(view.getAllByText('طب الأسرة').length).toBeGreaterThan(0);
  });

  it('leads with the next visit and marks demo data', async () => {
    const onOpenAppointment = jest.fn();
    const [appointment] = buildDemoAppointmentFixtures();

    if (!appointment) {
      throw new Error('The demo fixtures need an upcoming visit.');
    }

    const view = await render(
      <TestAppProviders colorScheme="light">
        <HomeScreen
          isDemo
          nextVisit={{ appointment, providerName: 'Dr. Omar Nasser' }}
          onFindCare={jest.fn()}
          onOpenAppointment={onOpenAppointment}
          onSelectProvider={jest.fn()}
          repository={fixtureCareRepository}
        />
      </TestAppProviders>,
    );

    expect(view.getByText('Demo mode')).toBeVisible();
    await fireEvent.press(
      view.getByRole('button', { name: /^Next visit with Dr\. Omar Nasser, / }),
    );

    expect(onOpenAppointment).toHaveBeenCalledWith(appointment.id);
  });

  it('leaves the next visit out when there is none', async () => {
    const view = await render(
      <TestAppProviders colorScheme="light">
        <HomeScreen
          onFindCare={jest.fn()}
          onOpenAppointment={jest.fn()}
          onSelectProvider={jest.fn()}
          repository={fixtureCareRepository}
        />
      </TestAppProviders>,
    );

    await waitFor(() =>
      expect(view.getByRole('button', { name: 'View profile for Dr. Lina Haddad' })).toBeVisible(),
    );
    expect(view.queryByText('Next visit')).toBeNull();
    expect(view.queryByText('Demo mode')).toBeNull();
  });

  it('opens Find care scoped to a tapped specialty quick-chip', async () => {
    const onSelectSpecialty = jest.fn();
    const view = await render(
      <TestAppProviders colorScheme="light">
        <HomeScreen
          onFindCare={jest.fn()}
          onSelectProvider={jest.fn()}
          onSelectSpecialty={onSelectSpecialty}
          repository={fixtureCareRepository}
        />
      </TestAppProviders>,
    );

    const cardiologyChip = await waitFor(() => view.getByRole('button', { name: 'Cardiology' }));
    await fireEvent.press(cardiologyChip);

    expect(onSelectSpecialty).toHaveBeenCalledWith('cardiology');
  });
});
