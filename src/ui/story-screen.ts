import { ambienceFor, audio } from '../audio/audio';
import { CHARACTERS } from '../game/characters';
import type { Engine, EngineEvent } from '../game/engine';
import { INGREDIENT_MAP, RECIPES } from '../game/ingredients';
import type { Settings, SlotId } from '../game/state';
import type { BgId, CharId, EndingId, IngredientId, Mood, SaveData, Slot } from '../game/types';
import { backgroundSVG } from './backgrounds';
import { recipeNameOf, runBrewPanel, showResultPanel } from './brew-panel';
import { el, qs, sleep } from './dom';
import { openLogPanel, openSavesPanel, type LogLine } from './panels';
import { closeOverlay, isOverlayOpen, openOverlay, toast } from './overlay';
import { spriteSVG } from './sprite';
export interface StoryDeps {
  save: SaveData;
  engine: Engine;
  getSettings: () => Settings;
  onAutosave: () => void;
  onEnding: (id: EndingId) => void;
  onExitToTitle: () => void;
  openJournal: () => void;
  openCast: () => void;
  openSettings: () => void;
  openHelp: () => void;
  loadSlot: (slot: SlotId) => void;
  notify: (message: string) => void;
}

export class StoryScreen {
  private deps: StoryDeps;
  private cast = new Map<CharId, HTMLElement>();
  private backlog: LogLine[] = [];
  private currentBg: BgId | null = null;
  private finishTyping: (() => void) | null = null;
  private pendingAdvance: (() => void) | null = null;
  private autoTimer: number | null = null;
  private auto = false;
  private skip = false;
  private running = false;
  private busy = false;

  private stage: HTMLElement;
  private bgLayer: HTMLElement;
  private castLayer: HTMLElement;
  private dialogue: HTMLElement;
  private nameEl: HTMLElement;
  private textEl: HTMLElement;
  private choicesEl: HTMLElement;
  private chapterCardEl: HTMLElement;

  constructor(deps: StoryDeps) {
    this.deps = deps;
    this.stage = qs('#stage');
    this.bgLayer = qs('#bg-layer');
    this.castLayer = qs('#cast');
    this.dialogue = qs('#dialogue');
    this.nameEl = qs('#speaker-name');
    this.textEl = qs('#dialogue-text');
    this.choicesEl = qs('#choices');
    this.chapterCardEl = qs('#chapter-card');
    this.bindInput();
  }

  /* ------------------------------ 入力 ------------------------------ */

  private bindInput(): void {
    const advanceTargets: HTMLElement[] = [this.stage, this.dialogue];
    for (const target of advanceTargets) {
      target.addEventListener('pointerdown', (e) => {
        if (isOverlayOpen()) return;
        if ((e.target as HTMLElement).closest('button')) return;
        this.advance();
      });
    }
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ' || e.key === 'Enter') {
        if (isOverlayOpen()) return;
        if (this.chapterCardEl.hidden === false) {
          this.advance();
          return;
        }
        e.preventDefault();
        this.advance();
      }
      if (e.key === 'Control') this.setSkip(true);
      if (e.key === 'Escape') {
        if (isOverlayOpen()) closeOverlay();
        else this.openMenu();
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.key === 'Control') this.setSkip(false);
    });

    qs('#btn-auto').addEventListener('click', () => this.setAuto(!this.auto));
    qs('#btn-skip').addEventListener('click', () => this.setSkip(!this.skip));
    qs('#btn-menu').addEventListener('click', () => this.openMenu());
    qs('#btn-log').addEventListener('click', () => openLogPanel(this.backlog));
    qs('#btn-journal').addEventListener('click', () => this.deps.openJournal());
    qs('#btn-help').addEventListener('click', () => this.deps.openHelp());
  }

  private setAuto(value: boolean): void {
    this.auto = value;
    qs('#btn-auto').classList.toggle('is-active', value);
    if (value) this.scheduleAuto();
  }

  private setSkip(value: boolean): void {
    this.skip = value;
    qs('#btn-skip').classList.toggle('is-active', value);
    if (value) {
      this.setAuto(false);
      this.advance();
    }
  }

  private scheduleAuto(): void {
    if (this.autoTimer !== null) window.clearTimeout(this.autoTimer);
    const delay = this.skip ? 60 : this.deps.getSettings().autoDelay;
    this.autoTimer = window.setTimeout(() => {
      this.autoTimer = null;
      if (this.auto || this.skip) this.advance();
    }, delay);
  }

  private advance(): void {
    if (this.finishTyping) {
      const fn = this.finishTyping;
      this.finishTyping = null;
      fn();
      return;
    }
    if (this.chapterCardEl.hidden === false) {
      this.chapterCardEl.hidden = true;
      this.chapterCardEl.classList.remove('is-open');
    }
    if (this.pendingAdvance) {
      const fn = this.pendingAdvance;
      this.pendingAdvance = null;
      fn();
    }
  }

  /* ------------------------------ 画面 ------------------------------ */

  private async setBackground(id: BgId, fade = 700): Promise<void> {
    if (this.currentBg === id) return;
    this.currentBg = id;
    this.deps.save.flags.__bg = id;
    audio.setAmbience(ambienceFor(id));
    const layer = el('div', 'bg');
    layer.innerHTML = backgroundSVG(id);
    this.bgLayer.append(layer);
    await sleep(20);
    layer.classList.add('is-visible');
    await sleep(fade);
    for (const child of [...this.bgLayer.children]) {
      if (child !== layer) child.remove();
    }
  }

  private addCast(who: CharId, slot: Slot, mood: Mood): void {
    this.markMet(who);
    let node = this.cast.get(who);
    if (!node) {
      node = el('div', `sprite sprite--${slot}`);
      node.innerHTML = spriteSVG(who, mood);
      this.castLayer.append(node);
      this.cast.set(who, node);
      requestAnimationFrame(() => node?.classList.add('is-in'));
    } else {
      node.innerHTML = spriteSVG(who, mood);
    }
    node.dataset.mood = mood;
    node.classList.remove('sprite--left', 'sprite--right', 'sprite--center', 'sprite--far-left', 'sprite--far-right');
    node.classList.add(`sprite--${slot}`);
  }

  /** 舞台に出た人を名鑑に登録する */
  private markMet(who: CharId): void {
    const met = this.deps.save.met ?? [];
    if (met.includes(who)) return;
    this.deps.save.met = [...met, who];
  }

  private removeCast(who: CharId): void {
    const node = this.cast.get(who);
    if (!node) return;
    node.classList.remove('is-in');
    window.setTimeout(() => node.remove(), 420);
    this.cast.delete(who);
  }

  private setMood(who: CharId, mood: Mood): void {
    const node = this.cast.get(who);
    if (!node) return;
    node.dataset.mood = mood;
    const svgHost = node;
    svgHost.innerHTML = spriteSVG(who, mood);
  }

  private highlight(who: CharId | 'narrator' | 'self'): void {
    for (const [id, node] of this.cast) {
      node.classList.toggle('is-speaking', id === who);
    }
  }

  private async typewrite(text: string): Promise<void> {
    const speed = this.deps.getSettings().textSpeed;
    if (this.skip) {
      this.textEl.textContent = text;
      return;
    }
    this.textEl.textContent = '';
    await new Promise<void>((resolve) => {
      let i = 0;
      const step = () => {
        if (i >= text.length) {
          resolve();
          return;
        }
        i += 1;
        this.textEl.textContent = text.slice(0, i);
        window.setTimeout(step, speed);
      };
      this.finishTyping = () => {
        this.textEl.textContent = text;
        resolve();
      };
      step();
    });
    this.finishTyping = null;
  }

  private async waitAdvance(): Promise<void> {
    if (this.skip) {
      await sleep(60);
      return;
    }
    await new Promise<void>((resolve) => {
      this.pendingAdvance = resolve;
      if (this.auto) this.scheduleAuto();
    });
  }

  private async say(who: CharId | 'narrator' | 'self', text: string, mood?: Mood): Promise<void> {
    const name = who === 'narrator' ? '' : who === 'self' ? this.deps.save.name : CHARACTERS[who].name;
    if (who === 'narrator' || who === 'self') {
      this.highlight('narrator');
    } else {
      this.highlight(who);
      if (mood) this.setMood(who, mood);
    }
    this.dialogue.hidden = false;
    this.dialogue.classList.toggle('is-narration', who === 'narrator');
    this.dialogue.classList.toggle('is-self', who === 'self');
    this.nameEl.textContent = name;
    this.nameEl.hidden = name === '';
    const resolved = text.replace(/\{\{name\}\}/g, this.deps.save.name);
    this.backlog.push({ name: name || '――', text: resolved });
    if (this.backlog.length > 300) this.backlog.splice(0, this.backlog.length - 300);
    this.showFirstTimeHint();
    await this.typewrite(resolved);
    qs('#next-mark').classList.add('is-visible');
    await this.waitAdvance();
    qs('#next-mark').classList.remove('is-visible');
  }

  private async showChapterCard(title: string, subtitle?: string): Promise<void> {
    this.chapterCardEl.innerHTML = `<p class="chapter-card__label">${title}</p>${
      subtitle ? `<h2 class="chapter-card__title">${subtitle}</h2>` : ''
    }`;
    this.chapterCardEl.hidden = false;
    requestAnimationFrame(() => this.chapterCardEl.classList.add('is-open'));
    await sleep(2600);
    if (this.chapterCardEl.hidden === false) {
      this.chapterCardEl.hidden = true;
      this.chapterCardEl.classList.remove('is-open');
    }
  }

  private async showChoices(event: Extract<EngineEvent, { type: 'choice' }>): Promise<void> {
    this.choicesEl.hidden = false;
    this.choicesEl.replaceChildren();
    if (event.prompt) this.choicesEl.append(el('p', 'choices__prompt', event.prompt));
    const wasAuto = this.auto;
    this.setAuto(false);
    this.setSkip(false);
    await new Promise<void>((resolve) => {
      event.options.forEach((opt) => {
        const btn = el('button', 'choice-btn');
        btn.type = 'button';
        btn.append(el('span', 'choice-btn__text', opt.text));
        if (opt.locked) {
          btn.classList.add('is-locked');
          btn.disabled = true;
          if (opt.lockedNote) btn.append(el('span', 'choice-btn__note', opt.lockedNote));
        }
        btn.addEventListener('click', () => {
          audio.sfx('page');
          this.choicesEl.hidden = true;
          this.choicesEl.replaceChildren();
          this.deps.engine.resolveChoice(opt.index);
          resolve();
        });
        this.choicesEl.append(btn);
      });
    });
    this.setAuto(wasAuto);
  }

  /** 初回だけ、進め方をセリフ欄に出す */
  private showFirstTimeHint(): void {
    const hint = qs('#next-hint');
    const seen = Number(this.deps.save.flags.__linesSeen ?? 0);
    this.deps.save.flags.__linesSeen = seen + 1;
    hint.hidden = seen >= 3 || this.skip;
  }

  private openMenu(): void {
    if (isOverlayOpen()) return;
    const panel = el('div', 'panel panel--menu');
    panel.append(el('h2', 'panel__title', 'メニュー'));
    const buttons: { label: string; action: () => void }[] = [
      { label: 'つづける', action: () => closeOverlay() },
      { label: 'あそびかた', action: () => this.deps.openHelp() },
      { label: 'セーブする', action: () => openSavesPanel('save', this.deps.save, { onSaved: () => toast('セーブしました') }) },
      { label: 'ロードする', action: () => openSavesPanel('load', this.deps.save, { onLoad: (slot) => this.deps.loadSlot(slot) }) },
      { label: 'レシピ帳', action: () => this.deps.openJournal() },
      { label: '登場人物', action: () => this.deps.openCast() },
      { label: '設定', action: () => this.deps.openSettings() },
      { label: '履歴を見る', action: () => openLogPanel(this.backlog) },
      {
        label: 'タイトルへ戻る',
        action: () => {
          closeOverlay();
          this.deps.onExitToTitle();
        },
      },
    ];
    const list = el('div', 'menu__list');
    for (const b of buttons) {
      const btn = el('button', 'btn menu__btn', b.label);
      btn.type = 'button';
      btn.addEventListener('click', () => {
        audio.sfx('page');
        b.action();
      });
      list.append(btn);
    }
    panel.append(list);
    openOverlay(panel, { dismissible: true, className: 'panel--narrow' });
  }

  /* ------------------------------ 進行 ------------------------------ */

  async start(): Promise<void> {
    this.running = true;
    this.deps.engine.onAutosave = () => this.deps.onAutosave();
    const scene = this.deps.engine.currentScene;
    const bgId = (this.deps.save.flags.__bg as BgId) ?? scene.bg ?? 'cafe-night';
    await this.setBackground(bgId, 300);
    // 途中再開のときは、その時点の立ち位置を復元する
    const castFlag = this.deps.save.flags.__cast;
    if (typeof castFlag === 'string') {
      try {
        const list = JSON.parse(castFlag) as { who: CharId; slot: Slot; mood: Mood }[];
        for (const item of list) this.addCast(item.who, item.slot, item.mood);
      } catch {
        /* noop */
      }
    }
    void this.pump();
  }

  stop(): void {
    this.running = false;
    if (this.autoTimer !== null) window.clearTimeout(this.autoTimer);
  }

  private async pump(): Promise<void> {
    while (this.isRunning()) {
      const event = this.deps.engine.next();
      const halt = await this.handle(event);
      if (halt === 'halt') return;
      await Promise.resolve();
    }
  }

  private isRunning(): boolean {
    return this.running;
  }

  private persistCast(): void {
    const list = [...this.cast.entries()].map(([who, node]) => ({
      who,
      slot: (node.className.match(/sprite--([a-z-]+)/)?.[1] ?? 'center') as Slot,
      mood: (node.dataset.mood ?? 'normal') as Mood,
    }));
    this.deps.save.flags.__cast = JSON.stringify(list);
  }

  private async handle(event: EngineEvent): Promise<boolean | 'halt'> {
    switch (event.type) {
      case 'scene-start': {
        this.deps.save.flags.__sceneTitle = event.title ?? '';
        this.deps.onAutosave();
        if (event.bg) await this.setBackground(event.bg, 400);
        return false;
      }
      case 'scene-end': {
        const chapter = this.deps.engine.currentChapter;
        if (!chapter) return 'halt';
        const index = chapter.scenes.findIndex((s) => s.id === this.deps.engine.currentScene.id);
        const next = chapter.scenes[index + 1];
        if (next) {
          this.deps.engine.goto(next.id);
          return false;
        }
        toast('シナリオの終端に到達しました');
        this.deps.onExitToTitle();
        return 'halt';
      }
      case 'bg':
        await this.setBackground(event.id, event.fade ?? 600);
        return false;
      case 'enter':
        this.addCast(event.who, event.slot, event.mood);
        this.persistCast();
        return false;
      case 'exit':
        this.removeCast(event.who);
        this.persistCast();
        return false;
      case 'mood':
        this.setMood(event.who, event.mood);
        this.persistCast();
        return false;
      case 'sfx':
        audio.sfx(event.id);
        return false;
      case 'shake':
        this.stage.classList.add('is-shaking');
        window.setTimeout(() => this.stage.classList.remove('is-shaking'), 700);
        return false;
      case 'wait':
        await sleep(this.skip ? Math.min(120, event.ms) : event.ms);
        return false;
      case 'say':
        await this.say(event.who, event.text, event.mood);
        return true;
      case 'chapter':
        // 章が変わるときは舞台をいったん空にする（立ち位置の持ち越しを防ぐ）
        for (const who of [...this.cast.keys()]) this.removeCast(who);
        this.persistCast();
        await this.showChapterCard(event.title, event.subtitle);
        return true;
      case 'choice':
        await this.showChoices(event);
        return true;
      case 'order': {
        if (this.busy) return 'halt';
        this.busy = true;
        this.setAuto(false);
        this.setSkip(false);
        const view = {
          order: event.order,
          customer: event.customer,
          hint: event.hint,
          showHints: this.deps.getSettings().showHints,
          discovered: this.deps.save.discovered
            .map((id) => {
              const recipe = RECIPES.find((r) => r.id === id);
              if (!recipe) return '';
              const names = recipe.key
                .split('+')
                .map((key) => INGREDIENT_MAP[key as IngredientId]?.name ?? key)
                .join('・');
              return `${recipe.name}（${names}）`;
            })
            .filter(Boolean),
        };
        const { drink, art } = await runBrewPanel(view);
        const grade = this.deps.engine.resolveOrder(drink);
        await showResultPanel({
          drink,
          art,
          grade,
          customer: event.customer,
          recipeName: recipeNameOf(drink),
        });
        this.deps.onAutosave();
        this.busy = false;
        return true;
      }
      case 'ending': {
        this.deps.save.flags.ending = event.id;
        this.deps.onAutosave();
        this.deps.onEnding(event.id);
        return 'halt';
      }
      default:
        return false;
    }
  }
}