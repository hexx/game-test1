import { qs } from './dom';

let toastTimer: number | null = null;

export interface OverlayOptions {
  dismissible?: boolean;
  className?: string;
  onDismiss?: () => void;
}

export function openOverlay(node: HTMLElement, opts: OverlayOptions = {}): void {
  const root = qs('#overlay');
  const panel = qs('#overlay-panel');
  root.hidden = false;
  panel.className = `overlay__panel ${opts.className ?? ''}`.trim();
  panel.replaceChildren(node);
  root.classList.add('is-open');
  root.dataset.dismissible = opts.dismissible ? '1' : '0';
  (root as HTMLElement & { __onDismiss?: () => void }).__onDismiss = opts.onDismiss;
}

export function closeOverlay(force = false): void {
  const root = qs('#overlay');
  if (root.hidden) return;
  // 閉じられないパネル（注文・結果・エンディング）は force でのみ閉じる
  if (!force && root.dataset.dismissible !== '1') return;
  const onDismiss = (root as HTMLElement & { __onDismiss?: () => void }).__onDismiss;
  root.classList.remove('is-open');
  root.hidden = true;
  qs('#overlay-panel').replaceChildren();
  (root as HTMLElement & { __onDismiss?: () => void }).__onDismiss = undefined;
  onDismiss?.();
}

export function isOverlayOpen(): boolean {
  return !qs('#overlay').hidden;
}

export function setupOverlay(): void {
  const root = qs('#overlay');
  qs('#overlay-backdrop').addEventListener('click', () => {
    if (root.dataset.dismissible === '1') closeOverlay();
  });
}

export function toast(message: string, ms = 2400): void {
  const node = qs('#toast');
  node.textContent = message;
  node.hidden = false;
  node.classList.add('is-open');
  if (toastTimer !== null) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    node.classList.remove('is-open');
    window.setTimeout(() => {
      node.hidden = true;
    }, 300);
  }, ms);
}