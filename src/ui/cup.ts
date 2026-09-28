import { TASTE_AXES, TASTE_LABEL, type TasteAxis, type Temperature } from '../game/types';

export type LatteArt = 'none' | 'heart' | 'leaf' | 'rosetta';

export interface CupOptions {
  color: string;
  temperature: Temperature;
  art?: LatteArt;
  size?: number;
}

export function cupSVG({ color, temperature, art = 'none', size = 200 }: CupOptions): string {
  const artMarkup = (() => {
    if (temperature === 'iced' || art === 'none') return '';
    if (art === 'heart') {
      return `<path d="M100,72 C94,62 82,62 80,70 C78,78 88,84 100,92 C112,84 122,78 120,70 C118,62 106,62 100,72 Z" fill="#fdf6ea" opacity=".9"/>`;
    }
    if (art === 'leaf') {
      return `<g fill="#fdf6ea" opacity=".88">
        <path d="M100,60 C112,68 118,80 100,94 C82,80 88,68 100,60 Z"/>
        <path d="M100,62 V92" stroke="${color}" stroke-width="1.4"/>
      </g>`;
    }
    return `<g fill="#fdf6ea" opacity=".9">
      <path d="M100,58 C110,66 112,76 100,94 C88,76 90,66 100,58 Z"/>
      <path d="M92,64 q10,6 16,0 q-2,10 -8,14 q-6,-4 -8,-14 Z" opacity=".8"/>
      <path d="M88,70 q12,8 24,0" fill="none" stroke="#fdf6ea" stroke-width="2"/>
    </g>`;
  })();

  const ice = temperature === 'iced'
    ? `<g opacity=".55">
        <rect x="74" y="70" width="26" height="24" rx="4" fill="#dff1ff" stroke="#ffffff" stroke-width="2" transform="rotate(-14 87 82)"/>
        <rect x="104" y="74" width="24" height="22" rx="4" fill="#dff1ff" stroke="#ffffff" stroke-width="2" transform="rotate(11 116 85)"/>
      </g>`
    : '';

  const steam = temperature === 'hot'
    ? `<g class="cup-steam" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".45">
        <path d="M84,52 c-8,-14 8,-20 0,-34" style="--sd:4.4s"/>
        <path d="M100,48 c-8,-16 8,-22 0,-38" style="--sd:5.6s"/>
        <path d="M116,52 c-8,-14 8,-20 0,-34" style="--sd:6.4s"/>
      </g>`
    : '';

  const lid = temperature === 'iced'
    ? `<ellipse cx="100" cy="52" rx="34" ry="10" fill="#ffffff" opacity=".18"/>`
    : '';

  return `<svg class="cup" viewBox="0 0 200 150" width="${size}" aria-hidden="true">
  ${steam}
  <path d="M146,66 h10 a16,16 0 0 1 0,32 h-12" fill="none" stroke="#f6ead9" stroke-width="7" stroke-linecap="round" opacity=".9"/>
  <path d="M62,56 h76 l-9,52 a14,14 0 0 1 -13.5,11 h-31 a14,14 0 0 1 -13.5,-11 Z" fill="#f6ead9" stroke="#231a16" stroke-width="3"/>
  <path d="M70,64 h60 l-7,42 a8,8 0 0 1 -8,7 h-30 a8,8 0 0 1 -8,-7 Z" fill="${color}"/>
  <ellipse cx="100" cy="66" rx="30" ry="8" fill="${color}"/>
  <ellipse cx="100" cy="66" rx="30" ry="8" fill="#ffffff" opacity=".1"/>
  ${ice}
  ${artMarkup}
  ${lid}
  <ellipse cx="100" cy="132" rx="56" ry="12" fill="#f6ead9" opacity=".92" stroke="#231a16" stroke-width="3"/>
  <ellipse cx="100" cy="129" rx="44" ry="8" fill="#ffffff" opacity=".25"/>
</svg>`;
}

/** 6軸のレーダーチャート */
export function radarSVG(
  taste: Record<TasteAxis, number> | null,
  target?: Partial<Record<TasteAxis, number>> | null,
  opts: { size?: number; showLabels?: boolean } = {},
): string {
  const size = opts.size ?? 220;
  const cx = 110;
  const cy = 108;
  const r = 74;
  const angle = (i: number) => (Math.PI * 2 * i) / TASTE_AXES.length - Math.PI / 2;
  const point = (i: number, value: number) => {
    const a = angle(i);
    const rr = (Math.max(0, Math.min(10, value)) / 10) * r;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  };
  const grid = [0.25, 0.5, 0.75, 1]
    .map((f) => {
      const pts = TASTE_AXES.map((_, i) => point(i, f * 10).map((n) => n.toFixed(1)).join(',')).join(' ');
      return `<polygon points="${pts}" fill="none" stroke="#7d7490" stroke-width="1" opacity="${f === 1 ? 0.7 : 0.32}"/>`;
    })
    .join('');
  const spokes = TASTE_AXES.map((_, i) => {
    const [x, y] = point(i, 10);
    return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#7d7490" stroke-width="1" opacity=".32"/>`;
  }).join('');
  const targetPoly = target
    ? `<polygon points="${TASTE_AXES.map((axis, i) => point(i, target[axis] ?? 0).map((n) => n.toFixed(1)).join(',')).join(' ')}" fill="#8fd3e8" fill-opacity=".16" stroke="#8fd3e8" stroke-width="2" stroke-dasharray="5 4"/>`
    : '';
  const currentPoly = taste
    ? `<polygon points="${TASTE_AXES.map((axis, i) => point(i, taste[axis]).map((n) => n.toFixed(1)).join(',')).join(' ')}" fill="#f0c074" fill-opacity=".34" stroke="#f0c074" stroke-width="2.5"/>`
    : '';
  const labels = opts.showLabels === false
    ? ''
    : TASTE_AXES.map((axis, i) => {
        const [x, y] = point(i, 12.6);
        return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" font-size="12" fill="#cfc6dd">${TASTE_LABEL[axis]}</text>`;
      }).join('');
  return `<svg class="radar" viewBox="0 0 220 220" width="${size}" aria-hidden="true">
    ${grid}${spokes}${targetPoly}${currentPoly}${labels}
  </svg>`;
}

export function artLabel(art: LatteArt): string {
  switch (art) {
    case 'heart':
      return 'ハート';
    case 'leaf':
      return 'リーフ';
    case 'rosetta':
      return 'ロゼッタ';
    default:
      return 'なし';
  }
}