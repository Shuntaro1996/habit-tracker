export type Habit = {
  id: string;
  name: string;
  color: string;
  /** 1週間の目標回数（1〜7） */
  goal: number;
  createdAt: string;
};

/** 習慣ID → 日付('YYYY-MM-DD') → できた日なら true */
export type Records = Record<string, Record<string, true>>;

export type AppData = {
  version: 1;
  habits: Habit[];
  records: Records;
};
