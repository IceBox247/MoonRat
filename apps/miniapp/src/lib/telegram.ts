// Thin wrapper around the Telegram WebApp SDK loaded in index.html.

interface TgWebApp {
  initData: string;
  initDataUnsafe: any;
  ready: () => void;
  expand: () => void;
  colorScheme: string;
  themeParams: any;
  HapticFeedback?: {
    impactOccurred: (s: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (t: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  openLink: (url: string) => void;
  openTelegramLink: (url: string) => void;
  setHeaderColor?: (c: string) => void;
  setBackgroundColor?: (c: string) => void;
  disableVerticalSwipes?: () => void;
}

export function tg(): TgWebApp | null {
  return (window as any)?.Telegram?.WebApp ?? null;
}

export function initTelegram() {
  const w = tg();
  if (!w) return;
  try {
    w.ready();
    w.expand();
    w.disableVerticalSwipes?.();
    w.setHeaderColor?.('#05070f');
    w.setBackgroundColor?.('#05070f');
  } catch {
    /* no-op outside Telegram */
  }
}

export function getInitData(): string {
  return tg()?.initData ?? '';
}

/** Dev fallback identity when running in a normal browser (not inside Telegram). */
export function getDevAuth(): string {
  const stored = localStorage.getItem('moonrat_dev_id');
  const id = stored ?? String(100000 + Math.floor(Math.random() * 900000));
  if (!stored) localStorage.setItem('moonrat_dev_id', id);
  const params = new URLSearchParams(window.location.search);
  return JSON.stringify({
    id,
    first_name: 'Explorer',
    username: 'moonminer',
    start_param: params.get('startapp') ?? params.get('start') ?? undefined,
  });
}

export function haptic(kind: 'light' | 'medium' | 'heavy' = 'light') {
  try {
    tg()?.HapticFeedback?.impactOccurred(kind);
  } catch {
    /* no-op */
  }
}

export function haptifySuccess() {
  try {
    tg()?.HapticFeedback?.notificationOccurred('success');
  } catch {
    /* no-op */
  }
}

export function openExternal(url: string) {
  const w = tg();
  if (w) w.openLink(url);
  else window.open(url, '_blank');
}

export function getStartParam(): string | undefined {
  const w = tg();
  const fromTg = w?.initDataUnsafe?.start_param;
  if (fromTg) return fromTg;
  const params = new URLSearchParams(window.location.search);
  return params.get('startapp') ?? params.get('start') ?? undefined;
}
