import './styles.css';
import { audio } from './audio/audio';
import { Engine } from './game/engine';
import { CHAPTERS } from './game/script';
import {
  createSave,
  hasAnySave,
  latestSave,
  loadFromSlot,
  loadSettings,
  persistSettings,
  saveToSlot,
  type Settings,
  type SlotId,
} from './game/state';
import type { EndingId, SaveData } from './game/types';
import { backgroundSVG } from './ui/backgrounds';
import { el, qs } from './ui/dom';
import { openEndingPanel } from './ui/ending-panel';
import { closeOverlay, openOverlay, setupOverlay, toast } from './ui/overlay';
import { openChaptersPanel, openHelpPanel, openJournalPanel, openSettingsPanel, openSavesPanel } from './ui/panels';
import { StoryScreen } from './ui/story-screen';

const AUTOSAVE_INTERVAL = 20_000;

class App {
  settings: Settings = loadSettings();
  save: SaveData | null = null;
  engine: Engine | null = null;
  story: StoryScreen | null = null;
  private lastTick = Date.now();
  private audioReady = false;
  private helpTimer: number | null = null;

  boot(): void {
    setupOverlay();
    qs('#title-bg').innerHTML = backgroundSVG('title');
    this.wireTitle();
    this.wireAudio();
    window.setTimeout(() => {
      const boot = qs('#boot');
      boot.classList.add('is-hidden');
      window.setTimeout(() => boot.remove(), 600);
    }, 250);
    window.setInterval(() => this.tickPlaytime(), AUTOSAVE_INTERVAL);
    window.addEventListener('beforeunload', () => this.autosave());
  }

  private wireAudio(): void {
    const unlock = () => {
      if (this.audioReady) return;
      this.audioReady = true;
      audio.init(this.settings);
      audio.applySettings(this.settings);
      audio.startMusic();
      audio.setAmbience('rain');
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  private applySettings(next: Settings): void {
    this.settings = next;
    persistSettings(next);
    audio.applySettings(next);
  }

  private wireTitle(): void {
    const screen = qs('#screen-title');
    screen.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
      if (!btn) return;
      audio.sfx('page');
      switch (btn.dataset.action) {
        case 'new':
          void this.newGame();
          break;
        case 'continue':
          void this.continueGame();
          break;
        case 'chapters':
          openChaptersPanel(this.save, (chapterId) => {
            closeOverlay();
            const base = this.save ?? createSave();
            const fresh = createSave(base.name);
            fresh.discovered = [...base.discovered];
            fresh.hints = [...base.hints];
            fresh.flags.maxChapter = Number(base.flags.maxChapter ?? 0);
            this.startGame(fresh, chapterId);
          });
          break;
        case 'help':
          this.openHelp();
          break;
        case 'journal':
          openJournalPanel(this.save);
          break;
        case 'settings':
          openSettingsPanel(this.settings, (s) => this.applySettings(s));
          break;
      }
    });
    const cont = qs<HTMLButtonElement>('button[data-action="continue"]');
    const note = qs('#title-note');
    if (!hasAnySave()) {
      cont.classList.add('is-disabled');
      cont.disabled = true;
      note.textContent = '「はじめから」→ 名前を決めると、夜が始まります。操作は「あそびかた」に。';
    }
  }

  private async askName(defaultName = 'カイ'): Promise<string | null> {
    const panel = el('div', 'panel panel--name');
    panel.append(el('h2', 'panel__title', 'バリスタの名前'));
    panel.append(el('p', 'panel__desc', 'この店の常連たちは、あなたをそう呼びます。'));
    const input = el('input', 'name__input');
    input.type = 'text';
    input.maxLength = 8;
    input.value = defaultName;
    input.setAttribute('aria-label', '名前');
    panel.append(input);
    const foot = el('footer', 'panel__foot');
    const cancel = el('button', 'btn', 'やめる');
    cancel.type = 'button';
    const ok = el('button', 'btn btn--primary', 'この名前で');
    ok.type = 'button';
    foot.append(cancel, ok);
    panel.append(foot);
    openOverlay(panel, { dismissible: true });
    window.setTimeout(() => input.focus(), 80);
    return new Promise<string | null>((resolve) => {
      const finish = (value: string | null) => {
        closeOverlay();
        resolve(value);
      };
      cancel.addEventListener('click', () => finish(null));
      ok.addEventListener('click', () => finish(input.value.trim() || defaultName));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') finish(input.value.trim() || defaultName);
      });
    });
  }

  private async newGame(): Promise<void> {
    const name = await this.askName(this.save?.name ?? 'カイ');
    if (name === null) return;
    const save = createSave(name);
    if (this.save) {
      save.flags.maxChapter = Number(this.save.flags.maxChapter ?? 0);
      save.discovered = [...this.save.discovered];
      save.hints = [...this.save.hints];
    }
    this.startGame(save, 'prologue');
  }

  private async continueGame(): Promise<void> {
    const latest = latestSave();
    if (!latest) {
      toast('セーブデータがありません');
      return;
    }
    this.startGame(latest.data);
  }

  private showScreen(id: 'title' | 'game'): void {
    for (const screen of document.querySelectorAll('.screen')) {
      screen.classList.toggle('is-active', screen.id === `screen-${id}`);
    }
    if (id === 'title') {
      audio.setAmbience('rain');
      qs('#title-bg').innerHTML = backgroundSVG('title');
      const cont = qs<HTMLButtonElement>('button[data-action="continue"]');
      cont.disabled = !hasAnySave();
      cont.classList.toggle('is-disabled', !hasAnySave());
    }
  }

  startGame(save: SaveData, chapterId?: string): void {
    this.story?.stop();
    this.save = save;
    this.lastTick = Date.now();
    if (chapterId) {
      save.chapter = chapterId;
      const chapter = CHAPTERS.find((c) => c.id === chapterId);
      if (chapter) save.scene = chapter.start;
      save.frames = [];
    }
    const engine = new Engine(CHAPTERS, save);
    this.engine = engine;
    const story = new StoryScreen({
      save,
      engine,
      getSettings: () => this.settings,
      onAutosave: () => this.autosave(),
      onEnding: (id) => this.handleEnding(id),
      onExitToTitle: () => this.toTitle(),
      openJournal: () => openJournalPanel(this.save),
      openSettings: () => openSettingsPanel(this.settings, (s) => this.applySettings(s)),
      openHelp: () => this.openHelp(),
      loadSlot: (slot) => this.load(slot),
      notify: (message) => toast(message),
    });
    this.story = story;
    this.showScreen('game');
    void story.start();
    // 初回だけ、操作説明を自動で開く（別の画面に移ったら開かない）
    if (!this.settings.seenHelp) {
      if (this.helpTimer !== null) window.clearTimeout(this.helpTimer);
      this.helpTimer = window.setTimeout(() => {
        this.helpTimer = null;
        if (this.settings.seenHelp || this.story !== story) return;
        this.openHelp();
      }, 600);
    }
  }

  /** 「あそびかた」を開き、閉じたら既読にする */
  private openHelp(): void {
    openHelpPanel(() => this.markHelpSeen());
  }

  private markHelpSeen(): void {
    if (this.helpTimer !== null) {
      window.clearTimeout(this.helpTimer);
      this.helpTimer = null;
    }
    if (!this.settings.seenHelp) this.applySettings({ ...this.settings, seenHelp: true });
  }

  private load(slot: SlotId): void {
    const data = loadFromSlot(slot);
    if (!data) {
      toast('そのスロットは空です');
      return;
    }
    closeOverlay();
    this.startGame(data);
  }

  private tickPlaytime(): void {
    if (!this.save || !this.story) return;
    const now = Date.now();
    this.save.playtimeMs += now - this.lastTick;
    this.lastTick = now;
    this.autosave();
  }

  autosave(): void {
    if (!this.save || !this.engine) return;
    const chapter = this.engine.currentChapter;
    if (chapter) {
      const index = CHAPTERS.findIndex((c) => c.id === chapter.id);
      const max = Number(this.save.flags.maxChapter ?? 0);
      if (index > max) this.save.flags.maxChapter = index;
      this.save.flags.__chapterTitle = chapter.title;
    }
    saveToSlot('auto', this.save);
  }

  private handleEnding(id: EndingId): void {
    const save = this.save;
    if (!save) return;
    save.flags.ending = id;
    this.autosave();
    openEndingPanel(id, save, {
      onTitle: () => this.toTitle(),
      onReplay: () => this.startGame(save, 'finale'),
      onJournal: () => openJournalPanel(save),
    });
  }

  private toTitle(): void {
    this.story?.stop();
    this.story = null;
    this.engine = null;
    if (this.helpTimer !== null) {
      window.clearTimeout(this.helpTimer);
      this.helpTimer = null;
    }
    this.showScreen('title');
    audio.setAmbience('rain');
  }

  openLoadFromTitle(): void {
    openSavesPanel('load', this.save, { onLoad: (slot) => this.load(slot) });
  }
}

const app = new App();
app.boot();

// デバッグ用（開発時のみ）
if (import.meta.env.DEV) {
  (window as unknown as { midnightBlend: App }).midnightBlend = app;
}