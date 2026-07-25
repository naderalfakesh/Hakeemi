import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, View, type GestureResponderEvent } from 'react-native';

const INDICATOR_SIZE = 48;
const FADE_DURATION_MS = 450;

type ActiveTouch = { id: string; x: number; y: number };
type Ripple = { key: number; x: number; y: number };

function FadingRipple({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      duration: FADE_DURATION_MS,
      toValue: 1,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onDone();
      }
    });
  }, [onDone, progress]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.indicator,
        {
          left: x - INDICATOR_SIZE / 2,
          opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
          top: y - INDICATOR_SIZE / 2,
          transform: [
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) },
          ],
        },
      ]}
    />
  );
}

/**
 * Dev-only visualizer that mirrors every touch as an on-screen dot with a
 * fading ripple on release, so screen recordings show where taps landed.
 * Renders children untouched in production builds.
 */
export function TouchIndicatorOverlay({ children }: { children: ReactNode }) {
  const [activeTouches, setActiveTouches] = useState<ActiveTouch[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleKey = useRef(0);

  const syncActiveTouches = useCallback((event: GestureResponderEvent) => {
    setActiveTouches(
      event.nativeEvent.touches.map((touch) => ({
        id: String(touch.identifier),
        x: touch.pageX,
        y: touch.pageY,
      })),
    );
  }, []);

  const handleTouchEnd = useCallback((event: GestureResponderEvent) => {
    const released = event.nativeEvent.changedTouches.map((touch) => ({
      key: rippleKey.current++,
      x: touch.pageX,
      y: touch.pageY,
    }));
    setRipples((current) => [...current, ...released]);
    setActiveTouches(
      event.nativeEvent.touches.map((touch) => ({
        id: String(touch.identifier),
        x: touch.pageX,
        y: touch.pageY,
      })),
    );
  }, []);

  const removeRipple = useCallback((key: number) => {
    setRipples((current) => current.filter((ripple) => ripple.key !== key));
  }, []);

  if (!__DEV__) {
    return children;
  }

  return (
    <View
      onTouchCancel={handleTouchEnd}
      onTouchEnd={handleTouchEnd}
      onTouchMove={syncActiveTouches}
      onTouchStart={syncActiveTouches}
      style={styles.root}
    >
      {children}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {activeTouches.map((touch) => (
          <View
            key={touch.id}
            style={[
              styles.indicator,
              { left: touch.x - INDICATOR_SIZE / 2, top: touch.y - INDICATOR_SIZE / 2 },
            ]}
          />
        ))}
        {ripples.map((ripple) => (
          <FadingRipple
            key={ripple.key}
            onDone={() => removeRipple(ripple.key)}
            x={ripple.x}
            y={ripple.y}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  indicator: {
    backgroundColor: 'rgba(17, 24, 28, 0.28)',
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: INDICATOR_SIZE / 2,
    borderWidth: 2,
    height: INDICATOR_SIZE,
    position: 'absolute',
    width: INDICATOR_SIZE,
  },
  root: {
    flex: 1,
  },
});
