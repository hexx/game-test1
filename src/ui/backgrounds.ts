import type { BgId } from '../game/types';

/* シーンごとに安定した乱数（毎回同じ絵になるように） */
function lcg(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function rain(seed: string, count = 70, opacity = 0.5): string {
  const rnd = lcg(hash(seed));
  const lines: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const x = Math.round(rnd() * 1100 - 50);
    const y = Math.round(rnd() * 600 - 200);
    const len = Math.round(30 + rnd() * 70);
    const dur = (0.55 + rnd() * 0.5).toFixed(2);
    const delay = (rnd() * 2).toFixed(2);
    lines.push(
      `<line x1="${x}" y1="${y}" x2="${x - 11}" y2="${y + len}" stroke="#cfe0ff" stroke-width="${rnd() > 0.7 ? 2 : 1.2}" stroke-linecap="round" style="--rd:${dur}s;--rdelay:-${delay}s"/>`,
    );
  }
  return `<g class="bg-rain" opacity="${opacity}">${lines.join('')}</g>`;
}

function stars(seed: string, count = 40): string {
  const rnd = lcg(hash(seed + 's'));
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const x = Math.round(rnd() * 1000);
    const y = Math.round(rnd() * 260);
    const r = (0.7 + rnd() * 1.7).toFixed(2);
    const o = (0.25 + rnd() * 0.6).toFixed(2);
    out.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#e8eeff" opacity="${o}"/>`);
  }
  return out.join('');
}

function cityBack(seed: string, y = 250, color = '#12142440', lit = true): string {
  const rnd = lcg(hash(seed + 'c'));
  const out: string[] = [];
  let x = -40;
  while (x < 1060) {
    const w = Math.round(60 + rnd() * 90);
    const h = Math.round(90 + rnd() * 200);
    out.push(`<rect x="${x}" y="${y - h}" width="${w}" height="${h + 60}" fill="${color}"/>`);
    if (lit) {
      const cols = Math.max(1, Math.floor(w / 26));
      const rows = Math.max(1, Math.floor(h / 34));
      for (let c = 0; c < cols; c += 1) {
        for (let r = 0; r < rows; r += 1) {
          if (rnd() > 0.62) {
            out.push(
              `<rect x="${x + 10 + c * 26}" y="${y - h + 14 + r * 34}" width="9" height="12" fill="#ffd79a" opacity="${(0.25 + rnd() * 0.55).toFixed(2)}"/>`,
            );
          }
        }
      }
    }
    x += w + Math.round(6 + rnd() * 22);
  }
  return `<g>${out.join('')}</g>`;
}

function neonSign(x: number, y: number, w: number, h: number, color: string, text: string): string {
  return `<g class="bg-neon" style="--neon:${color}">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${color}" opacity=".85"/>
    <rect x="${x - 4}" y="${y - 4}" width="${w + 8}" height="${h + 8}" rx="9" fill="none" stroke="${color}" stroke-width="2" opacity=".5"/>
    <text x="${x + w / 2}" y="${y + h / 2 + 8}" text-anchor="middle" font-size="22" font-family="serif" fill="#1b1020" font-weight="700">${text}</text>
  </g>`;
}

function cafeExteriorShell(): string {
  return `
    <rect x="0" y="330" width="1000" height="270" fill="#1b1a2b"/>
    <g>
      <rect x="120" y="150" width="760" height="260" rx="16" fill="#241f2e" stroke="#3b3347" stroke-width="4"/>
      <rect x="160" y="196" width="300" height="180" rx="8" fill="#0f1626" stroke="#4a4157" stroke-width="5"/>
      <rect x="560" y="196" width="220" height="180" rx="8" fill="#131a2a" stroke="#4a4157" stroke-width="5"/>
      <path d="M200,196 L200,376 M260,196 L260,376 M440,196 L440,376" stroke="#3a3245" stroke-width="3"/>
      <path d="M620,196 L620,376 M700,196 L700,376" stroke="#3a3245" stroke-width="3"/>
      <g opacity=".85">
        <ellipse cx="250" cy="320" rx="52" ry="26" fill="#ffbe63" opacity=".18"/>
        <ellipse cx="330" cy="330" rx="46" ry="22" fill="#7ad1ff" opacity=".14"/>
      </g>
      <rect x="132" y="120" width="420" height="46" rx="10" fill="#2b2436" stroke="#4d4360" stroke-width="3"/>
      <text x="342" y="152" text-anchor="middle" font-size="26" font-family="Georgia, serif" letter-spacing="4" fill="#f2d9a8">CAFE NOCTURNAL</text>
    </g>`;
}

function rainWetGround(): string {
  return `
    <rect x="0" y="470" width="1000" height="130" fill="#141324"/>
    <g opacity=".5">
      <ellipse cx="300" cy="520" rx="120" ry="14" fill="#ffb066" opacity=".25"/>
      <ellipse cx="700" cy="548" rx="150" ry="16" fill="#66d9ff" opacity=".18"/>
    </g>
    <g stroke="#3a3a55" stroke-width="2" opacity=".6">
      <path d="M0,500 h1000 M0,540 h1000 M0,580 h1000"/>
    </g>`;
}

function shelving(): string {
  const rnd = lcg(1234);
  const out: string[] = [];
  const colors = ['#d99a2b', '#b5722c', '#7d8b3f', '#a5561d', '#3a1f14', '#5fae7a', '#a6271f', '#e5c33c'];
  for (let row = 0; row < 3; row += 1) {
    const y = 120 + row * 96;
    out.push(`<rect x="620" y="${y + 78}" width="330" height="10" fill="#4a3524" stroke="#2a1c12" stroke-width="2"/>`);
    let x = 636;
    while (x < 930) {
      const w = 16 + Math.round(rnd() * 16);
      const h = 34 + Math.round(rnd() * 40);
      const c = colors[Math.floor(rnd() * colors.length)];
      out.push(
        `<rect x="${x}" y="${y + 78 - h}" width="${w}" height="${h}" rx="4" fill="${c}" opacity=".92" stroke="#241611" stroke-width="2"/>`,
      );
      x += w + 10;
    }
  }
  return `<g>${out.join('')}</g>`;
}

function lamps(): string {
  return `
  <g>
    ${[240, 500, 760]
      .map(
        (x) => `
      <g>
        <path d="M${x},0 v70" stroke="#2c2436" stroke-width="4"/>
        <path d="M${x - 34},70 L${x + 34},70 L${x + 22},104 L${x - 22},104 Z" fill="#3a2f2a" stroke="#1e1815" stroke-width="3"/>
        <ellipse cx="${x}" cy="106" rx="20" ry="8" fill="#ffd9a0"/>
        <path d="M${x - 26},106 L${x + 26},106 L${x + 150},470 L${x - 150},470 Z" fill="#ffd9a0" opacity=".07"/>
        <ellipse cx="${x}" cy="120" rx="90" ry="46" fill="#ffd9a0" opacity=".07"/>
      </g>`,
      )
      .join('')}
  </g>`;
}

function windowView(withCity: boolean): string {
  return `
  <g>
    <rect x="70" y="80" width="460" height="330" rx="10" fill="#0b1020" stroke="#4a3f52" stroke-width="8"/>
    ${withCity ? cityBack('win', 340, '#151a30', true) : ''}
    ${stars('win')}
    <circle cx="176" cy="150" r="34" fill="#f6f0d8" opacity=".85"/>
    <circle cx="176" cy="150" r="60" fill="#f6f0d8" opacity=".08"/>
    <path d="M300,80 v330 M70,240 h460" stroke="#3b3247" stroke-width="6"/>
    ${rain('win', 40, 0.45)}
  </g>`;
}

function counter(): string {
  return `
  <g>
    <rect x="0" y="430" width="1000" height="170" fill="#3a2718"/>
    <rect x="0" y="430" width="1000" height="16" fill="#6a4a2c" opacity=".9"/>
    <g opacity=".35" stroke="#20140c" stroke-width="1.5">
      ${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 120},430 v170"/>`).join('')}
    </g>
    <rect x="0" y="596" width="1000" height="4" fill="#1a1109"/>
  </g>`;
}

function clockStopped(x: number, y: number, minuteAngle = 0): string {
  return `<g transform="translate(${x},${y})">
    <circle r="44" fill="#efe6d5" stroke="#241a12" stroke-width="6"/>
    <circle r="36" fill="none" stroke="#241a12" stroke-width="2"/>
    <path d="M0,0 V-26" stroke="#241a12" stroke-width="4" stroke-linecap="round"/>
    <path d="M0,0 L0,-34" stroke="#241a12" stroke-width="4" stroke-linecap="round" transform="rotate(${minuteAngle})"/>
    <circle r="4" fill="#a6271f"/>
  </g>`;
}

function steam(x: number, y: number): string {
  return `<g class="bg-steam" opacity=".5" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round">
    <path d="M${x},${y} c-8,-16 8,-24 0,-40" style="--sd:5s"/>
    <path d="M${x + 22},${y} c-8,-18 8,-26 0,-44" style="--sd:6.2s"/>
  </g>`;
}

function interior(warm: boolean): string {
  const wallTop = warm ? '#3b2a3f' : '#2a2336';
  const wallBottom = warm ? '#573a3a' : '#191426';
  const lightColor = warm ? '#ffb96b' : '#ffd9a0';
  return `
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${wallTop}"/>
      <stop offset="1" stop-color="${wallBottom}"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="1000" height="600" fill="url(#wall)"/>
  <rect x="0" y="380" width="1000" height="220" fill="#221a26"/>
  ${windowView(false)}
  ${shelving()}
  ${lamps()}
  ${clockStopped(880, 90)}
  ${counter()}
  <ellipse cx="500" cy="520" rx="520" ry="150" fill="${lightColor}" opacity="${warm ? 0.1 : 0.06}"/>`;
}

const BUILDERS: Record<BgId, () => string> = {
  title: () => `
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0a0e20"/>
        <stop offset="0.6" stop-color="#241a3a"/>
        <stop offset="1" stop-color="#3a2036"/>
      </linearGradient>
    </defs>
    <rect width="1000" height="600" fill="url(#sky)"/>
    ${stars('title', 70)}
    <circle cx="760" cy="140" r="70" fill="#f7f0da" opacity=".9"/>
    <circle cx="760" cy="140" r="140" fill="#f7f0da" opacity=".07"/>
    ${cityBack('title', 400, '#14183080', true)}
    ${neonSign(120, 250, 150, 44, '#ff7a9c', 'BAR')}
    ${neonSign(300, 200, 130, 40, '#7ad1ff', '24H')}
    ${rainWetGround()}
    ${cafeExteriorShell()}
    ${rain('title', 90, 0.55)}`,
  'street-rain': () => `
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#080b18"/>
        <stop offset="0.6" stop-color="#1b1730"/>
        <stop offset="1" stop-color="#2b1c30"/>
      </linearGradient>
    </defs>
    <rect width="1000" height="600" fill="url(#sky)"/>
    ${stars('street', 40)}
    <circle cx="210" cy="110" r="42" fill="#e8e6f2" opacity=".55"/>
    ${cityBack('street', 420, '#14183080', true)}
    ${neonSign(90, 280, 140, 42, '#ff7a9c', 'OPEN')}
    ${neonSign(600, 240, 120, 38, '#8effc1', 'CAFE')}
    ${rainWetGround()}
    ${cafeExteriorShell()}
    ${rain('street', 90, 0.5)}`,
  'cafe-night': () => `${interior(false)}${rain('cafenight', 30, 0.25)}${steam(470, 500)}`,
  'cafe-counter': () => `
    ${interior(false)}
    <g transform="translate(0,40)">
      <rect x="300" y="418" width="400" height="180" fill="#2a1c12"/>
      ${steam(470, 470)}
      <g transform="translate(470,470)">
        <ellipse cx="0" cy="0" rx="46" ry="12" fill="#f6ead9" stroke="#2a1c12" stroke-width="3"/>
        <path d="M-46,0 a46,46 0 0 0 92,0 Z" fill="#f6ead9" stroke="#2a1c12" stroke-width="3"/>
        <ellipse cx="0" cy="0" rx="34" ry="8" fill="#5a3520"/>
      </g>
    </g>
    ${rain('cafecounter', 24, 0.2)}`,
  'cafe-window': () => `
    ${interior(false)}
    <g transform="translate(240,40) scale(1.12)">
      ${windowView(true)}
    </g>
    ${rain('cafewindow', 50, 0.4)}`,
  'cafe-dawn': () => {
    const base = interior(true);
    return `
    ${base}
    <g opacity=".55">
      <rect x="0" y="0" width="1000" height="600" fill="#ff9a52" opacity=".16"/>
      <path d="M0,600 L1000,380 L1000,600 Z" fill="#ffb066" opacity=".08"/>
    </g>
    ${rain('cafedawn', 16, 0.15)}`;
  },
  kitchen: () => `
    <rect width="1000" height="600" fill="#1d1a24"/>
    <rect x="0" y="300" width="1000" height="60" fill="#2b2531"/>
    <g transform="translate(120,150)">
      <rect x="0" y="60" width="300" height="200" rx="10" fill="#484455" stroke="#221f2b" stroke-width="4"/>
      <rect x="30" y="100" width="60" height="70" rx="6" fill="#8b8b9c"/>
      <rect x="120" y="90" width="70" height="40" rx="4" fill="#22202a"/>
      <circle cx="248" cy="120" r="22" fill="#8b8b9c"/>
      <path d="M228,190 h44 v40 h-44 Z" fill="#332f3d"/>
    </g>
    <g transform="translate(560,180)">
      <rect x="0" y="0" width="180" height="280" rx="14" fill="#3d3948" stroke="#221f2b" stroke-width="4"/>
      <ellipse cx="90" cy="40" rx="60" ry="24" fill="#6ec7c1" opacity=".7"/>
      <rect x="30" y="120" width="120" height="120" rx="8" fill="#26232e"/>
    </g>
    ${steam(700, 200)}
    ${lamps()}`,
  memory: () => `
    <defs>
      <radialGradient id="mem" cx="0.5" cy="0.45" r="0.75">
        <stop offset="0" stop-color="#6b4a2c"/>
        <stop offset="1" stop-color="#20140f"/>
      </radialGradient>
    </defs>
    <rect width="1000" height="600" fill="url(#mem)"/>
    <ellipse cx="500" cy="320" rx="360" ry="160" fill="#ffd9a0" opacity=".1"/>
    <g opacity=".22" fill="#f3d9ad">
      <ellipse cx="330" cy="360" rx="120" ry="40"/>
      <ellipse cx="670" cy="380" rx="150" ry="46"/>
      <rect x="300" y="120" width="400" height="220" rx="20"/>
    </g>
    ${rain('memory', 26, 0.18)}`,
  black: () => `<rect width="1000" height="600" fill="#07060c"/>`,
};

export function backgroundSVG(id: BgId): string {
  const build = BUILDERS[id] ?? BUILDERS.black;
  return `<svg class="bg__svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${build()}</svg>`;
}