import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, HABIT_COLOR_NAMES, HABIT_COLORS, MAX_WIDTH } from '../theme';
import type { Habit } from '../types';
import type { HabitInput } from '../useHabits';

type Props = {
  /** null なら新規追加 */
  habit: Habit | null;
  defaultColor: string;
  onSave: (input: HabitInput) => void;
  /** 編集のときだけ渡す */
  onDelete?: () => void;
  onClose: () => void;
};

const GOALS = [1, 2, 3, 4, 5, 6, 7];

/** 習慣の追加・編集・削除をする下からのシート */
export function HabitEditor({ habit, defaultColor, onSave, onDelete, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(habit?.name ?? '');
  const [goal, setGoal] = useState(habit?.goal ?? 3);
  const [color, setColor] = useState(habit?.color ?? defaultColor);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const trimmed = name.trim();
  const save = () => {
    if (trimmed) onSave({ name: trimmed, goal, color });
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="閉じる" />

        <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}>
          <Text style={styles.title}>{habit ? '習慣を編集' : '習慣を追加'}</Text>

          <Text style={styles.label}>名前</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="例：読書、ストレッチ"
            placeholderTextColor={colors.faint}
            maxLength={20}
            autoFocus={!habit}
            returnKeyType="done"
            onSubmitEditing={save}
            style={styles.input}
          />

          <Text style={styles.label}>
            1週間の目標 <Text style={[styles.labelValue, { color }]}>週{goal}回</Text>
          </Text>
          <View style={styles.goalRow}>
            {GOALS.map((n) => {
              const selected = n === goal;
              return (
                <Pressable
                  key={n}
                  onPress={() => setGoal(n)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`週${n}回`}
                  style={[styles.goalChip, selected && { backgroundColor: color, borderColor: color }]}
                >
                  <Text style={[styles.goalText, selected && styles.goalTextSelected]}>{n}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>色</Text>
          <View style={styles.colorRow}>
            {HABIT_COLORS.map((c, i) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                accessibilityRole="radio"
                accessibilityState={{ selected: c === color }}
                accessibilityLabel={HABIT_COLOR_NAMES[i]}
                style={[styles.swatch, { backgroundColor: c }]}
              >
                {c === color && <Text style={styles.swatchCheck}>✓</Text>}
              </Pressable>
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              style={[styles.button, styles.cancelButton]}
            >
              <Text style={styles.cancelText}>キャンセル</Text>
            </Pressable>
            <Pressable
              onPress={save}
              disabled={!trimmed}
              accessibilityRole="button"
              accessibilityState={{ disabled: !trimmed }}
              style={[styles.button, { backgroundColor: color }, !trimmed && styles.disabled]}
            >
              <Text style={styles.saveText}>保存</Text>
            </Pressable>
          </View>

          {onDelete && (
            <Pressable
              onPress={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
              accessibilityRole="button"
              style={[styles.deleteButton, confirmDelete && styles.deleteButtonConfirm]}
            >
              <Text style={[styles.deleteText, confirmDelete && styles.deleteTextConfirm]}>
                {confirmDelete ? 'もう一度タップで削除（記録も消えます）' : 'この習慣を削除'}
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 20, 35, 0.45)',
  },
  sheet: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.sub,
    marginTop: 18,
    marginBottom: 8,
  },
  labelValue: {
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.cellBg,
  },
  goalRow: {
    flexDirection: 'row',
    gap: 6,
  },
  goalChip: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  goalTextSelected: {
    color: '#fff',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchCheck: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#EEF0F5',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  disabled: {
    opacity: 0.4,
  },
  deleteButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonConfirm: {
    backgroundColor: colors.danger,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger,
  },
  deleteTextConfirm: {
    color: '#fff',
    fontWeight: '700',
  },
});
