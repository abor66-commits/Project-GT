'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [state, setState] = useState<{ success?: boolean; error?: string }>({});
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setState({});
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const code = formData.get('code') as string;
    const newPassword = formData.get('newPassword') as string;
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ error: data.error ?? t('reset_password.error_failed') });
      } else {
        setState({ success: true });
      }
    } catch {
      setState({ error: t('reset_password.error_failed') });
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '8px', color: 'var(--text-main)' }}>{t('reset_password.title')}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{t('reset_password.subtitle')}</p>
        </div>

        {state?.success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              padding: '20px', 
              background: '#ecfdf5', 
              color: '#047857', 
              borderRadius: '12px', 
              marginBottom: '24px',
              border: '1px solid #d1fae5'
            }}>
              {t('reset_password.success_msg')}
            </div>
            <Link href="/login" className="btn-primary" style={{ display: 'block', textDecoration: 'none' }}>
              {t('reset_password.login_btn')}
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
              <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>{t('reset_password.email_label')}</label>
              <input 
                name="email"
                type="email" 
                placeholder="your@email.com" 
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }} 
                required 
              />
            </div>

            <div className="flex flex-col gap-sm">
              <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>{t('reset_password.code_label')}</label>
              <input 
                name="code"
                type="text" 
                placeholder={t('reset_password.code_placeholder')} 
                maxLength={6}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.2em' }} 
                required 
              />
            </div>

            <div className="flex flex-col gap-sm">
              <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>{t('reset_password.new_password_label')}</label>
              <div style={{ position: 'relative' }}>
                <input 
                  name="newPassword"
                  type={showPassword ? "text" : "password"} 
                  placeholder={t('reset_password.new_password_placeholder')} 
                  style={{ width: '100%', padding: '12px', paddingRight: '45px', borderRadius: '8px', border: '1px solid var(--border-color)' }} 
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: '1.2rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px'
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ marginTop: '16px', padding: '14px' }}
              disabled={isPending}
            >
              {isPending ? t('reset_password.pending_btn') : t('reset_password.submit_btn')}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Link href="/forgot-password" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                {t('reset_password.back_btn')}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
