'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Locale } from '@/lib/i18n/translations';

function RegisterPageContent() {
  const { t, setLocale, locale } = useTranslation();
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang');

  useEffect(() => {
    if (lang && ['zh-TW', 'en', 'ja'].includes(lang)) {
      setLocale(lang as Locale);
    }
  }, [lang, setLocale]);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'REGISTRATION', lang: locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t('register.error_send_failed'));
      } else {
        alert(t('register.step2_info').replace('<strong>{email}</strong>', email));
        setStep(2);
      }
    } catch {
      setError(t('register.error_send_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t('register.error_verify_failed'));
      } else {
        setStep(3);
        setTimeout(() => router.push('/login'), 3000);
      }
    } catch {
      setError(t('register.error_verify_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'var(--bg-main)'
    }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900 }}>{t('register.title')}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{t('register.subtitle')}</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', justifyContent: 'center' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ 
              width: '40px', 
              height: '4px', 
              borderRadius: '2px',
              background: step >= i ? 'var(--primary)' : 'var(--border-color)',
              transition: 'all 0.3s'
            }} />
          ))}
        </div>

        {error && (
          <div style={{ padding: '12px', background: '#fee2e2', color: '#ef4444', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendCode} className="flex flex-col gap-md">
            <div className="flex flex-col gap-sm">
              <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('register.step1_email_label')}</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('register.step1_email_placeholder')}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
              />
            </div>
            <div className="flex flex-col gap-sm">
              <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('register.step1_password_label')}</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('register.step1_password_placeholder')}
                  style={{ width: '100%', padding: '12px', paddingRight: '45px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
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
            <button type="submit" disabled={isLoading} className="btn-primary" style={{ marginTop: '12px' }}>
              {isLoading ? t('register.step1_sending_btn') : t('register.step1_send_btn')}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerify} className="flex flex-col gap-md">
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <p style={{ fontSize: '0.9rem' }} dangerouslySetInnerHTML={{ __html: t('register.step2_info').replace('{email}', email) }}></p>
            </div>
            <div className="flex flex-col gap-sm">
              <label style={{ fontSize: '0.9rem', fontWeight: 600, textAlign: 'center' }}>{t('register.step2_code_label')}</label>
              <input 
                type="text" 
                required 
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="######"
                maxLength={6}
                style={{ 
                  padding: '16px', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border-color)', 
                  background: 'var(--bg-card)', 
                  color: 'var(--text-main)',
                  fontSize: '1.5rem',
                  textAlign: 'center',
                  letterSpacing: '8px',
                  fontWeight: 800
                }}
              />
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary" style={{ marginTop: '12px' }}>
              {isLoading ? t('register.step2_verifying_btn') : t('register.step2_verify_btn')}
            </button>
            <button type="button" onClick={() => setStep(1)} className="btn-ghost" style={{ fontSize: '0.8rem' }}>
              {t('register.step2_back_btn')}
            </button>
          </form>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>✅</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px' }}>{t('register.step3_success_title')}</h2>
            <p style={{ color: 'var(--text-muted)' }}>{t('register.step3_success_desc')}</p>
            <p style={{ fontSize: '0.8rem', marginTop: '20px' }}>{t('register.step3_redirecting')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>}>
      <RegisterPageContent />
    </Suspense>
  );
}
