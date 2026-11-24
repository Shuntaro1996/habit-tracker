import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackupSheet } from './components/BackupSheet';
import { DayLabels } from './components/DayLabels';
import { HabitCard } from './components/HabitCard';
import { HabitEditor } from './components/HabitEditor';
import { SummaryBar } from './components/SummaryBar';
import { WeekHeader } from './components/WeekHeader';
import { addDays, startOfWeek, toKey, weekDays } from './dates';
import { successFeedback, tapFeedback } from './haptics';
import { loadLastBackup, saveLastBackup } from './storage';
import { colors, HABIT_COLORS, LIST_PAD, MAX_WIDTH } from './theme';
import type { Habit } from './types';
import { type HabitInput, useHabits } from './useHabits';

/** 最初の画面に出す「おすすめ習慣」 */
const SUGGESTIONS: HabitInput[] = [
  { name: '読書', goal: 5, color: HABIT_COLORS[0] },
  { name: '運動', goal: 3, color: HABIT_COLORS[1] },
  { name: '早起き', goal: 5, color: HABIT_COLORS[2] },
  { name: '日記', goal: 7, color: HABIT_COLORS[4] },
];

/** バックアップはブラウザ版（ホーム画面に追加したアプリ）だけで使える */
const CAN_BACKUP = Platform.OS === 'web';

/** 編集シートの状態。habit が null なら新規追加 */
type EditorState = { habit: Habit | null } | null;

/** 今日の日付。アプリを開き直したときに日付が変わっていれば更新する */
function useToday(): Date {
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setToday(new Date());
    });
    return () => sub.remove();
  }, []);
  return today;
}

export default function HomeScreen() {
  const { habits, records, ready, addHabit, updateHabit, deleteHabit, toggle, replaceAll } =
    useHabits();
  const today = useToday();
  const [offset, setOffset] = useState(0);
  const [editor, setEditor] = useState<EditorState>(null);
  const [backupOpen, setBackupOpen] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  useEffect(() => {
    if (CAN_BACKUP) loadLastBackup().then(setLastBackup);
  }, []);

  const todayKey = toKey(today);
  const weekStart = addDays(startOfWeek(today), offset * 7);
  const days = weekDays(weekStart);
  const dayKeys = days.map(toKey);

  // 習慣ごとの「この週にできた回数」と、週全体の達成率
  const counts = habits.map((h) => dayKeys.filter((k) => records[h.id]?.[k]).length);
  const totalGoal = habits.reduce((sum, h) => sum + h.goal, 0);
  const totalDone = habits.reduce((sum, h, i) => sum + Math.min(counts[i], h.goal), 0);
  const rate = totalGoal ? Math.round((totalDone / totalGoal) * 100) : 0;
  const achieved = habits.filter((h, i) => counts[i] >= h.goal).length;

  const nextColor =
    HABIT_COLORS.find((c) => !habits.some((h) => h.color === c)) ??
    HABIT_COLORS[habits.length % HABIT_COLORS.length];

  const handleToggle = (habit: Habit, dateKey: string, count: number) => {
    const willCheck = !records[habit.id]?.[dateKey];
    if (willCheck && count + 1 === habit.goal) successFeedback();
    else tapFeedback();
    toggle(habit.id, dateKey);
  };

  if (!ready) {
    return (
      <View style={[styles.root, styles.loading]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <WeekHeader
          weekStart={weekStart}
          today={today}
          offset={offset}
          onPrev={() => setOffset((o) => o - 1)}
          onNext={() => setOffset((o) => Math.min(0, o + 1))}
          onThisWeek={() => setOffset(0)}
        />

        {habits.length > 0 && (
          <>
            <SummaryBar rate={rate} achieved={achieved} total={habits.length} />
            <DayLabels days={days} todayKey={todayKey} />
          </>
        )}

        <ScrollView contentContainerStyle={styles.list}>
          {habits.length === 0 ? (
            <EmptyState
              onPick={addHabit}
              onCustom={() => setEditor({ habit: null })}
              onRestore={CAN_BACKUP ? () => setBackupOpen(true) : undefined}
            />
          ) : (
            <>
              {habits.map((h, i) => (
                <HabitCard
                  key={h.id}
                  habit={h}
                  dayKeys={dayKeys}
                  todayKey={todayKey}
                  done={records[h.id] ?? {}}
                  count={counts[i]}
                  onToggle={(key) => handleToggle(h, key, counts[i])}
                  onEdit={() => setEditor({ habit: h })}
                />
              ))}
              <Pressable
                onPress={() => setEditor({ habit: null })}
                accessibilityRole="button"
                style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
              >
                <Text style={styles.addButtonText}>＋ 習慣を追加</Text>
              </Pressable>
              <Text style={styles.hint}>丸をタップして記録 ・ 名前をタップで編集</Text>
              {CAN_BACKUP && (
                <Pressable
                  onPress={() => setBackupOpen(true)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.backupLink, pressed && styles.backupLinkPressed]}
                >
                  <Text style={styles.backupLinkText}>バックアップ</Text>
                  <Text style={styles.backupLinkSub}>
                    {lastBackup ? `前回 ${formatShortDate(lastBackup)}` : 'まだしていません'}
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </ScrollView>
      </View>

      {backupOpen && (
        <BackupSheet
          data={{ version: 1, habits, records }}
          lastBackup={lastBackup}
          onExported={(iso) => {
            setLastBackup(iso);
            saveLastBackup(iso);
          }}
          onRestore={(data) => {
            replaceAll(data);
            setOffset(0);
            setBackupOpen(false);
            successFeedback();
          }}
          onClose={() => setBackupOpen(false)}
        />
      )}

      {editor && (
        <HabitEditor
          habit={editor.habit}
          defaultColor={nextColor}
          onClose={() => setEditor(null)}
          onSave={(input) => {
            if (editor.habit) updateHabit(editor.habit.id, input);
            else addHabit(input);
            setEditor(null);
          }}
          onDelete={
            editor.habit
              ? () => {
                  deleteHabit(editor.habit!.id);
                  setEditor(null);
                }
              : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}/${d.getDate()}`;
}

function EmptyState({
  onPick,
  onCustom,
  onRestore,
}: {
  onPick: (input: HabitInput) => void;
  onCustom: () => void;
  /** バックアップから戻す（使えない環境では渡さない） */
  onRestore?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🌱</Text>
      <Text style={styles.emptyTitle}>続けたい習慣を追加しましょう</Text>
      <Text style={styles.emptyText}>
        1週間ごとに、できた日をタップして記録します。{'\n'}週に何回やるか、目標も決められます。
      </Text>

      <Text style={styles.emptyLabel}>おすすめから選ぶ</Text>
      <View style={styles.suggestions}>
        {SUGGESTIONS.map((s) => (
          <Pressable
            key={s.name}
            onPress={() => onPick(s)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
          >
            <Text style={styles.chipText}>
              ＋ {s.name}
              <Text style={styles.chipSub}>（週{s.goal}回）</Text>
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={onCustom} accessibilityRole="button" style={styles.emptyAddButton}>
        <Text style={styles.emptyAddText}>自分で追加する</Text>
      </Pressable>

      {onRestore && (
        <Pressable onPress={onRestore} accessibilityRole="button" style={styles.restoreLink}>
          <Text style={styles.restoreLinkText}>バックアップから戻す</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
  },
  list: {
    paddingHorizontal: LIST_PAD,
    paddingBottom: 32,
  },
  addButton: {
    marginTop: 4,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C5CAD8',
    alignItems: 'center',
  },
  addButtonPressed: {
    backgroundColor: colors.border,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  hint: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 12,
    color: colors.faint,
  },
  backupLink: {
    marginTop: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  backupLinkPressed: {
    backgroundColor: colors.border,
  },
  backupLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  backupLinkSub: {
    fontSize: 12,
    color: colors.faint,
  },
  restoreLink: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  restoreLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 8,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: colors.sub,
  },
  emptyLabel: {
    marginTop: 28,
    fontSize: 12,
    fontWeight: '600',
    color: colors.faint,
  },
  suggestions: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipPressed: {
    backgroundColor: colors.border,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  chipSub: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.sub,
  },
  emptyAddButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  emptyAddText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
