import type { Chapter } from '../types';
import { FINALE } from './finale';
import { NIGHT1 } from './night1';
import { NIGHT2 } from './night2';
import { NIGHT3 } from './night3';
import { NIGHT4 } from './night4';
import { PROLOGUE } from './prologue';

export const CHAPTERS: Chapter[] = [PROLOGUE, NIGHT1, NIGHT2, NIGHT3, NIGHT4, FINALE];

export const CHAPTER_BY_ID: Record<string, Chapter> = Object.fromEntries(
  CHAPTERS.map((c) => [c.id, c]),
);

export const CHAPTER_SUBTITLE: Record<string, string> = {
  prologue: '最初の一杯',
  night1: '眠れない者たち',
  night2: '雨の音',
  night3: '苦いものを',
  night4: '夢の話',
  finale: '夜明け前',
};

export const ENDINGS = {
  dawn: {
    id: 'dawn',
    title: '眠らない夜の続き',
    label: 'GOOD ENDING',
    text: 'この店は、あなたの店になった。時計は動きつづけ、ベルは鳴りつづける。',
  },
  dream: {
    id: 'dream',
    title: '夢の在り処',
    label: 'TRUE ENDING',
    text: 'ふたりで夜の街を出た。はじめて、朝まで眠った。',
  },
  quiet: {
    id: 'quiet',
    title: '静かな閉店',
    label: 'BAD ENDING',
    text: '看板の灯りは消えた。けれど、扉の鍵は、開いている。',
  },
} as const;

export type EndingKey = keyof typeof ENDINGS;

/** 章セレクト用（エンディングは含めない） */
export const SELECTABLE_CHAPTERS = CHAPTERS.filter((c) => c.id !== 'finale');