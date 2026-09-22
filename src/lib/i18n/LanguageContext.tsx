'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { translations, Locale, TranslationKey } from './translations';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const SUPPORTED_LOCALES: Locale[] = ['zh-TW', 'en', 'ja'];

function detectInitialLocale(): Locale {
  if (typeof document === 'undefined') return 'zh-TW'; // SSR fallback

  // 1. Check saved cookie preference first
  const saved = document.cookie
    .split('; ')
    .find(row => row.startsWith('NEXT_LOCALE='))
    ?.split('=')[1] as Locale;
  if (saved && SUPPORTED_LOCALES.includes(saved)) return saved;

  // 2. No cookie → detect from browser/system language
  const lang = navigator.language; // e.g. "zh-TW", "zh-HK", "en-US", "ja-JP"
  if (lang.startsWith('zh')) return 'zh-TW';
  if (lang.startsWith('ja')) return 'ja';
  if (lang.startsWith('en')) return 'en';

  // 3. Default
  return 'zh-TW';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectInitialLocale());
  const router = useRouter();

  // On first load without a saved cookie, persist the detected locale so it survives
  useEffect(() => {
    const hasCookie = document.cookie.includes('NEXT_LOCALE=');
    if (!hasCookie) {
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    // Save to cookie for 1 year
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
    // Refresh server components to pick up new cookie
    router.refresh();
  };

  const t = (key: TranslationKey): string => {
    const dict = (translations as any)[locale];
    return dict?.[key] || (translations as any)['zh-TW'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
