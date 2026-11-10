interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
  };
  ready: () => void;
  close: () => void;
  expand: () => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export const getTelegramUser = (): TelegramUser | null => {
  if (typeof window === 'undefined') return null;

  const tg = window.Telegram?.WebApp;
  if (!tg) return null;

  tg.ready();
  return tg.initDataUnsafe.user || null;
};

export const getTelegramUserId = (): number | null => {
  // The id comes from Telegram. Outside Telegram there is no signed initData,
  // so the API would refuse the request anyway (no ?uid= override any more).
  return getTelegramUser()?.id ?? null;
};

export const initTelegramApp = () => {
  if (typeof window === 'undefined') return;

  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }
};
