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
  const user = getTelegramUser();
  if (user?.id) return user.id;

  // Dev/testing convenience: allow overriding via ?uid=123 in the URL
  // when not running inside Telegram (e.g. testing a preview deploy
  // directly in a browser). Has no effect inside the real Telegram app.
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const uidParam = params.get('uid');
    if (uidParam) {
      const parsed = Number(uidParam);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }

  return null;
};

export const initTelegramApp = () => {
  if (typeof window === 'undefined') return;

  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }
};
