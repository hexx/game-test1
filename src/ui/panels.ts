import { CHARACTERS, REGULARS } from '../game/characters';
import { INGREDIENT_MAP, RECIPES } from '../game/ingredients';
import { CHAPTERS } from '../game/script';
import {
  DEFAULT_SETTINGS,
  allSlotMeta,
  deleteSlot,
  exportSave,
  formatDate,
  formatPlaytime,
  importSave,
  loadFromSlot,
  saveToSlot,
  type Settings,
  type SlotId,
} from '../game/state';
import type { CharId, SaveData } from '../game/types';
import { el, clear } from './dom';
import { closeOverlay, openOverlay, toast } from './overlay';

/* ------------------------------------------------------------------ *
 * レシピ帳
 * ------------------------------------------------------------------ */

function ingredientChips(ids: string[]): HTMLElement {
  const wrap = el('div', 'chips');
  for (const id of ids) {
    const ing = INGREDIENT_MAP[id as keyof typeof INGREDIENT_MAP];
    if (!ing) continue;
    const chip = el('span', 'chip chip--ing', ing.name);
    chip.style.setProperty('--ing', ing.color);
    wrap.append(chip);
  }
  return wrap;
}

export function openJournalPanel(save: SaveData | null): void {
  const panel = el('div', 'panel panel--journal');
  panel.append(el('h2', 'panel__title', 'レシピ帳'));

  const tabs = el('div', 'tabs');
  const pages = el('div', 'tabs__pages');
  const journalTab = el('button', 'tabs__tab is-active', 'レシピ');
  const hintTab = el('button', 'tabs__tab', '店主のメモ');
  const statTab = el('button', 'tabs__tab', '記録');
  tabs.append(journalTab, hintTab, statTab);
  panel.append(tabs, pages);

  const recipePage = el('div', 'page');
  const discovered = new Set(save?.discovered ?? []);
  for (const recipe of RECIPES) {
    const known = discovered.has(recipe.id);
    const card = el('article', `recipe${known ? '' : ' is-locked'}`);
    card.append(el('h3', 'recipe__name', known ? recipe.name : '？？？'));
    card.append(el('p', 'recipe__desc', known ? recipe.desc : 'まだ淹れたことのない組み合わせ。'));
    if (known) {
      card.append(ingredientChips(recipe.key.split('+')));
    }
    recipePage.append(card);
  }
  recipePage.append(
    el('p', 'page__note', `発見したレシピ：${discovered.size} / ${RECIPES.length}`),
  );

  const hintPage = el('div', 'page');
  hintPage.hidden = true;
  const hints = save?.hints ?? [];
  if (hints.length === 0) {
    hintPage.append(el('p', 'page__empty', '店主のメモは、まだ白紙。'));
  } else {
    const ul = el('ul', 'notes__list');
    for (const hint of hints) ul.append(el('li', 'notes__item', hint));
    hintPage.append(ul);
  }

  const statPage = el('div', 'page');
  statPage.hidden = true;
  if (save) {
    const served = save.drinks.length;
    const perfect = save.drinks.filter((d) => d.grade === 'perfect').length;
    const good = save.drinks.filter((d) => d.grade === 'good').length;
    const off = save.drinks.filter((d) => d.grade === 'off').length;
    const dl = el('dl', 'stats');
    const row = (k: string, v: string) => dl.append(el('dt', undefined, k), el('dd', undefined, v));
    row('遊んだ時間', formatPlaytime(save.playtimeMs));
    row('出した一杯', `${served} 杯`);
    row('完璧', `${served ? Math.round((perfect / served) * 100) : 0}%（${perfect} 杯）`);
    row('まずまず', `${good} 杯`);
    row('ちがう', `${off} 杯`);
    row('発見したレシピ', `${discovered.size} / ${RECIPES.length}`);
    statPage.append(dl);
    const trustBox = el('div', 'trust');
    trustBox.append(el('h3', 'trust__title', '常連たちの距離'));
    for (const who of REGULARS as CharId[]) {
      const value = save.trust[who] ?? 0;
      const line = el('div', 'trust__row');
      line.append(el('span', 'trust__name', CHARACTERS[who].name));
      const bar = el('span', 'trust__bar');
      const fill = el('span', 'trust__fill');
      fill.style.width = `${Math.min(100, value * 12)}%`;
      bar.append(fill);
      line.append(bar, el('span', 'trust__value', String(value)));
      trustBox.append(line);
    }
    statPage.append(trustBox);
  } else {
    statPage.append(el('p', 'page__empty', 'まだ記録がありません。'));
  }

  pages.append(recipePage, hintPage, statPage);
  const showPage = (index: number) => {
    [recipePage, hintPage, statPage].forEach((p, i) => {
      p.hidden = i !== index;
    });
    [journalTab, hintTab, statTab].forEach((t, i) => t.classList.toggle('is-active', i === index));
  };
  journalTab.addEventListener('click', () => showPage(0));
  hintTab.addEventListener('click', () => showPage(1));
  statTab.addEventListener('click', () => showPage(2));

  const foot = el('footer', 'panel__foot');
  const close = el('button', 'btn btn--primary', '閉じる');
  close.type = 'button';
  close.addEventListener('click', () => closeOverlay());
  foot.append(close);
  panel.append(foot);

  openOverlay(panel, { dismissible: true, className: 'panel--wide' });
}

/* ------------------------------------------------------------------ *
 * 設定
 * ------------------------------------------------------------------ */

export function openSettingsPanel(settings: Settings, onChange: (s: Settings) => void): void {
  const panel = el('div', 'panel panel--settings');
  panel.append(el('h2', 'panel__title', '設定'));
  const working: Settings = { ...settings };

  const slider = (
    key: keyof Settings,
    label: string,
    min: number,
    max: number,
    step: number,
    format: (v: number) => string,
  ) => {
    const row = el('div', 'setting');
    const lab = el('label', 'setting__label', label);
    const input = el('input', 'setting__input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(working[key]);
    const value = el('span', 'setting__value', format(Number(working[key])));
    input.addEventListener('input', () => {
      const v = Number(input.value);
      (working[key] as number) = v;
      value.textContent = format(v);
      onChange({ ...working });
    });
    row.append(lab, input, value);
    return row;
  };

  const toggle = (key: keyof Settings, label: string, note?: string) => {
    const row = el('div', 'setting');
    const lab = el('label', 'setting__label', label);
    const btn = el('button', 'toggle', working[key] ? 'ON' : 'OFF');
    btn.type = 'button';
    btn.classList.toggle('is-on', Boolean(working[key]));
    btn.addEventListener('click', () => {
      (working[key] as boolean) = !working[key];
      btn.classList.toggle('is-on', Boolean(working[key]));
      btn.textContent = working[key] ? 'ON' : 'OFF';
      onChange({ ...working });
    });
    row.append(lab, btn);
    if (note) row.append(el('p', 'setting__note', note));
    return row;
  };

  panel.append(
    slider('textSpeed', '文字の速さ', 4, 60, 2, (v) => (v <= 10 ? 'はやい' : v >= 45 ? 'ゆっくり' : 'ふつう')),
    slider('autoDelay', 'オート送りの間', 400, 3200, 100, (v) => `${(v / 1000).toFixed(1)}秒`),
    slider('music', 'BGM', 0, 1, 0.05, (v) => `${Math.round(v * 100)}%`),
    slider('ambient', '環境音', 0, 1, 0.05, (v) => `${Math.round(v * 100)}%`),
    slider('sfx', '効果音', 0, 1, 0.05, (v) => `${Math.round(v * 100)}%`),
    toggle('muted', 'ミュート'),
    toggle('showHints', 'ヒントを表示', '店主のメモ（材料のヒント）と、注文の味グラフを表示します。'),
  );

  const foot = el('footer', 'panel__foot');
  const reset = el('button', 'btn', '初期設定に戻す');
  reset.type = 'button';
  reset.addEventListener('click', () => {
    Object.assign(working, DEFAULT_SETTINGS);
    onChange({ ...working });
    closeOverlay();
    openSettingsPanel(working, onChange);
  });
  const close = el('button', 'btn btn--primary', '閉じる');
  close.type = 'button';
  close.addEventListener('click', () => closeOverlay());
  foot.append(reset, close);
  panel.append(foot);

  openOverlay(panel, { dismissible: true });
}

/* ------------------------------------------------------------------ *
 * セーブ / ロード
 * ------------------------------------------------------------------ */

export function openSavesPanel(
  mode: 'save' | 'load',
  save: SaveData | null,
  handlers: { onLoad?: (slot: SlotId) => void; onSaved?: () => void } = {},
): void {
  const panel = el('div', 'panel panel--saves');
  panel.append(el('h2', 'panel__title', mode === 'save' ? 'セーブ' : 'ロード'));
  const list = el('div', 'slots');

  const render = () => {
    clear(list);
    for (const meta of allSlotMeta()) {
      const row = el('div', 'slot');
      const info = el('div', 'slot__info');
      const title = meta.slot === 'auto' ? 'オートセーブ' : `スロット ${meta.slot}`;
      info.append(el('p', 'slot__title', title));
      if (meta.exists) {
        info.append(
          el('p', 'slot__meta', `${meta.chapterTitle ?? ''}${meta.sceneTitle ? ` ／ ${meta.sceneTitle}` : ''}`),
          el('p', 'slot__sub', `${formatDate(meta.savedAt ?? 0)} ・ ${formatPlaytime(meta.playtimeMs ?? 0)}`),
        );
      } else {
        info.append(el('p', 'slot__empty', '― 空き ―'));
      }
      row.append(info);
      const actions = el('div', 'slot__actions');
      if (mode === 'save' && save && meta.slot !== 'auto') {
        const btn = el('button', 'btn btn--small btn--primary', 'ここにセーブ');
        btn.type = 'button';
        btn.addEventListener('click', () => {
          saveToSlot(meta.slot, save);
          toast('セーブしました');
          handlers.onSaved?.();
          render();
        });
        actions.append(btn);
      }
      if (meta.exists && mode === 'load') {
        const btn = el('button', 'btn btn--small btn--primary', 'ロード');
        btn.type = 'button';
        btn.addEventListener('click', () => {
          if (loadFromSlot(meta.slot)) handlers.onLoad?.(meta.slot);
        });
        actions.append(btn);
      }
      if (meta.exists) {
        const del = el('button', 'btn btn--small', '削除');
        del.type = 'button';
        del.addEventListener('click', () => {
          deleteSlot(meta.slot);
          render();
        });
        actions.append(del);
      }
      row.append(actions);
      list.append(row);
    }
  };
  render();
  panel.append(list);

  const foot = el('footer', 'panel__foot');
  const exportBtn = el('button', 'btn', 'バックアップを書き出す');
  exportBtn.type = 'button';
  exportBtn.addEventListener('click', () => {
    if (!save) return;
    const text = exportSave(save);
    void navigator.clipboard?.writeText(text).then(
      () => toast('セーブデータをコピーしました'),
      () => toast('コピーできませんでした'),
    );
  });
  const importBtn = el('button', 'btn', 'バックアップを読み込む');
  importBtn.type = 'button';
  importBtn.addEventListener('click', () => {
    const text = window.prompt('セーブデータの文字列を貼り付けてください');
    if (!text) return;
    const data = importSave(text);
    if (!data) {
      toast('読み込めませんでした');
      return;
    }
    saveToSlot('3', data);
    toast('スロット3に読み込みました');
    render();
  });
  const close = el('button', 'btn btn--primary', '閉じる');
  close.type = 'button';
  close.addEventListener('click', () => closeOverlay());
  if (mode === 'save') foot.append(exportBtn, importBtn);
  else foot.append(importBtn);
  foot.append(close);
  panel.append(foot);

  openOverlay(panel, { dismissible: true });
}

/* ------------------------------------------------------------------ *
 * 章をえらぶ
 * ------------------------------------------------------------------ */

export function openChaptersPanel(save: SaveData | null, onPick: (chapterId: string) => void): void {
  const panel = el('div', 'panel panel--chapters');
  panel.append(el('h2', 'panel__title', '章をえらぶ'));
  const maxChapter = Number(save?.flags.maxChapter ?? 0);
  const list = el('div', 'chapters');
  CHAPTERS.forEach((chapter, index) => {
    const unlocked = index <= maxChapter;
    const row = el('button', 'chapter' + (unlocked ? '' : ' is-locked'));
    row.type = 'button';
    row.append(el('span', 'chapter__no', chapter.title));
    row.append(el('span', 'chapter__name', chapter.subtitle));
    if (!unlocked) row.append(el('span', 'chapter__lock', '未解放'));
    row.disabled = !unlocked;
    row.addEventListener('click', () => {
      if (!unlocked) return;
      onPick(chapter.id);
    });
    list.append(row);
  });
  panel.append(list);
  panel.append(el('p', 'page__note', '章をえらぶと、その章の頭からはじまります。'));

  const foot = el('footer', 'panel__foot');
  const close = el('button', 'btn btn--primary', '閉じる');
  close.type = 'button';
  close.addEventListener('click', () => closeOverlay());
  foot.append(close);
  panel.append(foot);
  openOverlay(panel, { dismissible: true });
}

/* ------------------------------------------------------------------ *
 * 履歴
 * ------------------------------------------------------------------ */

export interface LogLine {
  name: string;
  text: string;
  mood?: string;
}

export function openLogPanel(lines: LogLine[]): void {
  const panel = el('div', 'panel panel--log');
  panel.append(el('h2', 'panel__title', '履歴'));
  const body = el('div', 'log');
  for (const line of lines.slice(-120)) {
    const item = el('div', 'log__item');
    item.append(el('span', 'log__name', line.name), el('p', 'log__text', line.text));
    body.append(item);
  }
  panel.append(body);
  const foot = el('footer', 'panel__foot');
  const close = el('button', 'btn btn--primary', '閉じる');
  close.type = 'button';
  close.addEventListener('click', () => closeOverlay());
  foot.append(close);
  panel.append(foot);
  openOverlay(panel, { dismissible: true, className: 'panel--wide' });
  body.scrollTop = body.scrollHeight;
}