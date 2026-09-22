'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Locale } from '@/lib/i18n/translations';

export default function LanguageSelector() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div 
      className="hover-bg"
      style={{ 
        position: 'relative', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        width: '36px', 
        height: '36px', 
        borderRadius: '8px', 
        color: 'var(--text-main)' 
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        <path d="M2 12h20"></path>
      </svg>
      <select 
        value={locale} 
        onChange={(e) => setLocale(e.target.value as Locale)}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'pointer',
          appearance: 'none'
        }}
        title={t('common.language')}
      >
        <option value="zh-TW">繁體中文</option>
        <option value="en">English</option>
        <option value="ja">日本語</option>
      </select>
    </div>
  );
}
