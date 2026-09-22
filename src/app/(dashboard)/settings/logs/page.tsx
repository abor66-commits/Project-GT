import React from 'react';
import { getAuditLogs } from '@/app/actions/settings';
import SortHeader from '@/components/SortHeader';
import Pagination from '@/components/Pagination';

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; order?: string; page?: string; limit?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '20');
  const skip = (page - 1) * limit;

  const { logs, totalCount } = await getAuditLogs(skip, limit);
  
  return (
    <div className="container">
      <header className="mobile-section-gap" style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: 'var(--mobile-h1-size, 1.8rem)', fontWeight: 900 }}>ISO 安全日誌</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>記錄所有系統關鍵操作，符合 ISO 27001 合規要求</p>
      </header>

      {/* Desktop Table View */}
      <div className="card desktop-only" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'color-mix(in srgb, var(--text-main-custom, var(--text-main)) 5%, transparent)', borderBottom: 'var(--card-border-custom, 1px solid var(--border-color))' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '16px' }}>時間</th>
              <th style={{ textAlign: 'left', padding: '16px' }}>使用者</th>
              <th style={{ textAlign: 'left', padding: '16px' }}>動作</th>
              <th style={{ textAlign: 'left', padding: '16px' }}>資源</th>
              <th style={{ textAlign: 'left', padding: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>詳情</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>尚無日誌記錄</td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', fontSize: '0.85rem' }}>{new Date(log.createdAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</td>
                  <td style={{ padding: '16px', fontSize: '0.85rem', fontWeight: 600 }}>{log.userName}</td>
                  <td style={{ padding: '16px', fontSize: '0.85rem' }}>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      background: log.action.includes('DELETE') ? '#fee2e2' : log.action.includes('CREATE') ? '#ecfdf5' : '#eff6ff',
                      color: log.action.includes('DELETE') ? '#ef4444' : log.action.includes('CREATE') ? '#10b981' : '#3b82f6',
                      fontWeight: 700,
                      fontSize: '0.7rem'
                    }}>{log.action}</span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '0.85rem' }}>{log.resource}</td>
                  <td style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{log.details || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="mobile-card-list mobile-only">
        {logs.map(log => (
          <div key={log.id} className="mobile-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {new Date(log.createdAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </span>
              <span style={{ 
                padding: '2px 6px', 
                borderRadius: '4px', 
                background: log.action.includes('DELETE') ? '#fee2e2' : log.action.includes('CREATE') ? '#ecfdf5' : '#eff6ff',
                color: log.action.includes('DELETE') ? '#ef4444' : log.action.includes('CREATE') ? '#10b981' : '#3b82f6',
                fontWeight: 800,
                fontSize: '0.6rem'
              }}>{log.action}</span>
            </div>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{log.userName}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>資源：</span>{log.resource}
            </p>
            {log.details && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted-custom, var(--text-muted))', background: 'var(--bg-body-color, var(--bg-main))', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
                {log.details}
              </p>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '24px' }}>
        <Pagination totalCount={totalCount} currentPage={page} pageSize={limit} />
      </div>
    </div>
  );
}
