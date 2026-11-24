import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

type VibrateNavigator = { vibrate?: (pattern: number | number[]) => boolean };

/** ブラウザ版の振動。Android の Chrome は振動でき、iPhone の Safari は非対応なので何もしない */
function webVibrate(pattern: number | number[]): void {
  const nav = (globalThis as unknown as { navigator?: VibrateNavigator }).navigator;
  try {
    nav?.vibrate?.(pattern);
  } catch {
    // 振動できない環境では何もしない
  }
}

/** 丸をタップしたときの軽い振動 */
export function tapFeedback(): void {
  if (Platform.OS === 'web') return webVibrate(10);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** 週の目標を達成したときの振動 */
export function successFeedback(): void {
  if (Platform.OS === 'web') return webVibrate([20, 60, 30]);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
