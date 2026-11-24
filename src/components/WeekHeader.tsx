import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatRange, weekLabel } from '../dates';
import { colors, LIST_PAD } from '../theme';

type Props = {
  weekStart: Date;
  today: Date;
  /** 0 = 今週, -1 = 先週 … */
  offset: number;
  onPrev: () => void;
  onNext: () => void;
  onThisWeek: () => void;
};

export function WeekHeader({ weekStart, today, offset, onPrev, onNext, onThisWeek }: Props) {
  const isThisWeek = offset === 0;

  return (
    <View style={styles.row}>
      <ArrowButton direction="prev" onPress={onPrev} />

      <View style={styles.center}>
        <Text style={styles.appName}>習慣トラッカー</Text>
        <Text style={styles.label}>{weekLabel(offset)}</Text>
        <View style={styles.rangeRow}>
          <Text style={styles.range}>{formatRange(weekStart, today)}</Text>
          {!isThisWeek && (
            <Pressable
              onPress={onThisWeek}
              hitSlop={8}
              accessibilityRole="button"
              style={styles.thisWeekPill}
            >
              <Text style={styles.thisWeekText}>今週へ</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* 未来の週は記録できないので、今週より先には進めない */}
      <ArrowButton direction="next" onPress={onNext} disabled={isThisWeek} />
    </View>
  );
}

function ArrowButton({
  direction,
  onPress,
  disabled,
}: {
  direction: 'prev' | 'next';
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={direction === 'prev' ? '前の週' : '次の週'}
      style={({ pressed }) => [
        styles.arrow,
        disabled && styles.arrowDisabled,
        pressed && styles.arrowPressed,
      ]}
    >
      <Text style={styles.arrowText}>{direction === 'prev' ? '‹' : '›'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: LIST_PAD,
    paddingTop: 8,
    paddingBottom: 14,
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  appName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.faint,
    letterSpacing: 1,
  },
  label: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    minHeight: 22,
  },
  range: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.sub,
  },
  thisWeekPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  thisWeekText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  arrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  arrowDisabled: {
    opacity: 0.3,
  },
  arrowPressed: {
    backgroundColor: colors.border,
  },
  arrowText: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '600',
    color: colors.text,
  },
});
