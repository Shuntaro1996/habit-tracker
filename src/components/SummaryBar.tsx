import { StyleSheet, Text, View } from 'react-native';

import { colors, LIST_PAD } from '../theme';

type Props = {
  /** 0〜100 */
  rate: number;
  achieved: number;
  total: number;
};

/** その週の目標に対して、どれだけ進んだか */
export function SummaryBar({ rate, achieved, total }: Props) {
  return (
    <View style={styles.box}>
      <View>
        <Text style={styles.caption}>達成率</Text>
        <Text style={styles.rate}>
          {rate}
          <Text style={styles.pct}> %</Text>
        </Text>
      </View>
      <View style={styles.right}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${rate}%` }]} />
        </View>
        <Text style={styles.sub}>
          目標クリア {achieved} / {total} 件
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginHorizontal: LIST_PAD,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    boxShadow: '0 1px 3px rgba(20, 30, 60, 0.08)',
  },
  caption: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.sub,
  },
  rate: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  pct: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.sub,
  },
  right: {
    flex: 1,
    gap: 8,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  sub: {
    fontSize: 13,
    color: colors.sub,
  },
});
