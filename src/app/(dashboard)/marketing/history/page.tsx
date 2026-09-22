import React from 'react';
import { prisma } from '@/lib/db';
import { getTranslationServer } from '@/lib/i18n/server';

export default async function HistoryPage() {
  const { t } = await getTranslationServer();
  const logs = await prisma.marketingLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  };

  return (
    <div style={{ maxWidth: '900px', width: '100%', minWidth: 0 }}>
      {/* Defensive CSS for responsive views without hydration flashes */}
      <style>{`
        .mobile-cards-view {
          display: none;
        }
        .desktop-table-view {
          display: block;
        }
        @media (max-width: 768px) {
          .mobile-cards-view {
            display: flex;
            flex-direction: column;
            gap: 16px;
            width: 100%;
          }
          .desktop-table-view {
            display: none;
          }
        }
      `}</style>

      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '8px' }}>
          {t('marketing.history.title')}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {t('marketing.history.subtitle')}
        </p>
      </header>

      {/* Desktop Table View (screen width > 768px) */}
      <div className="desktop-table-view card shadow-sm" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'color-mix(in srgb, var(--text-main-custom, var(--text-main)) 5%, transparent)', borderBottom: 'var(--card-border-custom, 1px solid var(--border-color))' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {t('marketing.history.col.time')}
                </th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {t('marketing.history.col.type')}
                </th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {t('marketing.history.col.target')}
                </th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap', minWidth: '200px' }}>
                  {t('marketing.history.col.details')}
                </th>
                <th style={{ textAlign: 'center', padding: '16px', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {t('marketing.history.col.status')}
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {t('marketing.history.no_records')}
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      {formatDate(new Date(log.createdAt))}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        background: log.type === 'EMAIL_BROADCAST' ? '#eff6ff' : '#f5f3ff',
                        color: log.type === 'EMAIL_BROADCAST' ? '#2563eb' : '#7c3aed',
                        fontWeight: '600',
                        display: 'inline-block',
                        whiteSpace: 'nowrap'
                      }}>
                        {log.type === 'EMAIL_BROADCAST' ? t('marketing.history.type.broadcast') : t('marketing.history.type.automation')}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '0.85rem', fontWeight: '500', whiteSpace: 'nowrap' }}>
                      {log.target}
                    </td>
                    <td style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', minWidth: '200px', wordBreak: 'break-word' }}>
                      {log.details}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        background: log.status === 'SUCCESS' ? '#dcfce7' : '#fee2e2',
                        color: log.status === 'SUCCESS' ? '#166534' : '#991b1b',
                        fontWeight: '600',
                        display: 'inline-block',
                        whiteSpace: 'nowrap'
                      }}>
                        {log.status === 'SUCCESS' ? t('marketing.history.status.success') : t('marketing.history.status.failure')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards View (screen width <= 768px) */}
      <div className="mobile-cards-view">
        {logs.length === 0 ? (
          <div className="card shadow-sm" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            {t('marketing.history.no_records')}
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="card shadow-sm" style={{ 
              padding: '16px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              background: 'var(--bg-card)',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {/* Card Header: Type & Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  background: log.type === 'EMAIL_BROADCAST' ? '#eff6ff' : '#f5f3ff',
                  color: log.type === 'EMAIL_BROADCAST' ? '#2563eb' : '#7c3aed',
                  fontWeight: '600',
                  whiteSpace: 'nowrap'
                }}>
                  {log.type === 'EMAIL_BROADCAST' ? t('marketing.history.type.broadcast') : t('marketing.history.type.automation')}
                </span>
                
                <span style={{ 
                  fontSize: '0.75rem', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  background: log.status === 'SUCCESS' ? '#dcfce7' : '#fee2e2',
                  color: log.status === 'SUCCESS' ? '#166534' : '#991b1b',
                  fontWeight: '600',
                  whiteSpace: 'nowrap'
                }}>
                  {log.status === 'SUCCESS' ? t('marketing.history.status.success') : t('marketing.history.status.failure')}
                </span>
              </div>

              {/* Card Body Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', width: '100%' }}>
                {/* Time row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: '1rem' }}>🕒</span>
                  <span style={{ fontWeight: '500' }}>{formatDate(new Date(log.createdAt))}</span>
                </div>
                
                {/* Target row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '1rem', marginTop: '2px' }}>🎯</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                      {t('marketing.history.col.target')}
                    </span>
                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{log.target}</span>
                  </div>
                </div>

                {/* Details row */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '8px', 
                  marginTop: '4px', 
                  paddingTop: '8px', 
                  borderTop: '1px dashed var(--border-color)',
                  width: '100%'
                }}>
                  <span style={{ fontSize: '1rem', marginTop: '2px' }}>📄</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', minWidth: 0 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                      {t('marketing.history.col.details')}
                    </span>
                    <span style={{ color: 'var(--text-muted)', lineHeight: '1.4', wordBreak: 'break-word' }}>
                      {log.details}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
