export interface Storage {
  getLastRemindedDate(): string | null;
  setLastRemindedDate(date: string): void;
}
