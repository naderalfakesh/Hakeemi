export type HapticFeedback = 'error' | 'selection' | 'success' | 'warning';

export function triggerHaptic(feedback: HapticFeedback): Promise<void>;
