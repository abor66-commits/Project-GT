'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function LoginForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? '登入失敗');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('系統發生錯誤，請稍後再試');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-md">
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
