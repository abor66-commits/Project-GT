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

interface LanguageProviderProps {
  children: React.ReactNode;
  initialLocale?: Locale;
}

export function LanguageProvider({ children, initialLocale = 'zh-TW' }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  // On first load, sync client-side preferences after hydration without causing mismatch
  useEffect(() => {
    // 1. Check saved cookie preference first
    const saved = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] as Locale;
    
    if (saved && SUPPORTED_LOCALES.includes(saved)) {
      if (saved !== locale) {
        setLocaleState(saved);
      }
    } else {
      // 2. No cookie → detect from browser/system language
      const lang = navigator.language.toLowerCase();
      let detected: Locale = initialLocale;
      if (lang.startsWith('zh')) detected = 'zh-TW';
      else if (lang.startsWith('ja')) detected = 'ja';
      else if (lang.startsWith('en')) detected = 'en';

      if (detected !== locale) {
        setLocaleState(detected);
      }
      document.cookie = `NEXT_LOCALE=${detected}; path=/; max-age=${60 * 60 * 24 * 365}`;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    // Save to cookie for 1 year
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
    // Refresh server components to pick up new cookie
    router.refresh();
  };

  const t = (key: TranslationKey): string => {
    const dict = (translations as any)[locale];
    return dict?.[key] || (translations as any)['zh-TW']?.[key] || key;
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
