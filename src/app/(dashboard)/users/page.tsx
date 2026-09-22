import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTranslationServer } from '@/lib/i18n/server';
import Link from 'next/link';

import SortHeader from '@/components/SortHeader';

import InviteUserModal from '@/components/InviteUserModal';
import { inviteUser } from '@/app/actions/users';
import ResendInvitationAction from '@/components/ResendInvitationAction';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; order?: string }>;
}) {
  const { t } = await getTranslationServer();
  const params = await searchParams;
  const sort = params.sort || 'createdAt';
  const order = (params.order || 'desc') as 'asc' | 'desc';

  const currentUser = await getSession();
  
  if (!currentUser || (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN')) {
    redirect('/');
  }
  
  const users = await prisma.user.findMany({
    where: currentUser.role === 'MANAGER' ? { role: { not: 'ADMIN' } } : {},
    orderBy: { [sort]: order }
  });

  return (
    <div className="container">
      <header className="flex justify-between items-center mobile-section-gap" style={{ marginBottom: '24px' }}>
        <div>
          <h1>{t('users.title')}</h1>
          <p className="desktop-only">{t('users.subtitle')}</p>
        </div>
        <div className="desktop-only">
          <InviteUserModal onInvite={inviteUser} />
        </div>
      </header>

      {/* Desktop Table View */}
      <div className="card desktop-only" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'color-mix(in srgb, var(--text-main-custom, var(--text-main)) 5%, transparent)', borderBottom: 'var(--card-border-custom, 1px solid var(--border-color))' }}>
              <th style={{ padding: '16px' }}><SortHeader label={t('users.table.name')} field="name" /></th>
              <th style={{ padding: '16px' }}><SortHeader label={t('users.table.email')} field="email" /></th>
              <th style={{ padding: '16px' }}><SortHeader label={t('users.table.role')} field="role" /></th>
              <th style={{ padding: '16px' }}><SortHeader label={t('users.table.status')} field="status" /></th>
              <th style={{ padding: '16px' }}><SortHeader label={t('users.table.region')} field="region" /></th>
              <th style={{ padding: '16px' }}><SortHeader label={t('users.table.joined')} field="createdAt" /></th>
              <th style={{ padding: '16px' }}>{t('users.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row-hover">
                <td style={{ padding: '16px', fontWeight: '600' }}>{user.name}</td>
                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{user.email}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '12px', 
                    fontSize: '0.75rem', 
                    fontWeight: '700',
                    background: user.role === 'MANAGER' ? '#fef2f2' : user.role === 'MARKETING' ? '#fdf4ff' : '#eff6ff',
                    color: user.role === 'MANAGER' ? '#ef4444' : user.role === 'MARKETING' ? '#c026d3' : '#2563eb',
                    border: `1px solid ${user.role === 'MANAGER' ? '#fee2e2' : user.role === 'MARKETING' ? '#fae8ff' : '#dbeafe'}`
                  }}>
                    {t(`role.${user.role}` as any)}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '12px', 
                    fontSize: '0.75rem', 
                    fontWeight: '600',
                    background: user.status === 'APPROVED' ? '#f0fdf4' : '#f8fafc',
                    color: user.status === 'APPROVED' ? '#16a34a' : 'var(--text-muted)',
                    border: `1px solid ${user.status === 'APPROVED' ? '#dcfce7' : 'var(--border-color)'}`
                  }}>
                    {t(`status.${user.status}` as any)}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>{user.region ? t(`region.${user.region}` as any) : t('region.UNSET')}</td>
                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{new Date(user.createdAt).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' })}</td>
                <td style={{ padding: '16px' }}>
                  <div className="flex items-center gap-sm">
                    <Link
                      href={`/users/${user.id}/edit`}
                      className="btn-icon"
                      style={{ 
                        padding: '8px', 
                        borderRadius: '8px', 
                        color: 'var(--text-muted)', 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card-custom, var(--bg-card))',
                        textDecoration: 'none' 
                      }}
                      title={t('users.table.edit')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </Link>
                    {user.status === 'PENDING' && (
                      <ResendInvitationAction userId={user.id} userEmail={user.email} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="mobile-card-list mobile-only">
        {users.map((user) => (
          <div key={user.id} className="mobile-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <p style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)' }}>{user.name}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</p>
              </div>
              <span style={{ 
                padding: '3px 8px', 
                borderRadius: '10px', 
                fontSize: '0.65rem', 
                fontWeight: '700',
                background: user.role === 'MANAGER' ? '#fef2f2' : user.role === 'MARKETING' ? '#fdf4ff' : '#eff6ff',
                color: user.role === 'MANAGER' ? '#ef4444' : user.role === 'MARKETING' ? '#c026d3' : '#2563eb'
              }}>
                {t(`role.${user.role}` as any)}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="flex items-center gap-sm">
                <span style={{ 
                  width: '8px', height: '8px', borderRadius: '50%', 
                  background: user.status === 'APPROVED' ? '#10b981' : '#cbd5e1'
                }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                  {t(`status.${user.status}` as any)}
                </span>
              </div>
              <div className="flex items-center gap-sm">
                <Link
                  href={`/users/${user.id}/edit`}
                  className="btn-ghost"
                  style={{ padding: '4px 12px', fontSize: '0.8rem', textDecoration: 'none' }}
                >
                  {t('users.table.edit')}
                </Link>
                {user.status === 'PENDING' && (
                  <ResendInvitationAction userId={user.id} userEmail={user.email} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile FAB */}
      <div className="mobile-only">
        <InviteUserModal onInvite={inviteUser} fab />
      </div>
    </div>
  );
}
