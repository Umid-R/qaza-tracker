import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { translations, Language, TranslationKey } from './translations';
import { api } from '../services/api';
import { getTelegramUserId } from '../utils/telegram';

interface LanguageContextValue {
  language: Language;
  t: (key: TranslationKey) => string;
  translatePrayerName: (name: string) => string;
  translateReason: (reason: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  t: (key) => translations.en[key],
  translatePrayerName: (name) => name,
  translateReason: (reason) => reason,
});

const PRAYER_KEY_MAP: Record<string, TranslationKey> = {
  fajr: 'prayerFajr',
  dhuhr: 'prayerDhuhr',
  asr: 'prayerAsr',
  maghrib: 'prayerMaghrib',
  isha: 'prayerIsha',
};

const REASON_KEY_MAP: Record<string, TranslationKey> = {
  'sleep': 'reasonSleep',
  'work/study': 'reasonWorkStudy',
  'travel': 'reasonTravel',
  'health': 'reasonHealth',
  'forgot': 'reasonForgot',
  'others': 'reasonOthers',
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const userId = getTelegramUserId();
    if (!userId) return;

    api.getUserInfo(userId)
      .then(info => {
        const lang = info.language;
        if (lang === 'en' || lang === 'uz' || lang === 'ru') {
          setLanguage(lang);
        }
      })
      .catch(err => console.error('Failed to fetch user language', err));
  }, []);

  const t = (key: TranslationKey): string => translations[language][key];

  const translatePrayerName = (name: string): string => {
    const key = PRAYER_KEY_MAP[name.toLowerCase()];
    return key ? translations[language][key] : name;
  };

  const translateReason = (reason: string): string => {
    if (reason.toLowerCase() === 'unknown') return translations[language].reasonUnknown;
    const key = REASON_KEY_MAP[reason.toLowerCase()];
    return key ? translations[language][key] : reason;
  };

  return (
    <LanguageContext.Provider value={{ language, t, translatePrayerName, translateReason }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
