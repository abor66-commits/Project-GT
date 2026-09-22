'use client';

import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function OfflinePage() {
  const { t } = useTranslation();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '32px',
      textAlign: 'center',
      background: 'var(--bg-main)',
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '24px' }}>📡</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>
        {t('offline.title' as any)}
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '300px', lineHeight: '1.6' }}>
        {t('offline.desc' as any)}
      </p>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        {t('offline.cached_hint' as any)}
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: '24px',
          padding: '12px 24px',
          background: 'var(--primary)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '0.9rem',
          fontWeight: '600',
          cursor: 'pointer',
        }}
      >
        {t('offline.retry_btn' as any)}
      </button>
    </div>
  );
}
