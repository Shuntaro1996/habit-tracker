import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CARD_PAD, colors } from '../theme';
import type { Habit } from '../types';

type Props = {
  habit: Habit;
  /** 表示中の週の7日分（月〜日）の 'YYYY-MM-DD' */
  dayKeys: string[];
  todayKey: string;
  done: Record<string, true>;
  /** この週にできた回数 */
  count: number;
  onToggle: (dateKey: string) => void;
  onEdit: () => void;
};

export function HabitCard({ habit, dayKeys, todayKey, done, count, onToggle, onEdit }: Props) {
  const achieved = count >= habit.goal;
  const progress = Math.min(count / habit.goal, 1);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable
          onPress={onEdit}
          style={styles.titleArea}
          accessibilityRole="button"
          accessibilityLabel={`${habit.name}を編集`}
        >
          <View style={[styles.dot, { backgroundColor: habit.color }]} />
          <Text style={styles.name} numberOfLines={1}>
            {habit.name}
          </Text>
          {achieved && (
            <View style={[styles.badge, { backgroundColor: habit.color }]}>
              <Text style={styles.badgeText}>達成！</Text>
            </View>
          )}
        </Pressable>
        <Pressable onPress={onEdit} hitSlop={10} accessibilityRole="button">
          <Text style={styles.edit}>編集</Text>
        </Pressable>
      </View>

      <View style={styles.cells}>
        {dayKeys.map((key) => {
          const isDone = !!done[key];
          const isToday = key === todayKey;
          const isFuture = key > todayKey;
          const [, m, d] = key.split('-').map(Number);
          return (
            <View key={key} style={styles.col}>
              <Pressable
                onPress={() => onToggle(key)}
                disabled={isFuture}
                hitSlop={4}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isDone, disabled: isFuture }}
                accessibilityLabel={`${habit.name} ${m}月${d}日`}
                style={({ pressed }) => [
                  styles.cell,
                  isDone && { backgroundColor: habit.color, borderColor: habit.color },
                  !isDone && isToday && { borderColor: habit.color, borderWidth: 2 },
                  isFuture && styles.future,
                  pressed && styles.pressed,
                ]}
              >
                {isDone && <Text style={styles.check}>✓</Text>}
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <View style={styles.track}>
          <View
            style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: habit.color }]}
          />
        </View>
        <Text style={styles.count}>
          <Text style={[styles.countNum, { color: habit.color }]}>{count}</Text> / 週{habit.goal}回
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: CARD_PAD,
    marginBottom: 12,
    boxShadow: '0 1px 3px rgba(20, 30, 60, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  titleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  edit: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.faint,
  },
  cells: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  cell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.cellBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  future: {
    opacity: 0.35,
  },
  pressed: {
    transform: [{ scale: 0.9 }],
  },
  check: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  count: {
    fontSize: 13,
    color: colors.sub,
  },
  countNum: {
    fontSize: 15,
    fontWeight: '800',
  },
});
