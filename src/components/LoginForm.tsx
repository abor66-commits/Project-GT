'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function LoginForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');

  // Handle URL recovery if browser previously performed a native GET submit
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const emailParam = url.searchParams.get('email');
      const passParam = url.searchParams.get('password');
      if (emailParam) setEmailValue(emailParam);
      if (passParam) setPasswordValue(passParam);
      if (emailParam || passParam) {
        window.history.replaceState({}, '', window.location.pathname);
        if (emailParam && passParam) {
          setIsPending(true);
          fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailParam, password: passParam }),
          })
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
              if (ok) {
                window.location.href = '/';
              } else {
                setError(data?.error ?? '登入失敗');
                setIsPending(false);
              }
            })
            .catch(() => {
              setError('系統發生錯誤，請稍後再試');
              setIsPending(false);
            });
        }
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string) || emailValue;
    const password = (formData.get('password') as string) || passwordValue;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? '登入失敗');
        setIsPending(false);
      } else {
        window.location.href = '/';
      }
    } catch {
      setError('系統發生錯誤，請稍後再試');
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} method="POST" action="#" className="flex flex-col gap-md">
      {error && (
        <div style={{ 
          padding: '12px', 
          background: '#fee2e2', 
          color: '#b91c1c', 
          borderRadius: '8px', 
          fontSize: '0.85rem',
          textAlign: 'center',
          fontWeight: '600',
          border: '1px solid #fecaca'
        }}>
          {error}
        </div>
      )}

      <div className="flex flex-col gap-sm">
        <label htmlFor="email" style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)' }}>{t('login.email')}</label>
        <input 
          id="email"
          name="email"
          type="email" 
          value={emailValue}
          onChange={(e) => setEmailValue(e.target.value)}
          autoComplete="username"
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} 
          required 
        />
      </div>
      
      <div className="flex flex-col gap-sm">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label htmlFor="password" style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)' }}>{t('login.password')}</label>
          <Link href="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none' }}>{t('login.forgot_password')}</Link>
        </div>
        <div style={{ position: 'relative' }}>
          <input 
            id="password"
            name="password"
            type={showPassword ? "text" : "password"} 
            value={passwordValue}
            onChange={(e) => setPasswordValue(e.target.value)}
            autoComplete="current-password"
            style={{ width: '100%', padding: '12px', paddingRight: '45px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} 
            required 
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
      </div>
      
      <button 
        type="submit" 
        className="btn-primary" 
        style={{ marginTop: '16px', padding: '12px', fontSize: '1rem', fontWeight: '600' }}
        disabled={isPending}
      >
        {isPending ? t('login.pending') : t('login.submit')}
      </button>
      
      <div style={{ textAlign: 'center', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {t('login.invite_text')} <Link href="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>{t('login.finish_setup')}</Link>
        </p>
      </div>
    </form>
  );
}
