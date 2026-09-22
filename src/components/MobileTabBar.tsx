'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { TranslationKey } from '@/lib/i18n/translations';

interface User {
  name: string;
  role: string;
}

export default function MobileTabBar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [showMore, setShowMore] = useState(false);
  const isManager = user.role === 'MANAGER' || user.role === 'ADMIN';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const tabs: { href: string; labelKey: TranslationKey; icon: React.ReactNode }[] = [
    { 
      href: '/', labelKey: 'nav.dashboard', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg> 
    },
    { 
      href: '/marketing', labelKey: 'nav.marketing', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg> 
    },
    { 
      href: '/companies', labelKey: 'nav.companies', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg> 
    },
    { 
      href: '/opportunities', labelKey: 'nav.opportunities', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> 
    },
  ];

  return (
    <>
      <nav className="mobile-tab-bar">
        {tabs.map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`mobile-tab-item ${pathname === tab.href ? 'active' : ''}`}
          >
            <span className="mobile-tab-icon">{tab.icon}</span>
            <span>{t(tab.labelKey)}</span>
          </Link>
        ))}

        {/* More button */}
        <button
          className={`mobile-tab-item ${showMore || pathname === '/profile' || pathname === '/users' || pathname.startsWith('/settings') ? 'active' : ''}`}
          onClick={() => setShowMore(!showMore)}
        >
          <span className="mobile-tab-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </span>
          <span>{t('nav.more')}</span>
        </button>
      </nav>

      {/* More Bottom Sheet */}
      {showMore && (
        <div className="bottom-sheet-overlay" onClick={() => setShowMore(false)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="bottom-sheet-handle" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link
                href="/profile"
                onClick={() => setShowMore(false)}
                style={{ padding: '14px 16px', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem', fontWeight: '500' }}
                className="dropdown-item-hover"
              >
                {t('nav.profile')}
              </Link>
              <Link
                href="/reports"
                onClick={() => setShowMore(false)}
                style={{ padding: '14px 16px', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem', fontWeight: '500' }}
                className="dropdown-item-hover"
              >
                {t('nav.reports')}
              </Link>

              {isManager && (
                <>
                  <Link
                    href="/users"
                    onClick={() => setShowMore(false)}
                    style={{ padding: '14px 16px', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem', fontWeight: '500' }}
                    className="dropdown-item-hover"
                  >
                    {t('nav.users')}
                  </Link>
                  <Link
                    href="/tags"
                    onClick={() => setShowMore(false)}
                    style={{ padding: '14px 16px', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem', fontWeight: '500' }}
                    className="dropdown-item-hover"
                  >
                    {t('nav.settings.tags' as any)}
                  </Link>
                </>
              )}

              {user.role === 'ADMIN' && (
                <>
                  <div style={{ padding: '8px 16px 4px', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                    {t('nav.system_admin')}
                  </div>
                  <Link
                    href="/settings/general"
                    onClick={() => setShowMore(false)}
                    style={{ padding: '10px 16px', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem' }}
                    className="dropdown-item-hover"
                  >
                    {t('nav.settings.general')}
                  </Link>
                  <Link
                    href="/settings/smtp"
                    onClick={() => setShowMore(false)}
                    style={{ padding: '10px 16px', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem' }}
                    className="dropdown-item-hover"
                  >
                    {t('nav.settings.smtp')}
                  </Link>
                  <Link
                    href="/settings/sso"
                    onClick={() => setShowMore(false)}
                    style={{ padding: '10px 16px', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem' }}
                    className="dropdown-item-hover"
                  >
                    {t('nav.settings.sso')}
                  </Link>
                  <Link
                    href="/settings/logs"
                    onClick={() => setShowMore(false)}
                    style={{ padding: '10px 16px', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem' }}
                    className="dropdown-item-hover"
                  >
                    {t('nav.settings.logs')}
                  </Link>
                </>
              )}

              <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }} />

              <button
                type="button"
                onClick={handleLogout}
                style={{ padding: '14px 16px', borderRadius: '12px', color: '#ef4444', background: 'transparent', border: 'none', width: '100%', textAlign: 'left', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                className="dropdown-item-hover-danger"
              >
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
