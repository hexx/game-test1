import { CHARACTERS } from '../game/characters';
import { PROFILES, PROFILE_ORDER, isMet, secretText, usualText } from '../game/profiles';
import type { CharId, Mood, SaveData } from '../game/types';
import { audio } from '../audio/audio';
import { clamp, el, escapeHtml } from './dom';
import { closeOverlay, openOverlay } from './overlay';
import { spriteSVG } from './sprite';

/**
 * 登場人物名鑑。
 * 基本情報はいつでも読める。物語のなかで出会った人だけ「本人の声」「いつもの一杯」「もうひとつの顔」が解放される。
 */
export function openCharactersPanel(save: SaveData | null): void {
  const panel = el('div', 'panel panel--cast');
  panel.append(el('h2', 'panel__title', '登場人物'));

  const metCount = PROFILE_ORDER.filter((who) => isMet(save, who)).length;
  panel.append(
    el(
      'p',
      'panel__desc',
      `出会った人：${metCount} / ${PROFILE_ORDER.length}。夜のなかで会った人の欄には、本人の声と、いつもの一杯が増えていきます。`,
    ),
  );

  const book = el('div', 'castbook');
  const list = el('ul', 'castbook__list');
  const detail = el('div', 'castbook__detail');
  book.append(list, detail);
  panel.append(book);

  let current: CharId = PROFILE_ORDER.find((who) => isMet(save, who)) ?? 'garnet';
  let voiceIndex = 0;
  let voiceStop: (() => void) | null = null;

  const renderDetail = () => {
    voiceStop?.();
    voiceStop = null;
    voiceIndex = 0;
    const def = CHARACTERS[current];
    const profile = PROFILES[current];
    const met = isMet(save, current);
    const secret = secretText(profile, save, met);
    const trust = clamp(Number(save?.trust[current] ?? 0) || 0, 0, 99);

    detail.replaceChildren();

    const portrait = el('div', `castbook__portrait${met ? '' : ' is-unmet'}`);
    portrait.innerHTML = spriteSVG(current, met ? 'normal' : 'normal');
    detail.append(portrait);

    const info = el('div', 'castbook__info');
    const heading = el('div', 'castbook__heading');
    heading.innerHTML = `<h3 class="castbook__name">${escapeHtml(def.name)}<span class="castbook__reading">${escapeHtml(def.reading)}</span></h3>`;
    heading.append(el('span', `castbook__badge${met ? ' is-met' : ''}`, met ? '出会った' : '未登場'));
    info.append(heading);
    info.append(el('p', 'castbook__species', `${def.species} ／ 初登場：${profile.debut}`));
    info.append(el('p', 'castbook__catch', profile.catch));

    const meta = el('dl', 'castbook__meta');
    for (const row of profile.meta) {
      meta.append(el('dt', undefined, row.key), el('dd', undefined, row.value));
    }
    info.append(meta);

    // いつもの一杯
    const usual = el('div', 'castbook__block');
    usual.append(el('h4', 'castbook__block-title', 'いつもの一杯'));
    usual.append(el('p', 'castbook__block-body', usualText(profile, save, met)));
    info.append(usual);

    // もうひとつの顔（条件を満たすまで伏せる）
    const secretBox = el('div', 'castbook__block');
    secretBox.append(el('h4', 'castbook__block-title', 'もうひとつの顔'));
    if (secret) {
      secretBox.append(el('p', 'castbook__block-body is-secret', secret));
    } else {
      secretBox.append(
        el(
          'p',
          'castbook__block-body is-locked',
          met ? '？？？（夜を重ねると、見えてくる）' : '？？？（会うと分かります）',
        ),
      );
    }
    info.append(secretBox);

    // 距離（信頼度）
    if (met) {
      const trustBox = el('div', 'castbook__trust');
      trustBox.append(el('span', 'castbook__trust-name', '距離'));
      const bar = el('span', 'trust__bar');
      const fill = el('span', 'trust__fill');
      fill.style.width = `${Math.min(100, trust * 10)}%`;
      bar.append(fill);
      trustBox.append(bar, el('span', 'castbook__trust-value', String(trust)));
      info.append(trustBox);
    }

    // 本人の声
    const voice = el('div', 'castbook__voice');
    const voiceText = el('p', 'castbook__line', met ? '「ひとこと聴く」を押すと、本人の声が聞こえます。' : '物語のなかで出会うと、声が聞こえます。');
    const voiceBtn = el('button', 'btn btn--small', met ? 'ひとこと聴く' : '未解放');
    voiceBtn.type = 'button';
    voiceBtn.disabled = !met;

    const playLine = (mood: Mood, text: string) => {
      const host = detail.querySelector<HTMLElement>('.castbook__portrait');
      if (host) host.innerHTML = spriteSVG(current, mood);
      voiceText.textContent = `「${text}」`;
      voiceText.classList.remove('is-in');
      void voiceText.offsetWidth;
      voiceText.classList.add('is-in');
    };

    voiceBtn.addEventListener('click', () => {
      const lines = PROFILES[current].lines;
      const line = lines[voiceIndex % lines.length];
      voiceIndex += 1;
      audio.sfx('clink');
      playLine(line.mood, line.text);
      voiceBtn.textContent = voiceIndex >= lines.length ? 'もう一度（最初から）' : 'つづきを聴く';
    });

    voiceStop = () => {
      voiceText.textContent = '';
    };

    voice.append(voiceBtn, voiceText);
    info.append(voice);

    detail.append(info);
  };

  for (const who of PROFILE_ORDER) {
    const def = CHARACTERS[who];
    const met = isMet(save, who);
    const item = el('li', 'castbook__li');
    const btn = el('button', `castbook__item${met ? '' : ' is-unmet'}`);
    btn.type = 'button';
    btn.dataset.who = who;
    const thumb = el('span', 'castbook__thumb');
    thumb.innerHTML = spriteSVG(who, 'normal');
    btn.append(thumb, el('span', 'castbook__item-name', def.name));
    if (!met) btn.append(el('span', 'castbook__item-lock', '未登場'));
    btn.addEventListener('click', () => {
      current = who;
      audio.sfx('page');
      for (const node of list.querySelectorAll('.castbook__item')) {
        node.classList.toggle('is-active', (node as HTMLElement).dataset.who === who);
      }
      renderDetail();
    });
    item.append(btn);
    list.append(item);
  }

  const active = list.querySelector<HTMLElement>(`.castbook__item[data-who="${current}"]`);
  active?.classList.add('is-active');
  renderDetail();

  const foot = el('footer', 'panel__foot');
  const close = el('button', 'btn btn--primary', '閉じる');
  close.type = 'button';
  close.addEventListener('click', () => closeOverlay());
  foot.append(close);
  panel.append(foot);

  openOverlay(panel, { dismissible: true });
}