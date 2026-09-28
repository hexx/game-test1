import type { SaveData } from './types';

const SAVE_PREFIX = 'midnight-blend.save.';
const SETTINGS_KEY = 'midnight-blend.settings.v1';
export const SAVE_VERSION = 1;

export type SlotId = 'auto' | '1' | '2' | '3';

export interface Settings {
  textSpeed: number; // ms per char
  autoDelay: number; // ms after a line in auto mode
  music: number; // 0..1
  ambient: number; // 0..1
  sfx: number; // 0..1
  muted: boolean;
  showHints: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  textSpeed: 26,
  autoDelay: 1400,
  music: 0.5,
  ambient: 0.45,
  sfx: 0.6,
  muted: false,
  showHints: true,
};

export function createSave(name = 'カイ'): SaveData {
  return {
    version: SAVE_VERSION,
    chapter: 'prologue',
    scene: 'p0',
    frames: [],
    name,
    nightsDone: [],
    flags: {},
    trust: {},
    drinks: [],
    discovered: [],
    hints: [],
    choices: [],
    playtimeMs: 0,
    savedAt: Date.now(),
  };
}

export interface SlotMeta {
  slot: SlotId;
  exists: boolean;
  savedAt?: number;
  chapterTitle?: string;
  sceneTitle?: string;
  playtimeMs?: number;
  nights?: number;
}

function safeStorage(): Storage | null {
  try {
    const s = globalThis.localStorage;
    const k = '__mb_probe__';
    s.setItem(k, '1');
    s.removeItem(k);
    return s;
  } catch {
    return null;
  }
}

const memory = new Map<string, string>();
const fallback: Storage = {
  get length() {
    return memory.size;
  },
  clear: () => memory.clear(),
  getItem: (k: string) => memory.get(k) ?? null,
  key: (i: number) => [...memory.keys()][i] ?? null,
  removeItem: (k: string) => void memory.delete(k),
  setItem: (k: string, v: string) => void memory.set(k, v),
} as Storage;

const storage: Storage = safeStorage() ?? fallback;

export function loadSettings(): Settings {
  try {
    const raw = storage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function persistSettings(s: Settings): void {
  try {
    storage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* 容量超過などは無視する */
  }
}

export function saveToSlot(slot: SlotId, data: SaveData): boolean {
  try {
    const payload: SaveData = { ...data, version: SAVE_VERSION, savedAt: Date.now() };
    storage.setItem(SAVE_PREFIX + slot, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function loadFromSlot(slot: SlotId): SaveData | null {
  try {
    const raw = storage.getItem(SAVE_PREFIX + slot);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveData;
    if (!parsed || typeof parsed !== 'object') return null;
    return migrate(parsed);
  } catch {
    return null;
  }
}

export function deleteSlot(slot: SlotId): void {
  storage.removeItem(SAVE_PREFIX + slot);
}

export function hasAnySave(): boolean {
  return (['auto', '1', '2', '3'] as SlotId[]).some((s) => storage.getItem(SAVE_PREFIX + s) !== null);
}

export function latestSave(): { slot: SlotId; data: SaveData } | null {
  let best: { slot: SlotId; data: SaveData } | null = null;
  for (const slot of ['auto', '1', '2', '3'] as SlotId[]) {
    const data = loadFromSlot(slot);
    if (data && (!best || data.savedAt > best.data.savedAt)) best = { slot, data };
  }
  return best;
}

export function slotMeta(slot: SlotId): SlotMeta {
  const data = loadFromSlot(slot);
  if (!data) return { slot, exists: false };
  return {
    slot,
    exists: true,
    savedAt: data.savedAt,
    chapterTitle: data.flags.__chapterTitle as string | undefined,
    sceneTitle: data.flags.__sceneTitle as string | undefined,
    playtimeMs: data.playtimeMs,
    nights: data.nightsDone.length,
  };
}

export function allSlotMeta(): SlotMeta[] {
  return (['auto', '1', '2', '3'] as SlotId[]).map(slotMeta);
}

function migrate(data: SaveData): SaveData {
  const base = createSave(data.name ?? 'カイ');
  const merged: SaveData = { ...base, ...data };
  merged.version = SAVE_VERSION;
  merged.trust = data.trust ?? {};
  merged.flags = data.flags ?? {};
  merged.drinks = data.drinks ?? [];
  merged.discovered = data.discovered ?? [];
  merged.hints = data.hints ?? [];
  merged.choices = data.choices ?? [];
  merged.nightsDone = data.nightsDone ?? [];
  merged.frames = data.frames ?? [];
  if (!Array.isArray(merged.frames) || merged.frames.length === 0) {
    merged.frames = [{ path: [], idx: 0 }];
  }
  return merged;
}

export function exportSave(data: SaveData): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(data))));
}

export function importSave(text: string): SaveData | null {
  try {
    const bytes = Uint8Array.from(atob(text.trim()), (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return migrate(JSON.parse(json) as SaveData);
  } catch {
    return null;
  }
}

export function formatPlaytime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}時間${m}分`;
  return `${m}分`;
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}