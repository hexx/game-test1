import { fetchEndings, recordEnding } from '../game/api';
import { ENDINGS } from '../game/script';
import type { EndingId, SaveData } from '../game/types';
import { el } from './dom';
import { closeOverlay, openOverlay } from './overlay';

export interface EndingHandlers {
  onTitle: () => void;
  onReplay: () => void;
  onJournal: () => void;
  onCast: () => void;
}

const ENDING_THEME: Record<EndingId, { color: string; art: string }> = {
  dawn: {
    color: '#f0c074',
    art: `<circle cx="100" cy="70" r="30" fill="#ffd9a0" opacity=".85"/><path d="M0,120 h200 v60 H0 Z" fill="#2b2233"/><path d="M20,120 q20,-26 40,0 M140,120 q20,-26 40,0" fill="none" stroke="#2b2233" stroke-width="6"/>`,
  },
  dream: {
    color: '#8fd3e8',
    art: `<path d="M100,30 a34,34 0 1 0 0,68 a26,26 0 1 1 0,-68 Z" fill="#cfeaf5" opacity=".9"/><g stroke="#8fd3e8" stroke-width="2" opacity=".7"><path d="M30,140 q20,-16 40,0 t40,0 t40,0" fill="none"/><path d="M30,156 q20,-16 40,0 t40,0 t40,0" fill="none"/></g>`,
  },
  quiet: {
    color: '#9aa0b5',
    art: `<path d="M40,120 h120 v70 H40 Z" fill="#2b2233"/><path d="M60,120 q18,-22 36,0" fill="none" stroke="#9aa0b5" stroke-width="5"/><circle cx="150" cy="52" r="18" fill="#e8e6f2" opacity=".5"/>`,
  },
};

export function openEndingPanel(id: EndingId, save: SaveData, handlers: EndingHandlers): void {
  const info = ENDINGS[id];
  const theme = ENDING_THEME[id];
  const panel = el('div', 'panel panel--ending');
  panel.classList.add(`ending--${id}`);

  const art = el('div', 'ending__art');
  art.innerHTML = `<svg viewBox="0 0 200 190" aria-hidden="true">${theme.art}</svg>`;
  panel.append(el('p', 'ending__label', info.label));
  panel.append(el('h2', 'ending__title', info.title));
  panel.append(art);
  panel.append(el('p', 'ending__text', info.text));

  const served = save.drinks.length;
  const perfect = save.drinks.filter((d) => d.grade === 'perfect').length;
  const stats = el('ul', 'ending__stats');
  stats.append(el('li', undefined, `出した一杯：${served} 杯`));
  stats.append(
    el('li', undefined, `完璧だった一杯：${perfect} 杯（${served ? Math.round((perfect / served) * 100) : 0}%）`),
  );
  stats.append(el('li', undefined, `発見したレシピ：${save.discovered.length} / 30`));
  panel.append(stats);

  const tally = el('p', 'ending__tally', '');
  panel.append(tally);
  void (async () => {
    const before = await fetchEndings();
    const counts = (await recordEnding(id)) ?? before;
    if (!counts) {
      tally.textContent = '（みんなの記録は、KV を設定すると有効になります）';
      tally.classList.add('is-off');
      return;
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    tally.textContent = `みんなの記録：この夜に辿り着いたのは ${counts[id] ?? 1} / ${total} 人`;
  })();

  const foot = el('footer', 'panel__foot');
  const journal = el('button', 'btn', 'レシピ帳');
  journal.type = 'button';
  journal.addEventListener('click', () => {
    closeOverlay(true);
    handlers.onJournal();
  });
  const cast = el('button', 'btn', '登場人物');
  cast.type = 'button';
  cast.addEventListener('click', () => {
    closeOverlay(true);
    handlers.onCast();
  });
  const replay = el('button', 'btn', '終章から、もう一度');
  replay.type = 'button';
  replay.addEventListener('click', () => {
    closeOverlay(true);
    handlers.onReplay();
  });
  const title = el('button', 'btn btn--primary', 'タイトルへ');
  title.type = 'button';
  title.addEventListener('click', () => {
    closeOverlay(true);
    handlers.onTitle();
  });
  foot.append(journal, cast, replay, title);
  panel.append(foot);

  openOverlay(panel, { dismissible: false, className: 'panel--narrow' });
}