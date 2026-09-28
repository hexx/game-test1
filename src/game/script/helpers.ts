import type {
  BgId,
  CharId,
  ChoiceOption,
  Line,
  Mood,
  Order,
  SaveData,
  SfxId,
  Slot,
} from '../types';

/** セリフ */
export const say = (who: CharId | 'narrator' | 'self', text: string, mood?: Mood): Line => ({
  t: 'say',
  who,
  text,
  mood,
});

/** 地の文 */
export const nar = (text: string): Line => say('narrator', text);
/** 主人公の心の声 */
export const heart = (text: string): Line => say('self', text);

export const enter = (who: CharId, slot: Slot = 'center', mood: Mood = 'normal'): Line => ({
  t: 'enter',
  who,
  slot,
  mood,
});

export const exit = (who: CharId): Line => ({ t: 'exit', who });
export const mood = (who: CharId, m: Mood): Line => ({ t: 'mood', who, mood: m });
export const bg = (id: BgId, fade?: number): Line => ({ t: 'bg', id, fade });
export const jump = (to: string): Line => ({ t: 'jump', to });
export const set = (fn: (s: SaveData) => void): Line => ({ t: 'set', fn });
export const wait = (ms: number): Line => ({ t: 'wait', ms });
export const sfx = (id: SfxId): Line => ({ t: 'sfx', id });
export const shake = (): Line => ({ t: 'shake' });
export const chapterCard = (title: string, subtitle?: string): Line => ({ t: 'chapter', title, subtitle });
export const ending = (id: 'dawn' | 'dream' | 'quiet'): Line => ({ t: 'ending', id });

export const choice = (options: ChoiceOption[], prompt?: string): Line => ({ t: 'choice', options, prompt });

export const order = (opts: {
  order: Order | ((s: SaveData) => Order);
  customer: CharId;
  results: { perfect?: string; good?: string; off?: string };
  hint?: string;
}): Line => ({ t: 'order', ...opts });

export const branch = (
  when: (s: SaveData) => boolean,
  then: Line[],
  otherwise?: Line[],
): Line => ({ t: 'if', when, then, else: otherwise });

export const trustUp = (who: CharId, n: number): Line =>
  set((s) => {
    s.trust[who] = (s.trust[who] ?? 0) + n;
  });

export const flagSet = (key: string, value: boolean | number | string = true): Line =>
  set((s) => {
    s.flags[key] = value;
  });

export const ob = (o: Order): Order => o;