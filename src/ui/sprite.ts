import { CHARACTERS } from '../game/characters';
import type { CharId, CharDef, Mood } from '../game/types';

const OUTLINE = '#181322';

/* ------------------------------- 髪（奥） ------------------------------- */
function hairBack(def: CharDef): string {
  const { hairDark } = def;
  const g = `url(#hair-${def.id})`;
  const mass = `<ellipse cx="120" cy="118" rx="58" ry="62" fill="${g}" stroke="${OUTLINE}" stroke-width="3"/>`;
  switch (def.hairstyle) {
    case 'long':
      return `${mass}
        <path d="M62,104 C50,158 48,214 54,268 L92,254 C78,206 78,150 82,110 Z" fill="${g}" stroke="${OUTLINE}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M178,104 C190,158 192,214 186,268 L148,254 C162,206 162,150 158,110 Z" fill="${g}" stroke="${OUTLINE}" stroke-width="2.5" stroke-linejoin="round"/>`;
    case 'hime':
      return `${mass}
        <path d="M62,100 L58,262 L90,262 L86,100 Z" fill="${g}" stroke="${OUTLINE}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M178,100 L182,262 L150,262 L154,100 Z" fill="${g}" stroke="${OUTLINE}" stroke-width="2.5" stroke-linejoin="round"/>`;
    case 'twin':
      return `${mass}
        <ellipse cx="44" cy="176" rx="19" ry="48" fill="${g}" stroke="${OUTLINE}" stroke-width="2.5"/>
        <ellipse cx="196" cy="176" rx="19" ry="48" fill="${g}" stroke="${OUTLINE}" stroke-width="2.5"/>`;
    case 'wave':
      return `${mass}
        <path d="M60,110 C46,152 54,196 40,238 C62,232 74,210 70,182 C80,152 72,128 78,110 Z" fill="${g}" stroke="${OUTLINE}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M180,110 C194,152 186,196 200,238 C178,232 166,210 170,182 C160,152 168,128 162,110 Z" fill="${g}" stroke="${OUTLINE}" stroke-width="2.5" stroke-linejoin="round"/>`;
    case 'bun':
      return `${mass}<circle cx="120" cy="34" r="23" fill="${g}" stroke="${OUTLINE}" stroke-width="2.5"/>`;
    case 'short':
      return `${mass}<path d="M62,150 C58,178 66,196 76,204 C66,188 68,166 74,150 Z" fill="${hairDark}"/>`;
    case 'messy':
      return `${mass}<path d="M60,146 L46,190 L70,176 L62,214 L86,192 Z" fill="${g}" stroke="${OUTLINE}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M180,146 L194,190 L170,176 L178,214 L154,192 Z" fill="${g}" stroke="${OUTLINE}" stroke-width="2.5" stroke-linejoin="round"/>`;
    default:
      return `${mass}<path d="M62,148 C56,180 62,200 72,210 L74,168 Z" fill="${hairDark}" stroke="${OUTLINE}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M178,148 C184,180 178,200 168,210 L166,168 Z" fill="${hairDark}" stroke="${OUTLINE}" stroke-width="2" stroke-linejoin="round"/>`;
  }
}

/* ------------------------------- 髪（前） ------------------------------- */
function hairFront(def: CharDef): string {
  const g = `url(#hair-${def.id})`;
  const cap = (d: string) =>
    `<path d="${d}" fill="${g}" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>`;
  switch (def.hairstyle) {
    case 'long':
      return cap('M64,118 C62,58 96,40 120,40 C146,40 180,58 178,120 C170,92 150,82 120,88 C94,82 70,92 64,118 Z');
    case 'hime':
      return cap('M62,120 C60,58 96,38 120,38 C144,38 180,58 178,122 C172,90 152,78 120,84 C88,78 68,90 62,120 Z');
    case 'twin':
      return cap('M64,116 C62,60 96,44 120,44 C146,44 178,60 176,118 C166,94 148,84 120,88 C96,84 74,94 64,116 Z');
    case 'messy':
      return cap('M58,122 L48,84 L74,96 L66,54 L94,74 L96,40 L120,64 L134,36 L148,68 L170,48 L168,88 L190,70 L182,112 C172,88 148,80 120,86 C92,80 66,94 58,122 Z');
    case 'bun':
      return cap('M64,118 C62,66 98,50 120,50 C144,50 178,66 176,118 C166,94 148,86 120,90 C96,86 74,96 64,118 Z');
    case 'wave':
      return cap('M60,126 C54,62 96,36 124,42 C156,48 186,66 180,126 C172,96 152,86 120,90 C94,86 70,98 60,126 Z');
    default:
      return cap('M64,118 C64,64 96,46 120,46 C146,46 178,64 178,120 C170,96 150,88 130,96 C118,76 100,78 94,98 C82,86 70,96 64,118 Z');
  }
}

/* ------------------------------- 目 ------------------------------- */
function eyes(def: CharDef, mood: Mood): string {
  const y = 132;
  const lx = 98;
  const rx = 142;
  const iris = (cx: number, cy: number, w: number, h: number, dx = 0, dy = 0) => `
    <ellipse cx="${cx}" cy="${cy}" rx="${w}" ry="${h}" fill="${def.accent}" stroke="${OUTLINE}" stroke-width="1.5"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${w * 0.42}" ry="${h * 0.62}" fill="#191322"/>
    <circle cx="${cx - w * 0.3 + dx}" cy="${cy - h * 0.34 + dy}" r="2.6" fill="#ffffff" opacity=".95"/>`;

  const open = (cx: number, w: number, h: number, dx = 0, dy = 0) =>
    `<ellipse cx="${cx}" cy="${y}" rx="${w}" ry="${h}" fill="#fdfaf6" stroke="${OUTLINE}" stroke-width="2.4"/>${iris(cx, y, w * 0.62, h * 0.72, dx, dy)}`;

  const closed = (cx: number, curve = 12) =>
    `<path d="M${cx - 11},${y + 1} q11,${curve} 22,0" fill="none" stroke="${OUTLINE}" stroke-width="3.2" stroke-linecap="round"/>`;

  const half = (cx: number, w: number, h: number) => `
    ${open(cx, w, h)}
    <path d="M${cx - w - 3},${y - 1} h${(w + 3) * 2} v-14 h-${(w + 3) * 2} Z" fill="${def.skin}"/>
    <path d="M${cx - w - 3},${y - 2} q${w + 3},-3 ${(w + 3) * 2},0" fill="none" stroke="${OUTLINE}" stroke-width="3.2" stroke-linecap="round"/>`;

  switch (mood) {
    case 'happy':
      return closed(lx) + closed(rx);
    case 'surprise':
      return open(lx, 11, 15) + open(rx, 11, 15);
    case 'sad':
      return open(lx, 10, 11, -2, 2) + open(rx, 10, 11, 2, 2);
    case 'tired':
      return half(lx, 10, 11) + half(rx, 10, 11);
    case 'shy':
      return open(lx, 10, 10, -3, 1) + open(rx, 10, 10, -3, 1);
    case 'think':
      return open(lx, 10, 11, -2, -3) + open(rx, 10, 11, -2, -3);
    case 'smug':
      return half(lx, 10, 10) + open(rx, 10, 9);
    case 'angry':
      return open(lx, 11, 10) + open(rx, 11, 10);
    case 'smile':
      return open(lx, 10, 11) + open(rx, 10, 11);
    default: {
      if (def.eyestyle === 'closed') return closed(lx) + closed(rx);
      const w = def.eyestyle === 'round' ? 10 : 11;
      const h = def.eyestyle === 'sleepy' ? 7 : def.eyestyle === 'sharp' ? 9 : 12;
      const lid =
        def.eyestyle === 'sharp'
          ? `<path d="M${lx - 14},${y - 10} q14,-3 28,3" fill="none" stroke="${OUTLINE}" stroke-width="3.2" stroke-linecap="round"/>
             <path d="M${rx + 14},${y - 10} q-14,-3 -28,3" fill="none" stroke="${OUTLINE}" stroke-width="3.2" stroke-linecap="round"/>`
          : '';
      return open(lx, w, h) + open(rx, w, h) + lid;
    }
  }
}

/* ------------------------------- 眉 ------------------------------- */
function brows(def: CharDef, mood: Mood): string {
  const s = `stroke="${def.hairDark}" stroke-width="3.4" fill="none" stroke-linecap="round"`;
  const l = (d: string) => `<path d="${d}" ${s}/>`;
  const r = (d: string) => `<path d="${d}" ${s}/>`;
  switch (mood) {
    case 'angry':
      return l('M84,108 L110,120') + r('M156,108 L130,120');
    case 'sad':
      return l('M84,103 L110,113') + r('M156,103 L130,113');
    case 'surprise':
      return l('M84,98 q13,-8 26,0') + r('M156,98 q-13,-8 -26,0');
    case 'smile':
    case 'happy':
      return l('M84,106 q13,-9 26,-1') + r('M156,106 q-13,-9 -26,-1');
    case 'tired':
      return l('M85,114 L109,117') + r('M155,114 L131,117');
    case 'smug':
      return l('M84,107 L110,118') + r('M156,104 q-13,-3 -26,3');
    default:
      return l('M85,110 q13,-7 25,-2') + r('M155,110 q-13,-7 -25,-2');
  }
}

/* ------------------------------- 口 ------------------------------- */
function mouth(def: CharDef, mood: Mood): string {
  const y = 158;
  const s = `stroke="${OUTLINE}" stroke-width="3" fill="none" stroke-linecap="round"`;
  const fangs = def.parts.includes('fangs')
    ? `<path d="M112,${y} l5,0 l-2.5,8 Z" fill="#fff8f0" stroke="${OUTLINE}" stroke-width="1.4"/>
       <path d="M124,${y} l5,0 l-2.5,8 Z" fill="#fff8f0" stroke="${OUTLINE}" stroke-width="1.4"/>`
    : '';
  let body: string;
  switch (mood) {
    case 'happy':
      body = `<path d="M109,${y - 4} q11,14 22,0 q-11,5 -22,0 Z" fill="#8c3b45" stroke="${OUTLINE}" stroke-width="2.4" stroke-linejoin="round"/>`;
      break;
    case 'smile':
      body = `<path d="M110,${y - 2} q10,9 20,0" ${s}/>`;
      break;
    case 'sad':
      body = `<path d="M111,${y + 3} q9,-7 18,0" ${s}/>`;
      break;
    case 'angry':
      body = `<path d="M110,${y} h20" ${s}/>`;
      break;
    case 'surprise':
      body = `<ellipse cx="120" cy="${y + 1}" rx="5" ry="6.5" fill="#8c3b45" stroke="${OUTLINE}" stroke-width="2"/>`;
      break;
    case 'shy':
      body = `<path d="M114,${y} q6,3 12,0" ${s}/>`;
      break;
    case 'smug':
      body = `<path d="M110,${y} q9,5 16,-3" ${s}/>`;
      break;
    case 'tired':
      body = `<path d="M113,${y + 1} h14" ${s}/>`;
      break;
    case 'think':
      body = `<path d="M113,${y} q7,2 13,-2" ${s}/>`;
      break;
    default:
      body = `<path d="M114,${y} q6,4 12,0" ${s}/>`;
  }
  return fangs + body;
}

/* ------------------------------- 装飾 ------------------------------- */
function wings(def: CharDef): string {
  if (!def.parts.includes('wings')) return '';
  return `<g opacity=".5">
    <path d="M56,206 C8,186 -8,246 10,306 C36,278 48,244 70,224 Z" fill="${def.accent}" stroke="${OUTLINE}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M184,206 C232,186 248,246 230,306 C204,278 192,244 170,224 Z" fill="${def.accent}" stroke="${OUTLINE}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M60,222 C36,236 24,266 22,290 M180,222 C204,236 216,266 218,290" fill="none" stroke="${OUTLINE}" stroke-width="1.6" opacity=".6"/>
  </g>`;
}

function headTop(def: CharDef): string {
  const out: string[] = [];
  const g = `url(#hair-${def.id})`;
  if (def.parts.includes('wolfears')) {
    out.push(`<path d="M74,52 L62,10 L104,36 Z" fill="${g}" stroke="${OUTLINE}" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M166,52 L178,10 L136,36 Z" fill="${g}" stroke="${OUTLINE}" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M78,48 L71,22 L96,38 Z" fill="${def.accent}" opacity=".5"/>
      <path d="M162,48 L169,22 L144,38 Z" fill="${def.accent}" opacity=".5"/>`);
  }
  if (def.parts.includes('longears')) {
    out.push(`<path d="M72,58 C52,24 56,2 68,4 C82,6 80,38 78,60 Z" fill="${def.skin}" stroke="${OUTLINE}" stroke-width="2.6"/>
      <path d="M168,58 C188,24 184,2 172,4 C158,6 160,38 162,60 Z" fill="${def.skin}" stroke="${OUTLINE}" stroke-width="2.6"/>`);
  }
  if (def.parts.includes('horns')) {
    out.push(`<path d="M78,54 C62,34 64,16 74,14 C86,12 84,38 88,50 Z" fill="${def.accent}" stroke="${OUTLINE}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M162,54 C178,34 176,16 166,14 C154,12 156,38 152,50 Z" fill="${def.accent}" stroke="${OUTLINE}" stroke-width="2.6" stroke-linejoin="round"/>`);
  }
  if (def.parts.includes('halo')) {
    out.push(`<ellipse cx="120" cy="22" rx="34" ry="9" fill="none" stroke="${def.accent}" stroke-width="4" opacity=".9"/>`);
  }
  if (def.parts.includes('antenna')) {
    out.push(`<path d="M118,50 C122,28 132,22 140,20" fill="none" stroke="${OUTLINE}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="142" cy="18" r="7.5" fill="${def.accent}" stroke="${OUTLINE}" stroke-width="2.6"/>
      <circle cx="140" cy="16" r="2.6" fill="#fff" opacity=".8"/>`);
  }
  if (def.parts.includes('snow')) {
    out.push(`<g opacity=".9" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round">
      <path d="M94,72 v-11 M89,66.5 h10 M91,69 l6,-6 M97,69 l-6,-6"/>
      <path d="M148,90 v-11 M143,84.5 h10 M145,87 l6,-6 M151,87 l-6,-6"/>
    </g>`);
  }
  return out.join('\n');
}

function frontParts(def: CharDef): string {
  const out: string[] = [];
  if (def.parts.includes('visor')) {
    out.push(`<path d="M66,98 q54,-20 108,0 l-4,13 q-50,-16 -100,0 Z" fill="${def.accent}" opacity=".55" stroke="${OUTLINE}" stroke-width="2"/>`);
  }
  if (def.parts.includes('glasses')) {
    out.push(`<circle cx="98" cy="132" r="19" fill="#cfe6ff" opacity=".2" stroke="${OUTLINE}" stroke-width="3"/>
      <circle cx="142" cy="132" r="19" fill="#cfe6ff" opacity=".2" stroke="${OUTLINE}" stroke-width="3"/>
      <path d="M116,130 h8 M79,127 L64,123 M161,127 L176,123" stroke="${OUTLINE}" stroke-width="3" stroke-linecap="round"/>`);
  }
  if (def.parts.includes('beard')) {
    out.push(`<path d="M88,150 C86,198 104,216 120,216 C136,216 154,198 152,150 C146,180 138,188 120,188 C102,188 94,180 88,150 Z" fill="url(#hair-${def.id})" stroke="${OUTLINE}" stroke-width="2.6" stroke-linejoin="round"/>`);
  }
  if (def.parts.includes('earring')) {
    out.push(`<circle cx="70" cy="154" r="4.5" fill="${def.accent}" stroke="${OUTLINE}" stroke-width="2"/>`);
  }
  if (def.parts.includes('scarf')) {
    out.push(`<path d="M86,196 q34,20 68,0 l6,16 q-40,22 -80,0 Z" fill="${def.accent}" stroke="${OUTLINE}" stroke-width="2.6" stroke-linejoin="round"/>`);
  }
  if (def.parts.includes('wolflake')) {
    out.push(`<g opacity=".85" stroke="${def.accent}" stroke-width="3" stroke-linecap="round">
      <path d="M120,214 v26 M108,220 l24,14 M132,220 l-24,14"/></g>`);
  }
  return out.join('\n');
}

function blush(def: CharDef, mood: Mood): string {
  const strong = mood === 'shy' || mood === 'happy';
  if (!strong && !def.parts.includes('cheeks')) return '';
  const o = strong ? 0.6 : 0.32;
  return `<ellipse cx="84" cy="150" rx="11" ry="6" fill="#e0728a" opacity="${o}"/>
    <ellipse cx="156" cy="150" rx="11" ry="6" fill="#e0728a" opacity="${o}"/>`;
}

/** キャラクターの立ち絵（バストアップ）を SVG 文字列で返す */
export function spriteSVG(who: CharId, mood: Mood = 'normal'): string {
  const def = CHARACTERS[who];
  const id = def.id;
  return `<svg class="sprite__svg" viewBox="0 0 240 340" role="img" aria-label="${def.name}">
  <defs>
    <linearGradient id="hair-${id}" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${def.hair}"/>
      <stop offset="1" stop-color="${def.hairDark}"/>
    </linearGradient>
    <linearGradient id="cloth-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${def.cloth}"/>
      <stop offset="1" stop-color="#100e16"/>
    </linearGradient>
    <radialGradient id="skin-${id}" cx="0.36" cy="0.3" r="0.85">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".5"/>
      <stop offset="1" stop-color="${def.skin}"/>
    </radialGradient>
  </defs>
  ${wings(def)}
  ${hairBack(def)}
  <path d="M24,344 C30,254 62,222 96,208 L144,208 C180,222 210,254 216,344 Z" fill="url(#cloth-${id})" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M96,208 C104,224 136,224 144,208 L152,214 C140,234 100,234 88,214 Z" fill="#ffffff" opacity=".12"/>
  <rect x="104" y="164" width="32" height="50" rx="13" fill="${def.skin}" stroke="${OUTLINE}" stroke-width="2.6"/>
  <ellipse cx="120" cy="120" rx="51" ry="57" fill="url(#skin-${id})" stroke="${OUTLINE}" stroke-width="3"/>
  <ellipse cx="90" cy="100" rx="20" ry="14" fill="#ffffff" opacity=".14"/>
  ${blush(def, mood)}
  ${eyes(def, mood)}
  ${brows(def, mood)}
  ${mouth(def, mood)}
  ${hairFront(def)}
  ${headTop(def)}
  ${frontParts(def)}
</svg>`;
}

export function characterName(who: CharId): string {
  return CHARACTERS[who]?.name ?? who;
}

export function characterIntro(who: CharId): string {
  const def = CHARACTERS[who];
  return `${def.name}／${def.species}`;
}

export function characterPortrait(who: CharId, mood: Mood = 'normal', className = 'portrait'): string {
  return `<div class="${className}">${spriteSVG(who, mood)}</div>`;
}