'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function ForgotPasswordPage() {
  const { t, locale } = useTranslation();
  const [state, setState] = useState<{ success?: boolean; message?: string; error?: string }>({});
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setState({});
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, lang: locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ error: data.error ?? t('forgot_password.error_failed') });
      } else {
        setState({ success: true, message: t('forgot_password.success_msg') });
      }
    } catch {
      setState({ error: t('forgot_password.error_failed') });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: '#f8fafc'
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '8px', color: 'var(--text-main)' }}>{t('forgot_password.title')}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{t('forgot_password.subtitle')}</p>
        </div>

        {state?.success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              padding: '20px', 
              background: '#ecfdf5', 
              color: '#047857', 
              borderRadius: '12px', 
              marginBottom: '24px',
              border: '1px solid #d1fae5',
              fontSize: '0.95rem'
            }}>
              {state.message}
            </div>
            <Link href="/reset-password" style={{ 
              display: 'block',
              width: '100%',
              padding: '14px',
              background: 'var(--primary)',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600'
            }}>
              {t('forgot_password.success_go_reset')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            {state?.error && (
              <div style={{ padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center' }}>
                {state.error}
              </div>
            )}

            <div className="flex flex-col gap-sm">
              <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>{t('forgot_password.email_label')}</label>
              <input 
                name="email"
                type="email" 
                placeholder="your@email.com" 
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }} 
                required 
              />
            </div>
            
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ marginTop: '8px', padding: '14px' }}
              disabled={isPending}
            >
              {isPending ? t('forgot_password.pending_btn') : t('forgot_password.submit_btn')}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Link href="/login" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                {t('forgot_password.back_to_login')}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
