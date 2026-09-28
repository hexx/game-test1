// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * DOM のスモークテスト。
 * 「タイトル → 名前入力 → あそびかた → 本編のセリフ送り → 注文パネル → 提供結果」までを一通り通す。
 */

const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
const bodyHtml = html
  .slice(html.indexOf('<body>') + '<body>'.length, html.indexOf('</body>'))
  .replace(/<script[\s\S]*?<\/script>/g, '');

if (typeof globalThis.requestAnimationFrame !== 'function') {
  Object.assign(globalThis, {
    requestAnimationFrame: (cb: (t: number) => void) => window.setTimeout(() => cb(Date.now()), 16),
    cancelAnimationFrame: (id: number) => window.clearTimeout(id),
  });
}

async function waitFor(check: () => boolean, timeout = 6000, label = 'condition'): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (check()) return;
    await new Promise((resolve) => window.setTimeout(resolve, 40));
  }
  throw new Error(`タイムアウト: ${label}`);
}

function click(node: Element | null): void {
  if (!node) throw new Error('クリック対象が見つかりません');
  node.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
  node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function $<T extends Element = HTMLElement>(selector: string): T | null {
  return document.querySelector<T>(selector);
}

/** セリフを進めながら、条件が満たされるまでクリックし続ける */
async function advanceUntil(check: () => boolean, maxClicks = 120): Promise<boolean> {
  for (let i = 0; i < maxClicks; i += 1) {
    if (check()) return true;
    click($('#stage'));
    await new Promise((resolve) => window.setTimeout(resolve, 70));
  }
  return check();
}

describe('UI スモーク', () => {
  it('タイトルから注文・提供まで通しで動く', async () => {
    document.body.innerHTML = bodyHtml;
    await import('../src/main');

    // タイトルから「登場人物」を開ける（まだ誰にも会っていない状態）
    click($('button[data-action="cast"]'));
    await waitFor(() => $('.panel--cast') !== null, 4000, '登場人物パネル');
    const castPanel = $('.panel--cast')!;
    expect(castPanel.querySelectorAll('.castbook__item').length).toBe(8);
    expect(castPanel.querySelectorAll('.castbook__badge.is-met').length).toBe(0);
    expect(castPanel.querySelector('.castbook__block-body.is-locked')?.textContent).toContain('？？？');
    click($('.panel--cast .panel__foot .btn--primary'));
    await waitFor(() => $('.panel--cast') === null, 4000, '登場人物を閉じる');

    // タイトル → 名前入力
    expect($('button[data-action="new"]')).toBeTruthy();
    click($('button[data-action="new"]'));
    await waitFor(() => $('.panel--name .btn--primary') !== null, 4000, '名前入力パネル');
    click($('.panel--name .btn--primary'));

    // タイトルからは「あそびかた」も開ける（中身を確認して閉じる）
    await waitFor(() => $('.panel--help') !== null, 4000, 'あそびかたパネル');
    const help = $('.panel--help')!;
    expect(help.textContent).toContain('ベースを1つ');
    expect(help.textContent).toContain('アレンジを2つまで');
    expect(help.textContent).toContain('クリック / スペース / Enter');
    click($('.panel--help .panel__foot .btn--primary'));
    await waitFor(() => $('.panel--help') === null, 4000, 'あそびかたを閉じる');

    // 初回の説明を閉じたら「既読」が保存される
    expect(window.localStorage.getItem('midnight-blend.settings.v1')).toContain('"seenHelp":true');

    // 本編へ
    await waitFor(() => $('#screen-game')?.classList.contains('is-active') === true, 4000, '本編画面');
    await waitFor(
      () => ($('#dialogue-text')?.textContent ?? '').includes('午前零時'),
      8000,
      '最初のセリフ',
    );

    // 背景が描画されている
    expect($('#bg-layer .bg__svg')).toBeTruthy();

    // クリックで次の行に進む
    const before = $('#dialogue-text')?.textContent ?? '';
    click($('#stage'));
    await new Promise((resolve) => window.setTimeout(resolve, 200));
    click($('#stage'));
    await waitFor(() => ($('#dialogue-text')?.textContent ?? '') !== before, 6000, '次のセリフ');

    // 立ち絵が出る（プロローグでガーネットが登場する）
    expect(await advanceUntil(() => $('.sprite svg') !== null)).toBe(true);

    // 出会った人は名鑑に載る（メニュー → 登場人物）
    click($('#btn-menu'));
    await waitFor(() => $('.panel--menu') !== null, 4000, 'メニュー');
    const castMenuButton = [...document.querySelectorAll<HTMLButtonElement>('.menu__btn')].find((b) =>
      b.textContent?.includes('登場人物'),
    );
    click(castMenuButton!);
    await waitFor(() => $('.panel--cast') !== null, 4000, '名鑑（本編から）');
    const metPanel = $('.panel--cast')!;
    const garnetItem = [...metPanel.querySelectorAll<HTMLElement>('.castbook__item')].find((b) =>
      b.textContent?.includes('ガーネット'),
    );
    expect(garnetItem?.classList.contains('is-unmet')).toBe(false);
    expect(metPanel.querySelectorAll('.castbook__badge.is-met').length).toBe(1);
    // 本人の声が聴ける（ガーネットを選択して「ひとこと聴く」）
    click(garnetItem!);
    const voiceBtn = [...metPanel.querySelectorAll<HTMLButtonElement>('.castbook__voice .btn')].find(
      (b) => b.textContent === 'ひとこと聴く',
    );
    expect(voiceBtn).toBeTruthy();
    click(voiceBtn!);
    expect($('.castbook__line')?.textContent ?? '').toMatch(/「.+」/);
    click($('.panel--cast .panel__foot .btn--primary'));
    await waitFor(() => $('.panel--cast') === null, 4000, '名鑑を閉じる');

    // 注文パネルまで進める（チュートリアルの一杯）
    expect(await advanceUntil(() => $('.panel--order') !== null)).toBe(true);
    const orderPanel = $('.panel--order')!;
    expect(orderPanel.querySelector('.order__guide')?.textContent).toContain('アレンジを2つまで');
    expect(orderPanel.textContent).toContain('アレンジ（2つまで）');

    // ベース無しで3つ選ぶ、という不正な状態は作れない
    const ingredients = [...orderPanel.querySelectorAll<HTMLButtonElement>('.ingredient')];
    const byName = (name: string) => ingredients.find((b) => b.textContent?.includes(name));
    for (const name of ['はちみつ', 'シナモン', 'レモン']) byName(name)!.click();
    expect(orderPanel.querySelector('.order__error')?.textContent).toContain('ベース');
    expect(orderPanel.querySelectorAll('.ingredient.is-active').length).toBe(2);

    // ミルクだけ・アイスで淹れる（ラテアートなしで結果まで進む）
    byName('ミルク')!.click();
    [...orderPanel.querySelectorAll<HTMLButtonElement>('.order__temp .chip')]
      .find((b) => b.textContent === 'ICE')!
      .click();
    click(orderPanel.querySelector('.order__foot .btn--primary'));

    await waitFor(() => $('.panel--result') !== null, 8000, '結果パネル');
    expect($('.panel--result')!.textContent).toContain('ミルク');
    click($('.panel--result .order__foot .btn--primary'));
    await waitFor(() => $('.panel--result') === null, 4000, '結果パネルを閉じる');

    // 提供後、物語が続く
    await waitFor(() => ($('#dialogue-text')?.textContent ?? '').length > 0, 4000, '提供後のセリフ');
  }, 60000);
});