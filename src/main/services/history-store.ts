import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { HistoryItem } from '../../shared/types';

let cachedHistory: HistoryItem[] | null = null;

function getHistoryPath(): string {
  const userData = app.getPath('userData');
  return path.join(userData, 'convertflow-history.json');
}

export async function getHistory(): Promise<HistoryItem[]> {
  if (cachedHistory) return cachedHistory;

  const filePath = getHistoryPath();
  try {
    if (fs.existsSync(filePath)) {
      const data = await fs.promises.readFile(filePath, 'utf-8');
      cachedHistory = JSON.parse(data);
      return cachedHistory || [];
    }
  } catch (err) {
    console.error('Failed to read history:', err);
  }
  cachedHistory = [];
  return cachedHistory;
}

export async function addHistoryItem(
  item: HistoryItem,
): Promise<HistoryItem[]> {
  const list = await getHistory();
  const updated = [item, ...list.filter((x) => x.id !== item.id)].slice(0, 100);
  cachedHistory = updated;

  const filePath = getHistoryPath();
  try {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(updated, null, 2),
      'utf-8',
    );
  } catch (err) {
    console.error('Failed to write history:', err);
  }

  return updated;
}

export async function removeHistoryItem(id: string): Promise<boolean> {
  const list = await getHistory();
  const filtered = list.filter((x) => x.id !== id);
  cachedHistory = filtered;

  const filePath = getHistoryPath();
  try {
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(filtered, null, 2),
      'utf-8',
    );
    return true;
  } catch {
    return false;
  }
}

export async function clearHistory(): Promise<boolean> {
  cachedHistory = [];
  const filePath = getHistoryPath();
  try {
    await fs.promises.writeFile(filePath, JSON.stringify([], null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}
