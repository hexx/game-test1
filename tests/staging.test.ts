import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../src/game/script';
import type { Line } from '../src/game/types';

/**
 * 立ち絵の立ち位置チェック。
 * 章のなかで、同じ立ち位置に別のキャラクターが同時に入ると絵が重なってしまう。
 * （章の変わり目では物語側が舞台を一度空にするので、章ごとにリセットして考える）
 */
describe('立ち位置', () => {
  it('同じ章のなかで、同じ立ち位置が二重に使われない', () => {
    const conflicts: string[] = [];
    for (const chapter of CHAPTERS) {
      const cast = new Map<string, string>();
      for (const scene of chapter.scenes) {
        const walk = (lines: Line[]) => {
          for (const line of lines) {
            if (line.t === 'enter') {
              const slot = line.slot ?? 'center';
              for (const [who, occupied] of cast) {
                if (occupied === slot && who !== line.who) {
                  conflicts.push(`${chapter.id}/${scene.id}: ${line.who}(${slot}) と ${who}`);
                }
              }
              cast.set(line.who, slot);
            } else if (line.t === 'exit') {
              cast.delete(line.who);
            } else if (line.t === 'if') {
              walk(line.then);
              if (line.else) walk(line.else);
            }
          }
        };
        walk(scene.lines);
      }
    }
    expect(conflicts).toEqual([]);
  });
});