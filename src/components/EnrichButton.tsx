'use client';

import React, { useState } from 'react';
import { enrichCompanyWithAI } from '@/app/actions/companies';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function EnrichButton({ companyId, websiteUrl }: { companyId: string, websiteUrl: string }) {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();

  const handleEnrich = async () => {
    setLoading(true);
    const res = await enrichCompanyWithAI(companyId, websiteUrl);
    setLoading(false);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  return (
    <button
      onClick={handleEnrich}
      disabled={loading}
      className="btn-ghost"
      style={{
        width: '100%',
        padding: '10px',
        fontSize: '0.85rem',
        borderRadius: '8px',
        fontWeight: '600',
        border: '1px dashed var(--primary)',
        color: 'var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        cursor: 'pointer'
      }}
    >
      {loading ? (
        <>
          <span className="spinner-mini" style={{
            width: '12px',
            height: '12px',
            border: '2px solid transparent',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></span>
          {t('common.loading')}
        </>
      ) : (
        <>✨ AI 商情增益 (Enrich)</>
      )}
      <style>{`
        .spinner-mini {
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </button>
  );
}
