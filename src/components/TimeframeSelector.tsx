'use client';

import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function TimeframeSelector() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const current = searchParams.get('timeframe') || 'all';

  const options = [
    { key: 'monthly', label: t('reports.monthly_report') },
    { key: 'quarterly', label: t('reports.quarterly_report') },
    { key: 'yearly', label: t('reports.yearly_report') },
    { key: 'all', label: t('reports.all_data') }
  ];

  const handleTimeframeChange = (key: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('timeframe', key);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex gap-sm" style={{ 
      background: '#f1f5f9', 
      padding: '4px', 
      borderRadius: '10px',
      marginBottom: '32px',
      width: 'fit-content'
    }}>
      {options.map(opt => (
        <button
          key={opt.key}
          onClick={() => handleTimeframeChange(opt.key)}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            background: current === opt.key ? '#fff' : 'transparent',
            color: current === opt.key ? 'var(--primary)' : 'var(--text-muted)',
            boxShadow: current === opt.key ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
            transition: 'var(--transition)'
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
