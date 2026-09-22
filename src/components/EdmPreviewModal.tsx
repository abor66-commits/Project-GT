'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface Props {
  edmHtml: string;
  onClose: () => void;
}

export default function EdmPreviewModal({ edmHtml, onClose }: Props) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  const iframeWidth = viewMode === 'mobile' ? 375 : 640;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'flex-start', paddingTop: '40px', paddingBottom: '40px',
        overflowY: 'auto',
      }}
    >
      {/* Modal panel */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card, #1e293b)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          width: '90%',
          maxWidth: '780px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-muted)',
        }}>
          <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>
            👁️ {t('marketing.edm.preview_title')}
          </span>

          {/* Desktop / Mobile toggle */}
          <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            {(['desktop', 'mobile'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '5px 14px', fontSize: '0.78rem', fontWeight: '600',
                  border: 'none', cursor: 'pointer',
                  background: viewMode === mode ? 'var(--primary)' : 'var(--bg-hover)',
                  color: viewMode === mode ? 'white' : 'var(--text-muted)',
                  transition: 'background 0.15s',
                  borderLeft: mode === 'mobile' ? '1px solid var(--border-color)' : 'none',
                }}
              >
                {mode === 'desktop' ? '🖥 ' + t('marketing.edm.preview_desktop') : '📱 ' + t('marketing.edm.preview_mobile')}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '1.4rem', color: 'var(--text-muted)', lineHeight: 1,
              padding: '0 4px',
            }}
            title={t('marketing.edm.preview_close')}
          >×</button>
        </div>

        {/* iframe preview area */}
        <div style={{
          padding: '24px',
          background: '#e2e8f0',
          display: 'flex',
          justifyContent: 'center',
          minHeight: '500px',
        }}>
          <div style={{
            width: iframeWidth,
            transition: 'width 0.3s ease',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            borderRadius: '8px',
            overflow: 'hidden',
            background: 'white',
          }}>
            <iframe
              srcDoc={edmHtml}
              title="EDM Preview"
              sandbox="allow-same-origin"
              style={{
                width: '100%',
                minHeight: '600px',
                border: 'none',
                display: 'block',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
