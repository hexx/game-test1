import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * CSS の取り決めを守るためのテスト。
 *
 * `hidden` 属性は「ブラウザ既定のスタイル（UA オリジン）」なので、
 * 作者CSS の `display` 指定に負ける。過去に `.overlay { display: grid }` が
 * `hidden` を打ち消し、「透明な全画面オーバーレイがクリックを吸い続ける」不具合を出した。
 * そのため `[hidden] { display: none !important }` を必ず持つ。
 */
describe('CSS の取り決め', () => {
  const css = readFileSync(join(process.cwd(), 'src/styles.css'), 'utf8');

  it('[hidden] が作者CSSの display に負けない', () => {
    const rule = css.match(/\[hidden\]\s*\{([^}]*)\}/);
    expect(rule, '[hidden] ルールが見つからない').toBeTruthy();
    expect(rule![1]).toMatch(/display:\s*none\s*!important/);
  });

  it('開いていないオーバーレイ/チャプターカードはクリックを奪わない', () => {
    expect(css).toMatch(/\.overlay:not\(\.is-open\)[\s\S]{0,80}pointer-events:\s*none/);
  });

  it('display の !important は [hidden] だけが使う（優先順位を崩さない）', () => {
    const withImportant = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)]
      .filter(([, , body]) => /display:[^;]*!important/.test(body))
      .map(([, selector]) => selector.trim());
    expect(withImportant.length).toBeGreaterThan(0);
    expect(withImportant.every((selector) => selector.includes('[hidden]'))).toBe(true);
  });
});