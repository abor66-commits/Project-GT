import { translations, Locale, TranslationKey } from './translations';
import { cookies } from 'next/headers';

export async function getLocaleServer(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value as Locale;
  return (locale && translations[locale]) ? locale : 'zh-TW';
}

export async function getTranslationServer() {
  const locale = await getLocaleServer();
  
  return {
    t: (key: TranslationKey) => {
      const dict = (translations as Record<string, any>)[locale];
      return dict?.[key] || (translations as any)['zh-TW'][key] || key;
    },
    locale
  };
}
