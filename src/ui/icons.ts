/** 材料アイコン（外部アセットなしでSVG生成） */
export function ingredientIcon(kind: string, color: string): string {
  const svg = (inner: string) =>
    `<svg viewBox="0 0 32 32" class="icon" aria-hidden="true">${inner}</svg>`;
  switch (kind) {
    case 'bean':
      return svg(`<ellipse cx="16" cy="16" rx="9" ry="12" fill="${color}" transform="rotate(-18 16 16)"/>
        <path d="M16,5 C11,11 21,20 16,27" fill="none" stroke="#f6e6cf" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>`);
    case 'leaf':
      return svg(`<path d="M6,26 C6,12 16,5 27,5 C27,18 19,27 6,26 Z" fill="${color}"/>
        <path d="M8,25 C13,19 18,13 25,8" fill="none" stroke="#f6e6cf" stroke-width="2" stroke-linecap="round" opacity=".85"/>`);
    case 'cocoa':
      return svg(`<rect x="5" y="5" width="22" height="22" rx="6" fill="${color}"/>
        <rect x="10" y="10" width="5" height="5" rx="1.4" fill="#f6e6cf" opacity=".8"/>
        <rect x="18" y="10" width="5" height="5" rx="1.4" fill="#f6e6cf" opacity=".65"/>
        <rect x="10" y="18" width="5" height="5" rx="1.4" fill="#f6e6cf" opacity=".65"/>
        <rect x="18" y="18" width="5" height="5" rx="1.4" fill="#f6e6cf" opacity=".8"/>`);
    case 'drop':
      return svg(`<path d="M16,4 C22,13 26,17 26,21 a10,10 0 0 1 -20,0 C6,17 10,13 16,4 Z" fill="${color}"/>
        <ellipse cx="12" cy="20" rx="3" ry="4" fill="#ffffff" opacity=".35"/>`);
    case 'stick':
      return svg(`<rect x="6" y="12" width="20" height="8" rx="4" fill="${color}"/>
        <rect x="4" y="10" width="24" height="12" rx="6" fill="none" stroke="#2b1c12" stroke-width="1.6" opacity=".4"/>
        <path d="M10,16 h12" stroke="#2b1c12" stroke-width="1.4" opacity=".35"/>`);
    case 'root':
      return svg(`<path d="M9,10 C14,4 24,7 24,14 C24,22 18,28 13,26 C8,24 5,16 9,10 Z" fill="${color}"/>
        <path d="M13,8 C15,4 20,4 22,7" fill="none" stroke="#f6e6cf" stroke-width="2" stroke-linecap="round" opacity=".7"/>`);
    case 'citrus':
      return svg(`<circle cx="16" cy="16" r="11" fill="${color}"/>
        <circle cx="16" cy="16" r="8" fill="#f6e6cf" opacity=".85"/>
        <path d="M16,8 v16 M8,16 h16 M10.5,10.5 l11,11 M21.5,10.5 l-11,11" stroke="${color}" stroke-width="1.4" opacity=".7"/>`);
    case 'nut':
      return svg(`<path d="M16,4 C23,8 26,15 24,21 C22,27 18,29 16,29 C14,29 10,27 8,21 C6,15 9,8 16,4 Z" fill="${color}"/>
        <path d="M16,6 C13,12 13,22 16,27" fill="none" stroke="#f6e6cf" stroke-width="1.8" opacity=".7"/>`);
    case 'chili':
      return svg(`<path d="M20,6 C26,8 27,16 24,22 C21,28 14,29 10,26 C15,24 19,18 20,6 Z" fill="${color}"/>
        <path d="M19,7 C20,4 23,3 25,3" fill="none" stroke="#5fae7a" stroke-width="2.4" stroke-linecap="round"/>`);
    default:
      return svg(`<circle cx="16" cy="16" r="10" fill="${color}"/>`);
  }
}