import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { exportBackup, type ParsedBackup, parseBackup, pickBackupFile } from '../backup';
import { colors, MAX_WIDTH } from '../theme';
import type { AppData } from '../types';

type Props = {
  data: AppData;
  /** 最後に書き出した日時（ISO 文字列）。まだなら null */
  lastBackup: string | null;
  onExported: (iso: string) => void;
  onRestore: (data: AppData) => void;
  onClose: () => void;
};

type Message = { kind: 'ok' | 'error'; text: string } | null;

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '不明';
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

/** 記録の書き出し（バックアップ）と、バックアップからの読み込みをする下からのシート */
export function BackupSheet({ data, lastBackup, onExported, onRestore, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<Message>(null);
  const [pending, setPending] = useState<ParsedBackup | null>(null);
  const hasHabits = data.habits.length > 0;

  const handleExport = () => {
    setMessage(null);
    exportBackup(data)
      .then((result) => {
        if (result === 'cancelled') return;
        onExported(new Date().toISOString());
        setMessage({
          kind: 'ok',
          text:
            result === 'shared'
              ? 'バックアップを書き出しました。'
              : 'バックアップを「ダウンロード」フォルダに保存しました。',
        });
      })
      .catch(() => setMessage({ kind: 'error', text: '書き出せませんでした。もう一度お試しください。' }));
  };

  const handlePick = () => {
    setMessage(null);
    pickBackupFile().then((text) => {
      if (text === null) return;
      const parsed = parseBackup(text);
      if (parsed) setPending(parsed);
      else
        setMessage({
          kind: 'error',
          text: 'このファイルは読み込めません。習慣トラッカーで書き出したファイルを選んでください。',
        });
    });
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="閉じる" />

        <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}>
          {pending ? (
            <>
              <Text style={styles.title}>この内容で読み込みますか？</Text>
              <View style={styles.summary}>
                <SummaryRow
                  label="書き出した日"
                  value={pending.exportedAt ? formatDate(pending.exportedAt) : '不明'}
                />
                <SummaryRow label="習慣" value={`${pending.habitCount}個`} />
                <SummaryRow label="できた記録" value={`${pending.checkCount}回分`} />
              </View>
              {hasHabits && (
                <Text style={styles.warning}>
                  いまアプリにある習慣と記録は、すべてこの内容に置き換わります。
                </Text>
              )}
              <View style={styles.actions}>
                <Pressable
                  onPress={() => setPending(null)}
                  accessibilityRole="button"
                  style={[styles.button, styles.secondaryButton]}
                >
                  <Text style={styles.secondaryText}>やめる</Text>
                </Pressable>
                <Pressable
                  onPress={() => onRestore(pending.data)}
                  accessibilityRole="button"
                  style={[
                    styles.button,
                    { backgroundColor: hasHabits ? colors.danger : colors.primary },
                  ]}
                >
                  <Text style={styles.primaryText}>{hasHabits ? '置き換える' : '読み込む'}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>バックアップ</Text>
              <Text style={styles.lead}>
                記録をファイルに保存しておくと、アプリを消してしまったときや、スマホを買い替えたときに元に戻せます。
              </Text>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>記録を書き出す</Text>
                <Text style={styles.sectionSub}>
                  {lastBackup ? `前回：${formatDate(lastBackup)}` : 'まだ書き出していません'}
                </Text>
                <Pressable
                  onPress={handleExport}
                  disabled={!hasHabits}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !hasHabits }}
                  style={({ pressed }) => [
                    styles.wideButton,
                    styles.primaryButton,
                    pressed && styles.pressed,
                    !hasHabits && styles.disabled,
                  ]}
                >
                  <Text style={styles.primaryText}>書き出す</Text>
                </Pressable>
                <Text style={styles.tip}>
                  {hasHabits
                    ? 'iPhone：メニューから「“ファイル”に保存」を選ぶ\nAndroid：「ダウンロード」フォルダに保存されます'
                    : '習慣を追加すると書き出せます'}
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>バックアップから戻す</Text>
                <Text style={styles.sectionSub}>書き出したファイルを選ぶと、その時点の記録に戻ります。</Text>
                <Pressable
                  onPress={handlePick}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.wideButton,
                    styles.outlineButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.outlineText}>ファイルを選ぶ</Text>
                </Pressable>
              </View>

              {message && (
                <Text
                  accessibilityLiveRegion="polite"
                  style={[styles.message, message.kind === 'error' && styles.messageError]}
                >
                  {message.text}
                </Text>
              )}

              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                style={[styles.wideButton, styles.secondaryButton, styles.closeButton]}
              >
                <Text style={styles.secondaryText}>閉じる</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
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
  lead: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: colors.sub,
  },
  section: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.cellBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  sectionSub: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: colors.sub,
  },
  tip: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: colors.faint,
  },
  wideButton: {
    marginTop: 12,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  outlineText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  secondaryButton: {
    backgroundColor: '#EEF0F5',
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    marginTop: 16,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.4,
  },
  message: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    color: '#0F8A5F',
    textAlign: 'center',
  },
  messageError: {
    color: colors.danger,
  },
  summary: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cellBg,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.sub,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  warning: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    color: colors.danger,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
