import { audio } from '../audio/audio';
import { CHARACTERS } from '../game/characters';
import { INGREDIENTS, INGREDIENT_MAP, RECIPES, makeDrink, validateSelection } from '../game/ingredients';
import type { CharId, Drink, Grade, IngredientId, Order, Temperature } from '../game/types';
import { artLabel, cupSVG, radarSVG, type LatteArt } from './cup';
import { el, qs } from './dom';
import { ingredientIcon } from './icons';
import { closeOverlay, openOverlay } from './overlay';
import { spriteSVG } from './sprite';

export interface OrderView {
  order: Order;
  customer: CharId;
  hint?: string;
  showHints: boolean;
  /** 発見済みレシピ（店主のメモ） */
  discovered: string[];
}

export interface BrewOutcome {
  drink: Drink;
  art: LatteArt;
}

const MAX_INGREDIENTS = 3;

/* ------------------------------------------------------------------ *
 * 淹れるパネル
 * ------------------------------------------------------------------ */

export async function runBrewPanel(view: OrderView): Promise<BrewOutcome> {
  const selected: IngredientId[] = [];
  let temp: Temperature = 'hot';
  let notesOpen = false;

  const panel = el('div', 'panel panel--order');

  const head = el('header', 'order__head');
  const portrait = el('div', 'order__portrait');
  portrait.innerHTML = spriteSVG(view.customer, 'normal');
  const headText = el('div', 'order__headtext');
  headText.append(
    el('p', 'order__who', `${CHARACTERS[view.customer].name} の注文`),
    el('p', 'order__request', `「${view.order.label}」`),
  );
  if (view.showHints && view.hint) headText.append(el('p', 'order__hint', `店主のメモ：${view.hint}`));
  head.append(portrait, headText);

  const body = el('div', 'order__body');
  // 左：カップと温度
  const left = el('div', 'order__left');
  const cupBox = el('div', 'order__cup');
  const tempBox = el('div', 'order__temp');
  const hotBtn = el('button', 'chip is-active', 'HOT');
  const iceBtn = el('button', 'chip', 'ICE');
  hotBtn.type = 'button';
  iceBtn.type = 'button';
  tempBox.append(hotBtn, iceBtn);
  const mixName = el('p', 'order__mixname', '材料を選んでください');
  left.append(cupBox, tempBox, mixName);

  // 中：レーダー
  const mid = el('div', 'order__mid');
  const radarBox = el('div', 'order__radar');
  const flavorNote = el('p', 'order__flavor', '');
  mid.append(radarBox, flavorNote);

  // 右：材料
  const right = el('div', 'order__right');
  const baseTitle = el('h3', 'order__section', 'ベース');
  const baseGrid = el('div', 'ingredients');
  const addTitle = el('h3', 'order__section', 'アレンジ（2つまで）');
  const addGrid = el('div', 'ingredients');
  const buttons = new Map<IngredientId, HTMLButtonElement>();
  for (const ing of INGREDIENTS) {
    const btn = el('button', 'ingredient');
    btn.type = 'button';
    btn.dataset.id = ing.id;
    btn.innerHTML = `${ingredientIcon(ing.icon, ing.color)}<span class="ingredient__name">${ing.name}</span><span class="ingredient__order"></span>`;
    btn.title = ing.note;
    btn.addEventListener('click', () => toggleIngredient(ing.id));
    buttons.set(ing.id, btn);
    (ing.base ? baseGrid : addGrid).append(btn);
  }
  right.append(baseTitle, baseGrid, addTitle, addGrid, buildNotes());

  body.append(left, mid, right);

  // フッタ
  const foot = el('footer', 'order__foot');
  const notesBtn = el('button', 'btn', '店主のメモ');
  notesBtn.type = 'button';
  const errorMsg = el('p', 'order__error', '');
  const brewBtn = el('button', 'btn btn--primary', '淹れる');
  brewBtn.type = 'button';
  foot.append(notesBtn, errorMsg, brewBtn);

  panel.append(head, el('p', 'order__guide', 'ベースを1つ → アレンジを2つまで → 温度 → 「淹れる」'), body, foot);
  openOverlay(panel, { dismissible: false, className: 'panel--wide' });

  function buildNotes(): HTMLElement {
    const box = el('div', 'order__notes');
    box.hidden = !notesOpen;
    const list = el('ul', 'notes__list');
    if (view.discovered.length === 0) {
      list.append(el('li', 'notes__empty', 'まだ、何も書かれていない。'));
    }
    for (const name of view.discovered) {
      const li = el('li', 'notes__item');
      li.innerHTML = name;
      list.append(li);
    }
    box.append(el('p', 'notes__title', '見つけたレシピは、ここに書き足されていく。'), list);
    return box;
  }

  const notesBox = qs<HTMLElement>('.order__notes', panel);
  notesBtn.addEventListener('click', () => {
    notesOpen = !notesOpen;
    notesBox.hidden = !notesOpen;
    notesBtn.classList.toggle('is-active', notesOpen);
  });

  function toggleIngredient(id: IngredientId): void {
    const index = selected.indexOf(id);
    if (index >= 0) {
      selected.splice(index, 1);
    } else {
      const next = [...selected, id];
      if (next.length > MAX_INGREDIENTS) {
        errorMsg.textContent = '材料は3つまでです';
        return;
      }
      // ベースが無いまま枠を使い切ると、提供できない一杯になってしまうので先に止める
      if (next.length === MAX_INGREDIENTS && !next.some((x) => INGREDIENT_MAP[x].base)) {
        errorMsg.textContent = 'ベース（コーヒー・紅茶・緑茶・チョコレート・ミルク）を入れてください';
        return;
      }
      selected.push(id);
      audio.sfx('cup');
    }
    errorMsg.textContent = '';
    render();
  }

  function render(): void {
    for (const [id, btn] of buttons) {
      const order = selected.indexOf(id);
      btn.classList.toggle('is-active', order >= 0);
      qs('.ingredient__order', btn).textContent = order >= 0 ? String(order + 1) : '';
    }
    hotBtn.classList.toggle('is-active', temp === 'hot');
    iceBtn.classList.toggle('is-active', temp === 'iced');

    // 選んだ内容がそのまま提供できない場合は、先に理由を出す
    if (selected.length > 0) {
      const check = validateSelection(selected);
      errorMsg.textContent = check.ok ? '' : check.reason ?? '';
      brewBtn.classList.toggle('is-disabled', !check.ok);
    } else {
      errorMsg.textContent = '';
      brewBtn.classList.remove('is-disabled');
    }

    if (selected.length === 0) {
      cupBox.innerHTML = cupSVG({ color: '#3a3348', temperature: temp, size: 190 });
      mixName.textContent = '材料を選んでください';
      radarBox.innerHTML = radarSVG(null);
      flavorNote.textContent = '';
      return;
    }
    const drink = makeDrink(selected, temp);
    cupBox.innerHTML = cupSVG({ color: drink.color, temperature: drink.temperature, size: 190 });
    mixName.textContent = drink.name;
    const target = view.showHints && view.order.kind === 'profile' ? view.order.want : null;
    radarBox.innerHTML = radarSVG(drink.taste, target);
    flavorNote.textContent = drink.flavor;
  }

  hotBtn.addEventListener('click', () => {
    temp = 'hot';
    render();
  });
  iceBtn.addEventListener('click', () => {
    temp = 'iced';
    render();
  });

  render();

  const drink = await new Promise<Drink>((resolve) => {
    brewBtn.addEventListener('click', () => {
      const valid = validateSelection(selected);
      if (!valid.ok) {
        errorMsg.textContent = valid.reason ?? 'もう一度、材料を確認してください';
        return;
      }
      audio.sfx('pour');
      resolve(makeDrink(selected, temp));
    });
  });

  const hasMilk = drink.ingredients.includes('milk');
  const art: LatteArt = hasMilk && drink.temperature === 'hot' ? await runLatteArt() : 'none';
  closeOverlay(true);
  return { drink, art };
}

/* ------------------------------------------------------------------ *
 * ラテアート（ミルクを使ったときだけ）
 * ------------------------------------------------------------------ */

async function runLatteArt(): Promise<LatteArt> {
  const panel = el('div', 'panel panel--latte');
  panel.append(el('h2', 'latte__title', 'ラテアート'));
  panel.append(el('p', 'latte__desc', '線の上で「注ぐ」を押しつづけて、ミルクを落とそう。'));

  const gauge = el('div', 'latte__gauge');
  const target = el('div', 'latte__target');
  const cursor = el('div', 'latte__cursor');
  gauge.append(target, cursor);

  const milk = el('div', 'latte__milk');
  const milkFill = el('div', 'latte__milk-fill');
  milk.append(milkFill);

  const qualityText = el('p', 'latte__quality', 'できばえ 0%');
  const holdBtn = el('button', 'btn btn--primary latte__hold', '注ぐ（押している間）');
  holdBtn.type = 'button';

  panel.append(gauge, milk, qualityText, holdBtn);
  openOverlay(panel, { dismissible: false, className: 'panel--narrow' });

  let quality = 0;
  let milkLeft = 1;
  let holding = false;
  let t = 0;
  let last = performance.now();
  let autoPour = 0;

  const setHold = (v: boolean) => {
    holding = v;
    holdBtn.classList.toggle('is-active', v);
  };
  holdBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    setHold(true);
  });
  window.addEventListener('pointerup', () => setHold(false));
  holdBtn.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') setHold(true);
  });
  holdBtn.addEventListener('keyup', () => setHold(false));

  await new Promise<void>((resolve) => {
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      autoPour += dt;
      if (autoPour > 7 && !holding) setHold(true); // 放置対策
      const cPos = 0.5 + 0.42 * Math.sin(t * 1.55);
      const tPos = 0.5 + 0.28 * Math.sin(t * 0.83 + 1.1);
      cursor.style.left = `${(cPos * 100).toFixed(1)}%`;
      target.style.left = `${(tPos * 100).toFixed(1)}%`;
      if (holding && milkLeft > 0) {
        const diff = Math.abs(cPos - tPos);
        quality += diff < 0.13 ? dt * 46 : dt * 12;
        quality = Math.min(100, quality);
        milkLeft = Math.max(0, milkLeft - dt * 0.34);
        milkFill.style.width = `${((1 - milkLeft) * 100).toFixed(1)}%`;
        qualityText.textContent = `できばえ ${Math.round(quality)}%`;
      }
      const art: LatteArt = quality >= 72 ? 'rosetta' : quality >= 45 ? 'leaf' : quality >= 20 ? 'heart' : 'none';
      cursor.dataset.art = art;
      if (milkLeft <= 0) {
        audio.sfx('clink');
        resolve();
        return;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });

  const art: LatteArt = quality >= 72 ? 'rosetta' : quality >= 45 ? 'leaf' : quality >= 20 ? 'heart' : 'none';
  closeOverlay(true);
  return art;
}

/* ------------------------------------------------------------------ *
 * 提供結果
 * ------------------------------------------------------------------ */

const GRADE_LABEL: Record<Grade, string> = {
  perfect: '完璧',
  good: 'まずまず',
  off: 'ちがう',
};

const GRADE_NOTE: Record<Grade, string> = {
  perfect: '客の言葉と、カップの中身が、ぴたりと重なった。',
  good: '悪くない。けれど、何かが少しだけずれている。',
  off: '……これは、頼まれたものではない。',
};

export async function showResultPanel(opts: {
  drink: Drink;
  art: LatteArt;
  grade: Grade;
  customer: CharId;
  recipeName?: string;
}): Promise<void> {
  const panel = el('div', 'panel panel--result');
  panel.classList.add(`is-${opts.grade}`);
  panel.append(el('p', 'result__label', GRADE_LABEL[opts.grade]));
  panel.append(el('h2', 'result__name', opts.drink.name));

  const artBox = el('div', 'result__cup');
  artBox.innerHTML = cupSVG({ color: opts.drink.color, temperature: opts.drink.temperature, art: opts.art, size: 200 });
  panel.append(artBox);

  const rows = el('dl', 'result__rows');
  const row = (k: string, v: string) => {
    rows.append(el('dt', undefined, k), el('dd', undefined, v));
  };
  row('温度', opts.drink.temperature === 'hot' ? '温かい' : '冷たい');
  row('味', opts.drink.flavor);
  if (opts.art !== 'none') row('ラテアート', artLabel(opts.art));
  if (opts.recipeName) row('レシピ', opts.recipeName);
  panel.append(rows);
  panel.append(el('p', 'result__note', GRADE_NOTE[opts.grade]));

  const foot = el('footer', 'order__foot');
  const next = el('button', 'btn btn--primary', 'つぎへ');
  next.type = 'button';
  foot.append(next);
  panel.append(foot);

  openOverlay(panel, { dismissible: false, className: 'panel--narrow' });
  await new Promise<void>((resolve) => {
    next.addEventListener('click', () => resolve());
  });
  closeOverlay(true);
}

export function recipeNameOf(drink: Drink): string | undefined {
  if (!drink.recipeId) return undefined;
  return RECIPES.find((r) => r.id === drink.recipeId)?.name;
}