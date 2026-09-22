'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';



export default function AboutModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setScreenshots(prev => [...prev, event.target!.result as string]);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback, screenshots }),
      }).then(r => r.json());

      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.error || t('common.error'));
      }
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        width: '100%',
        maxWidth: '500px',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        border: '1px solid var(--border-color)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-main)' }}>{t('about.title')}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ lineHeight: '1.6', color: 'var(--text-muted)', fontSize: '1rem' }}>
            {t('about.desc')}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>{t('about.version_prefix')} v1.2.4 (Latest)</p>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '12px', color: 'var(--text-main)' }}>{t('about.feedback_title')}</h3>
          
          {showSuccess ? (
            <div style={{ 
              background: '#ecfdf5', 
              color: '#059669', 
              padding: '16px', 
              borderRadius: '12px', 
              textAlign: 'center',
              fontWeight: '700'
            }}>
              {t('about.feedback_success')}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-md">
              {error && (
                <div style={{ padding: '12px', background: '#fef2f2', color: '#b91c1c', borderRadius: '12px', fontSize: '0.85rem', textAlign: 'center' }}>
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-sm">
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>{t('about.feedback_label')}</label>
                <textarea
                  required
                  placeholder={t('about.feedback_placeholder')}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  onPaste={handlePaste}
                  style={{
                    width: '100%',
                    height: '120px',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    resize: 'none',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {screenshots.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {screenshots.map((src, i) => (
                    <div key={i} style={{ position: 'relative', width: '80px', height: '80px' }}>
                      <img 
                        src={src} 
                        alt="Screenshot" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} 
                      />
                      <button 
                        type="button"
                        onClick={() => removeScreenshot(i)}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: 'var(--danger)',
                          color: 'white',
                          border: 'none',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting || !feedback.trim()}
                className="btn-primary" 
                style={{ marginTop: '12px', width: '100%' }}
              >
                {isSubmitting ? t('about.submit_sending') : t('about.submit_btn')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
