import { StyleSheet, Text, View } from 'react-native';

import { toKey, WEEKDAY_LABELS } from '../dates';
import { CARD_PAD, colors, LIST_PAD } from '../theme';

type Props = {
  days: Date[];
  todayKey: string;
};

/** 月〜日の見出し。カードの丸と同じ位置に並ぶ */
export function DayLabels({ days, todayKey }: Props) {
  return (
    <View style={styles.row}>
      {days.map((d, i) => {
        const isToday = toKey(d) === todayKey;
        const weekendStyle = i === 5 ? styles.saturday : i === 6 ? styles.sunday : null;
        return (
          <View key={i} style={styles.col}>
            <Text style={[styles.weekday, weekendStyle, isToday && styles.todayWeekday]}>
              {WEEKDAY_LABELS[i]}
            </Text>
            <View style={[styles.datePill, isToday && styles.todayPill]}>
              <Text style={[styles.date, isToday && styles.todayDate]}>{d.getDate()}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: LIST_PAD + CARD_PAD,
    marginTop: 14,
    marginBottom: 8,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  weekday: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.sub,
  },
  saturday: {
    color: colors.saturday,
  },
  sunday: {
    color: colors.sunday,
  },
  todayWeekday: {
    color: colors.primary,
    fontWeight: '800',
  },
  datePill: {
    minWidth: 26,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 999,
    alignItems: 'center',
  },
  todayPill: {
    backgroundColor: colors.primary,
  },
  date: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  todayDate: {
    color: '#fff',
  },
});
