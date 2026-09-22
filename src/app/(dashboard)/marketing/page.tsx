import React from 'react';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { getTranslationServer } from '@/lib/i18n/server';

export default async function MarketingPage() {
  const { t } = await getTranslationServer();
  const [tagCount, ruleCount, recentLogs] = await Promise.all([
    prisma.tag.count(),
    prisma.automationRule.count({ where: { isActive: true } }),
    prisma.marketingLog.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
  ]);

  const quickTools = [
    { href: '/marketing/broadcaster', label: t('nav.marketing.broadcaster'), icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>, color: '#3b82f6' },
    { href: '/marketing/automation', label: t('nav.marketing.automation'), icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, color: '#10b981' },
    { href: '/marketing/integration', label: t('nav.marketing.integration'), icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>, color: '#f59e0b' },
    { href: '/marketing/history', label: t('nav.marketing.history'), icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>, color: '#6366f1' },
  ];

  return (
    <div className="container" style={{ maxWidth: '900px', paddingBottom: '100px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px' }}>{t('marketing.overview.title')}</h1>
        <p style={{ color: 'var(--text-muted)' }}>{t('marketing.overview.subtitle')}</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-lg" style={{ marginBottom: '32px' }}>
        <div className="card shadow-sm flex flex-col items-center justify-center text-center" style={{ padding: '24px', borderRadius: '20px' }}>
          <span style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', background: '#eff6ff', padding: '16px', borderRadius: '50%' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
          </span>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('marketing.overview.tags')}</h3>
          <p style={{ fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{tagCount}</p>
        </div>
        <div className="card shadow-sm flex flex-col items-center justify-center text-center" style={{ padding: '24px', borderRadius: '20px' }}>
          <span style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', background: '#ecfdf5', padding: '16px', borderRadius: '50%' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </span>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('marketing.overview.rules')}</h3>
          <p style={{ fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(135deg, #10b981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{ruleCount}</p>
        </div>
      </div>

      {/* Quick Tools Grid - Mobile Priority */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', paddingLeft: '4px' }}>{t('marketing.overview.quick_tools')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
          {quickTools.map(tool => (
            <Link key={tool.href} href={tool.href} style={{ textDecoration: 'none' }}>
              <div className="card shadow-sm dropdown-item-hover" style={{ 
                padding: '20px 12px', 
                borderRadius: '16px', 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                border: '1px solid var(--border-color)',
                height: '100%'
              }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '14px', 
                  background: `${tool.color}15`, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  color: tool.color
                }}>
                  {tool.icon}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>{tool.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <div className="card shadow-sm" style={{ borderRadius: '20px' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{t('marketing.overview.recent')}</h2>
          <Link href="/marketing/history" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600' }}>{t('marketing.overview.view_all')}</Link>
        </div>
        <div className="flex flex-col gap-md">
          {recentLogs.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '20px' }}>{t('marketing.overview.no_logs')}</p>
          ) : (
            recentLogs.map(log => (
              <div key={log.id} className="flex justify-between items-center" style={{ padding: '4px 0 12px', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                    {log.type === 'EMAIL_BROADCAST' ? t('marketing.overview.type_broadcast') : t('marketing.overview.type_automation')}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.target} · {log.details}</p>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-muted)', padding: '2px 8px', borderRadius: '8px' }}>
                  {new Date(log.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
