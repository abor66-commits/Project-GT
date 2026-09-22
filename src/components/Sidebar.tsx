'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { TranslationKey } from '@/lib/i18n/translations';

interface User {
  name: string;
  role: string;
}

export default function Sidebar({ user, logoUrl }: { user: User, logoUrl: string }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const isManager = user.role === 'MANAGER';
  const isAdmin = user.role === 'ADMIN';
  const hasManagementAccess = isManager || isAdmin;

  const navItems: { href: string; labelKey: TranslationKey; subItems?: { href: string; labelKey: TranslationKey }[] }[] = [
    { href: '/', labelKey: 'nav.dashboard' },
    { href: '/companies', labelKey: 'nav.companies' },
    { href: '/opportunities', labelKey: 'nav.opportunities' },
    { href: '/reports', labelKey: 'nav.reports' },
    { 
      href: '/marketing', 
      labelKey: 'nav.marketing',
      subItems: [
        { href: '/marketing/broadcaster', labelKey: 'nav.marketing.broadcaster' as any },
        { href: '/marketing/automation', labelKey: 'nav.marketing.automation' as any },
        { href: '/marketing/integration', labelKey: 'nav.marketing.integration' as any },
        { href: '/marketing/history', labelKey: 'nav.marketing.history' as any },
      ]
    },
  ];

  const managementItems: { href: string; labelKey: TranslationKey }[] = [
    { href: '/users', labelKey: 'nav.users' },
    { href: '/tags', labelKey: 'nav.settings.tags' as any },
  ];

  const systemItems: { href: string; labelKey: TranslationKey }[] = [
    { href: '/settings/general', labelKey: 'nav.settings.general' },
    { href: '/settings/smtp', labelKey: 'nav.settings.smtp' },
    { href: '/settings/sso', labelKey: 'nav.settings.sso' },
    { href: '/settings/logs', labelKey: 'nav.settings.logs' },
  ];

  const getRoleLabel = () => {
    if (isAdmin) return t('role.admin');
    if (isManager) return t('role.manager');
    if (user.role === 'MARKETING') return t('role.marketing');
    if (user.role === 'ASSISTANT') return t('role.assistant');
    return t('role.sales');
  };

  return (
    <aside className="sidebar">
      <div style={{ padding: '0 24px', marginBottom: '40px' }}>
        <Logo src={logoUrl} />
      </div>
      
      <nav style={{ flex: 1 }}>
        {navItems.map(item => (
          <React.Fragment key={item.href}>
            <Link 
              href={item.href} 
              className={`nav-item ${pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)) ? 'active' : ''}`}
            >
              {t(item.labelKey)}
            </Link>
            
            {/* Render sub-items if active or parent is active */}
            {item.subItems && (pathname.startsWith(item.href)) && (
              <div style={{ marginLeft: '16px', borderLeft: '1px solid var(--border-color)', marginBottom: '8px' }}>
                {item.subItems.map(sub => (
                  <Link 
                    key={sub.href}
                    href={sub.href}
                    className={`nav-item ${pathname === sub.href ? 'active' : ''}`}
                    style={{ padding: '8px 24px', fontSize: '0.85rem', border: 'none' }}
                  >
                    {t(sub.labelKey as any)}
                  </Link>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
        
        {hasManagementAccess && managementItems.map(item => (
          <Link 
            key={item.href} 
            href={item.href} 
            className={`nav-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
          >
            {t(item.labelKey)}
          </Link>
        ))}
      </nav>

      <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: isAdmin ? '#fef3c7' : isManager ? '#fef2f2' : '#eff6ff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '0.75rem', 
              fontWeight: '700', 
              color: isAdmin ? '#d97706' : isManager ? '#ef4444' : '#2563eb',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ lineHeight: '1.2' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main-custom, var(--text-main))' }}>{user.name}</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted-custom, var(--text-muted))' }}>
                {getRoleLabel()}
              </p>
            </div>
        </div>
        
        {isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <p style={{ color: 'var(--text-muted-custom, var(--text-muted))', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.6rem', fontWeight: '700', paddingLeft: '12px' }}>
              {t('nav.system_admin')}
            </p>
            
            {systemItems.map(item => (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`nav-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
                style={{ 
                  padding: '8px 24px', 
                  fontSize: '0.8rem',
                  borderLeftWidth: '4px'
                }}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
