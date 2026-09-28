import { gradeOrder } from './ingredients';
import type {
  Chapter,
  ChoiceOption,
  Drink,
  EndingId,
  Grade,
  Line,
  Order,
  SaveData,
  Scene,
  Slot,
  Mood,
  CharId,
  BgId,
  SfxId,
} from './types';

/* ------------------------------------------------------------------ *
 * イベント（UI が解釈して描画する）
 * ------------------------------------------------------------------ */

export type EngineEvent =
  | { type: 'scene-start'; sceneId: string; title?: string; bg?: BgId }
  | { type: 'scene-end'; sceneId: string }
  | { type: 'bg'; id: BgId; fade?: number }
  | { type: 'say'; who: CharId | 'narrator' | 'self'; text: string; mood?: Mood }
  | { type: 'enter'; who: CharId; slot: Slot; mood: Mood }
  | { type: 'exit'; who: CharId }
  | { type: 'mood'; who: CharId; mood: Mood }
  | { type: 'chapter'; title: string; subtitle?: string }
  | { type: 'choice'; prompt?: string; options: (ChoiceOption & { index: number; locked: boolean })[] }
  | { type: 'order'; order: Order; customer: CharId; hint?: string }
  | { type: 'shop-close' }
  | { type: 'sfx'; id: SfxId }
  | { type: 'shake' }
  | { type: 'wait'; ms: number }
  | { type: 'ending'; id: EndingId };

interface Frame {
  lines: Line[];
  path: (number | string)[];
  idx: number;
}

export class Engine {
  readonly chapters: Chapter[];
  save: SaveData;
  private scene!: Scene;
  private frames: Frame[] = [];
  private chapterId = '';
  /** order イベントで確定した注文（resolveOrder で使う） */
  private pendingOrder: Order | null = null;
  onAutosave: (() => void) | null = null;

  constructor(chapters: Chapter[], save: SaveData) {
    this.chapters = chapters;
    this.save = save;
    this.restore();
  }

  /* ---------------- セーブ位置の復元 ---------------- */

  private restore(): void {
    const scene = this.findScene(this.save.scene);
    if (scene) {
      this.scene = scene;
      this.chapterId = this.chapterOf(scene.id)?.id ?? this.save.chapter;
    } else {
      const chapter = this.chapters.find((c) => c.id === this.save.chapter) ?? this.chapters[0];
      this.chapterId = chapter.id;
      this.scene = chapter.scenes.find((s) => s.id === chapter.start) ?? chapter.scenes[0];
    }
    this.save.chapter = this.chapterId;
    this.save.scene = this.scene.id;
    const frames = this.save.frames;
    this.frames = [];
    if (frames && frames.length > 0) {
      for (const f of frames) {
        const lines = this.resolvePath(f.path);
        if (!lines) return this.resetFrames();
        this.frames.push({ lines, path: f.path, idx: f.idx });
      }
      if (this.frames.length === 0) this.resetFrames();
    } else {
      this.resetFrames();
    }
  }

  private resetFrames(): void {
    this.frames = [{ lines: this.scene.lines, path: [], idx: 0 }];
  }

  private resolvePath(path: (number | string)[]): Line[] | null {
    let lines: Line[] = this.scene.lines;
    for (let i = 0; i < path.length; i += 2) {
      const index = path[i];
      const branch = path[i + 1];
      if (typeof index !== 'number') return null;
      const line = lines[index];
      if (!line || line.t !== 'if') return null;
      if (branch === 'then') lines = line.then;
      else if (branch === 'else') lines = line.else ?? [];
      else return null;
    }
    return lines;
  }

  private findScene(id: string): Scene | null {
    for (const c of this.chapters) {
      const s = c.scenes.find((x) => x.id === id);
      if (s) return s;
    }
    return null;
  }

  private chapterOf(sceneId: string): Chapter | undefined {
    return this.chapters.find((c) => c.scenes.some((s) => s.id === sceneId));
  }

  /* ---------------- 進行 ---------------- */

  /** 次のイベントを返す。停止イベントに当たるまで内部で進める。 */
  next(): EngineEvent {
    for (;;) {
      const frame = this.frames[this.frames.length - 1];
      if (!frame) return { type: 'scene-end', sceneId: this.scene.id };
      if (frame.idx >= frame.lines.length) {
        this.frames.pop();
        if (this.frames.length === 0) {
          return { type: 'scene-end', sceneId: this.scene.id };
        }
        continue;
      }
      const line = frame.lines[frame.idx];
      const advance = () => {
        frame.idx += 1;
      };
      switch (line.t) {
        case 'bg':
          advance();
          return { type: 'bg', id: line.id, fade: line.fade };
        case 'enter':
          advance();
          return { type: 'enter', who: line.who, slot: line.slot ?? 'center', mood: line.mood ?? 'normal' };
        case 'exit':
          advance();
          return { type: 'exit', who: line.who };
        case 'mood':
          advance();
          return { type: 'mood', who: line.who, mood: line.mood };
        case 'sfx':
          advance();
          return { type: 'sfx', id: line.id };
        case 'shake':
          advance();
          return { type: 'shake' };
        case 'set':
          line.fn(this.save);
          advance();
          continue;
        case 'wait':
          advance();
          return { type: 'wait', ms: line.ms };
        case 'if': {
          const cond = line.when(this.save);
          const branch = cond ? line.then : line.else;
          // 分岐本体を積む前に親を進める（分岐を抜けたら後ろから続く）
          advance();
          if (!branch || branch.length === 0) continue;
          this.frames.push({
            lines: branch,
            path: [...frame.path, frame.idx - 1, cond ? 'then' : 'else'],
            idx: 0,
          });
          continue;
        }
        case 'jump':
          this.goto(line.to);
          continue;
        case 'say':
          advance();
          return { type: 'say', who: line.who, text: line.text, mood: line.mood };
        case 'chapter':
          advance();
          this.save.flags.__chapterTitle = line.title;
          return { type: 'chapter', title: line.title, subtitle: line.subtitle };
        case 'choice':
          return {
            type: 'choice',
            prompt: line.prompt,
            options: line.options.map((o, index) => ({
              ...o,
              index,
              locked: o.when ? !o.when(this.save) : false,
            })),
          };
        case 'order': {
          const resolved = typeof line.order === 'function' ? line.order(this.save) : line.order;
          this.pendingOrder = resolved;
          return { type: 'order', order: resolved, customer: line.customer, hint: line.hint };
        }
        case 'ending':
          advance();
          this.save.flags.ending = line.id;
          this.save.flags.__chapterTitle = 'エンディング';
          this.persist();
          return { type: 'ending', id: line.id };
      }
    }
  }

  /** choice イベントへの回答 */
  resolveChoice(index: number): void {
    const frame = this.frames[this.frames.length - 1];
    const line = frame?.lines[frame.idx];
    if (!line || line.t !== 'choice') return;
    const option = line.options[index];
    frame.idx += 1;
    if (!option) return;
    option.set?.(this.save);
    this.save.choices.push(option.text);
    if (option.to) {
      this.goto(option.to);
    }
    this.persist();
  }

  /** order イベントへの回答（プレイヤーが淹れたドリンクを渡す） */
  resolveOrder(drink: Drink): Grade {
    const frame = this.frames[this.frames.length - 1];
    const line = frame?.lines[frame.idx];
    if (!line || line.t !== 'order') return 'off';
    const order = this.pendingOrder ?? (typeof line.order === 'function' ? line.order(this.save) : line.order);
    this.pendingOrder = null;
    const result = gradeOrder(order, drink);
    frame.idx += 1;

    this.save.flags[`order:${order.id}`] = result.grade;
    this.save.flags[`lastDrink:${order.id}`] = drink.ingredients.join('+') + '@' + drink.temperature;
    this.save.drinks.push({
      orderId: order.id,
      drinkName: drink.name,
      grade: result.grade,
      night: (this.save.flags.__chapterTitle as string) ?? this.scene.id,
    });
    if (drink.recipeId && !this.save.discovered.includes(drink.recipeId)) {
      this.save.discovered.push(drink.recipeId);
    }
    if (line.hint) {
      const hint = line.hint;
      if (!this.save.hints.includes(hint)) this.save.hints.push(hint);
    }
    const trustDelta: Record<Grade, number> = { perfect: 2, good: 1, off: 0 };
    const who = line.customer;
    this.save.trust[who] = (this.save.trust[who] ?? 0) + trustDelta[result.grade];

    const next = line.results[result.grade] ?? line.results.good;
    if (next) this.goto(next);
    this.persist();
    return result.grade;
  }

  /** シナリオ側から任意のフラグを立てる（エピローグ分岐など） */
  setFlag(key: string, value: boolean | number | string): void {
    this.save.flags[key] = value;
  }

  getFlag(key: string): boolean | number | string | undefined {
    return this.save.flags[key];
  }

  /** 章の切り替え（章セレクトから呼ぶ） */
  startChapter(chapterId: string, sceneId?: string): void {
    const chapter = this.chapters.find((c) => c.id === chapterId);
    if (!chapter) return;
    const scene = sceneId
      ? chapter.scenes.find((s) => s.id === sceneId) ?? chapter.scenes[0]
      : chapter.scenes.find((s) => s.id === chapter.start) ?? chapter.scenes[0];
    this.chapterId = chapter.id;
    this.scene = scene;
    this.save.chapter = chapter.id;
    this.save.scene = scene.id;
    this.resetFrames();
    this.persist();
  }

  goto(sceneId: string): boolean {
    const scene = this.findScene(sceneId);
    if (!scene) {
      console.warn(`[engine] scene not found: ${sceneId}`);
      return false;
    }
    const chapter = this.chapterOf(sceneId);
    if (chapter && chapter.id !== this.chapterId) {
      this.chapterId = chapter.id;
      this.save.chapter = chapter.id;
    }
    this.scene = scene;
    this.save.scene = scene.id;
    this.resetFrames();
    return true;
  }

  get currentScene(): Scene {
    return this.scene;
  }

  get currentChapter(): Chapter | undefined {
    return this.chapterOf(this.scene.id);
  }

  persist(): void {
    this.save.frames = this.frames.map((f) => ({ path: f.path, idx: f.idx }));
    this.onAutosave?.();
  }
}

/* ------------------------------------------------------------------ *
 * シナリオで使うヘルパ
 * ------------------------------------------------------------------ */

export function trust(save: SaveData, who: CharId): number {
  return save.trust[who] ?? 0;
}

export function totalTrust(save: SaveData): number {
  return Object.values(save.trust).reduce((a, b) => a + b, 0);
}

export function flag(save: SaveData, key: string): boolean {
  return Boolean(save.flags[key]);
}