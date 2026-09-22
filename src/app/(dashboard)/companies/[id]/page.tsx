import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import ActivityForm from '@/components/ActivityForm';
import AddContactModal from '@/components/AddContactModal';
import TagManager from '@/components/TagManager';
import { getSession } from '@/lib/auth';
import EditCompanyModal from '@/components/EditCompanyModal';
import SwipeableContactCard from '@/components/SwipeableContactCard';
import { getTranslationServer } from '@/lib/i18n/server';
import EnrichButton from '@/components/EnrichButton';

export const dynamic = 'force-dynamic';

export default async function CompanyDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Resolve params first
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const { t } = await getTranslationServer();

  if (!id) notFound();

  const user = await getSession();
  if (!user) notFound();

  // Fetch company with its relations
  const [company, allTags] = await Promise.all([
    prisma.company.findUnique({
      where: { id },
      include: {
        owner: true,
        contacts: {
          include: {
            createdBy: { select: { id: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        tags: true,
      }
    }),
    prisma.tag.findMany({ orderBy: { name: 'asc' } })
  ]);

  if (!company) notFound();

  // Fetch activities separately due to polymorphic structure
  const activities = await prisma.activity.findMany({
    where: {
      relatedType: 'COMPANY',
      relatedId: id
    },
    include: {
      owner: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Get all sales/marketing/managers for the edit modal
  const salesUsers = await prisma.user.findMany({ 
    where: { 
      role: { in: ['SALES', 'MARKETING', 'MANAGER', 'ADMIN'] } 
    } 
  });
  
  // Get a default sales user for the form if needed
  const salesUser = salesUsers.find(u => u.role === 'SALES') || salesUsers[0];

  const canEdit = user.role === 'ADMIN' || user.role === 'MANAGER' || company.ownerId === user.id;

  return (
    <div className="container">
      <div className="mobile-section-gap" style={{ marginBottom: '16px' }}>
        <Link href="/companies" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem' }}>{t('company_detail.back')}</Link>
      </div>

      <header className="flex justify-between items-center mobile-section-gap" style={{ marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ flex: '1 1 100%', minWidth: 0 }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '8px', wordBreak: 'break-word' }}>{company.name}</h1>
          <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
             <span className="status-badge" style={{ background: '#f8fafc', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                {company.industry}
              </span>
              <span className="status-badge" style={{ 
                background: company.status === 'ACTIVE' ? '#f0fdf4' : '#eff6ff',
                color: company.status === 'ACTIVE' ? '#16a34a' : '#2563eb',
                border: `1px solid ${company.status === 'ACTIVE' ? '#dcfce7' : '#dbeafe'}`
              }}>
                {company.status === 'ACTIVE' ? t('company_detail.active') : t('company_detail.lead')}
              </span>
          </div>
        </div>
        <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
          <EditCompanyModal company={company} salesUsers={salesUsers} canEdit={canEdit} />
          <ActivityForm companyId={company.id} userId={salesUser?.id || ''} />
        </div>
      </header>

      <div className="dashboard-main-grid">
        <section className="flex flex-col gap-lg">
          {/* 聯絡人區塊 */}
          <div>
            <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>{t('company_detail.contacts_title')}</h2>
              <AddContactModal companyId={company.id} />
            </div>
            
            <div className="mobile-card-list">
              {company.contacts.length > 0 ? company.contacts.map(contact => (
                <SwipeableContactCard
                  key={contact.id}
                  contact={{
                    ...contact,
                    createdById: contact.createdBy?.id ?? contact.createdById ?? null,
                  }}
                  companyId={company.id}
                  currentUserId={user.id}
                  userRole={user.role}
                />
              )) : (
                <div className="card" style={{ textAlign: 'center', padding: '32px 16px', background: 'transparent', borderStyle: 'dashed' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('company_detail.no_contacts')}</p>
                </div>
              )}
            </div>
          </div>

          {/* 活動紀錄區塊 */}
          <div>
            <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>{t('company_detail.activity_title')}</h2>
            </div>
            
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: '20px', marginLeft: '8px' }}>
                 {activities.length > 0 ? activities.map(activity => (
                   <div key={activity.id} style={{ position: 'relative', marginBottom: '28px' }}>
                     <div style={{ 
                       position: 'absolute', 
                       left: '-27px', 
                       top: '2px', 
                       width: '12px', 
                       height: '12px', 
                       borderRadius: '50%', 
                       background: 'var(--primary)',
                       border: '2px solid white',
                       boxShadow: '0 0 0 2px var(--border-color)'
                     }}></div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                       <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', background: '#eff6ff', padding: '2px 8px', borderRadius: '10px' }}>
                         {activity.type}
                       </span>
                       <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                         {new Date(activity.createdAt).toLocaleDateString('zh-TW')}
                       </span>
                     </div>
                     <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.5', wordBreak: 'break-word' }}>
                       <strong>{activity.owner.name}</strong>：{activity.content}
                     </p>
                   </div>
                 )) : (
                   <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('company_detail.no_activity')}</p>
                 )}
              </div>
            </div>
          </div>
        </section>

        <aside>
          <div className="card">
            <h2 style={{ fontSize: '1rem', marginBottom: '16px' }}>{t('company_detail.details_title')}</h2>
            <div className="flex flex-col gap-md">
               <div>
                 <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>{t('company_detail.region_platform')}</p>
                 <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>{company.region || 'N/A'} · {company.platform || 'N/A'}</p>
               </div>
               {company.website && (
                 <div>
                   <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>{t('company_detail.website')}</p>
                   <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                     {company.website}
                   </a>
                 </div>
               )}
               <div>
                 <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>{t('company_detail.owner')}</p>
                 <div className="flex items-center gap-sm">
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>👤</div>
                    <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>{company.owner.name}</p>
                 </div>
               </div>

               <div>
                 <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>{t('company_detail.cloud_spend')}</p>
                 <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>{company.cloudSpendEst !== null ? `$${company.cloudSpendEst.toLocaleString()} USD` : 'N/A'}</p>
               </div>
               <div>
                 <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>{t('company_detail.cloud_renewal')}</p>
                 <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>{company.cloudRenewalDate ? new Date(company.cloudRenewalDate).toLocaleDateString('zh-TW') : 'N/A'}</p>
               </div>
               <div>
                 <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>{t('company_detail.technographics')}</p>
                 <p style={{ fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'pre-wrap' }}>{company.technographics || 'N/A'}</p>
               </div>
               <div>
                 <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>{t('company_detail.priority_score')}</p>
                 {company.priorityScore ? (
                   <span className="status-badge" style={{
                     background: company.priorityScore === 'HIGH' ? '#fef2f2' : company.priorityScore === 'MEDIUM' ? '#fffbeb' : '#f0fdf4',
                     color: company.priorityScore === 'HIGH' ? '#dc2626' : company.priorityScore === 'MEDIUM' ? '#d97706' : '#16a34a',
                     border: `1px solid ${company.priorityScore === 'HIGH' ? '#fecaca' : company.priorityScore === 'MEDIUM' ? '#fde68a' : '#bbf7d0'}`,
                     fontSize: '0.75rem',
                     padding: '2px 8px',
                     borderRadius: '4px',
                     display: 'inline-block',
                     fontWeight: 'bold'
                   }}>
                     {company.priorityScore}
                   </span>
                 ) : 'N/A'}
               </div>

               <div style={{ marginTop: '8px' }}>
                 <EnrichButton companyId={company.id} websiteUrl={company.website || ''} />
               </div>
               
               {/* Marketing Tags */}
               <TagManager companyId={company.id} initialTags={company.tags} allTags={allTags} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
