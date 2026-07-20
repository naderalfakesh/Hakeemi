import * as Haptics from 'expo-haptics';

import type { HapticFeedback } from './haptics';

export async function triggerHaptic(feedback: HapticFeedback) {
  if (feedback === 'selection') {
    await Haptics.selectionAsync();
    return;
  }

  await Haptics.notificationAsync(
    feedback === 'success'
      ? Haptics.NotificationFeedbackType.Success
      : feedback === 'warning'
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Error,
  );
}
