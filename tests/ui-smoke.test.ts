// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * DOM のスモークテスト。
 * 「タイトル → 名前入力 → 本編の最初のセリフ」までが動くことを保証する。
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

describe('UI スモーク', () => {
  it('タイトルから本編が始まる', async () => {
    document.body.innerHTML = bodyHtml;
    await import('../src/main');

    const newButton = document.querySelector<HTMLButtonElement>('button[data-action="new"]');
    expect(newButton).toBeTruthy();
    newButton!.click();

    await waitFor(
      () => document.querySelector('.panel--name .btn--primary') !== null,
      4000,
      '名前入力パネル',
    );
    document.querySelector<HTMLButtonElement>('.panel--name .btn--primary')!.click();

    await waitFor(
      () => document.querySelector('#screen-game')?.classList.contains('is-active') === true,
      4000,
      '本編画面',
    );
    await waitFor(
      () => (document.querySelector('#dialogue-text')?.textContent ?? '').includes('午前零時'),
      8000,
      '最初のセリフ',
    );

    // クリックで次の行に進む
    const before = document.querySelector('#dialogue-text')?.textContent ?? '';
    document.querySelector<HTMLElement>('#stage')!.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true }),
    );
    await new Promise((resolve) => window.setTimeout(resolve, 200));
    document.querySelector<HTMLElement>('#stage')!.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true }),
    );
    await waitFor(
      () => (document.querySelector('#dialogue-text')?.textContent ?? '') !== before,
      6000,
      '次のセリフ',
    );

    // 背景が描画されている
    expect(document.querySelector('#bg-layer .bg__svg')).toBeTruthy();

    // しばらく進めると立ち絵が出る（プロローグでガーネットが登場する）
    for (let i = 0; i < 24 && !document.querySelector('#cast .sprite'); i += 1) {
      document.querySelector<HTMLElement>('#stage')!.dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true }),
      );
      await new Promise((resolve) => window.setTimeout(resolve, 120));
    }
    const sprite = document.querySelector('#cast .sprite');
    expect(sprite).toBeTruthy();
    expect(sprite!.querySelector('svg')).toBeTruthy();
  }, 30000);
});