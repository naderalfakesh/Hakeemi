import { beforeEach, describe, expect, test } from 'e2e';

describe('demo mode and localization', { tags: ['smoke', 'demo'] }, () => {
  beforeEach(async ({ app }) => {
    await app.clearState();
  });

  test('completes onboarding and enters the demo', async ({ screen }) => {
    await screen.getByRole('button', 'Skip onboarding and continue to welcome').tap();

    await screen.getByRole('button', 'Explore the Hakeemi demo without an account').tap();

    await expect(screen.getByText('What would help today?')).toBeVisible();
    await expect(screen.getByText('Next visit')).toBeVisible();
  });

  test('filters clinicians by specialty in Find care', async ({ screen }) => {
    await screen.getByRole('button', 'Skip onboarding and continue to welcome').tap();
    await screen.getByRole('button', 'Explore the Hakeemi demo without an account').tap();
    await screen.getByRole('button', 'Find the right clinician').tap();
    await screen.getByRole('heading', 'Find care').waitFor();
    await screen.getByText('6 clinicians').waitFor();

    await screen.getByRole('button', 'Cardiology').last().tap();

    await expect(screen.getByText('1 clinician')).toBeVisible();
    await expect(screen.getByText('6 clinicians')).toBeHidden();
    await expect(
      screen.getByRole('button', 'View profile for Dr. Omar Rahman').last(),
    ).toBeVisible();
  });

  test('switches to dark appearance and Arabic copy from Profile', async ({ screen }) => {
    await screen.getByRole('button', 'Skip onboarding and continue to welcome').tap();
    await screen.getByRole('button', 'Explore the Hakeemi demo without an account').tap();
    await screen.getByRole('tab', 'Profile').or(screen.getByRole('group', 'Profile')).first().tap();
    const darkChoice = screen.getByRole('button', 'Dark');
    await screen.scrollUntilVisible(darkChoice);
    await darkChoice.tap();
    const arabicChoice = screen.getByRole('button', 'العربية');
    await screen.scrollUntilVisible(arabicChoice);

    await arabicChoice.tap();

    await expect(
      screen.getByText('كيف يمكننا مساعدتك اليوم؟').or(screen.getByText('تفضيلات التطبيق')).first(),
    ).toBeVisible();
  });
});
