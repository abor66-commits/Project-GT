import Link from 'next/link';
import { prisma } from '@/lib/db';
import Pagination from '@/components/Pagination';
import { getSalesUsers } from '@/app/actions/users';
import AddCompanyModal from '@/components/AddCompanyModal';
import EditCompanyModal from '@/components/EditCompanyModal';
import DeleteCompanyButton from '@/components/DeleteCompanyButton';
import ImportExportTools from '@/components/ImportExportTools';
import SortHeader from '@/components/SortHeader';
import { getSession } from '@/lib/auth';
import { getTranslationServer } from '@/lib/i18n/server';
import TagFilter from '@/components/TagFilter';
import AICardScanner from '@/components/AICardScanner';

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string; order?: string; tag?: string }>;
}) {
  const { t, locale } = await getTranslationServer();
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const sort = params.sort || 'updatedAt';
  const order = (params.order || 'desc') as 'asc' | 'desc';
  const tagFilter = params.tag;
  const pageSize = 15;

  const [user, salesUsers] = await Promise.all([
    getSession(),
    getSalesUsers()
  ]);

  const sortFieldMap: Record<string, string> = {
    name: 'name', industry: 'industry', region: 'region', platform: 'platform',
    status: 'status', updatedAt: 'updatedAt'
  };
  const prismaSortField = sortFieldMap[sort] || 'updatedAt';
  
  if (!user) return null;

  const isRestricted = user.role === 'SALES' && user.exclusiveMode === true;
  const exclusiveFilter = isRestricted ? {
    OR: [
      { ownerId: user.id },
      { salesDeputy: user.id }
    ]
  } : {};

  const where = {
    ...exclusiveFilter,
    ...(tagFilter ? { tags: { some: { name: tagFilter } } } : {})
  };

  const [companies, total, allTags] = await Promise.all([
    prisma.company.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [prismaSortField]: order },
      include: { 
        owner: { select: { name: true } },
        tags: true
      }
    }),
    prisma.company.count({ where }),
    prisma.tag.findMany({ orderBy: { name: 'asc' } })
  ]);

  return (
    <div className="container">
      <header className="flex justify-between items-center mobile-wrap" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--mobile-h1-size, 1.8rem)' }}>{t('companies.title')}</h1>
          <p className="desktop-only">{t('companies.subtitle')}</p>
        </div>
        <div className="flex gap-md items-center mobile-wrap" style={{ gap: '12px' }}>
          {/* Tag Filter Dropdown (Client Component) */}
          <TagFilter allTags={allTags} />
          
          <ImportExportTools userRole={user.role} currentUserId={user.id} />
          <AICardScanner />
          <AddCompanyModal salesUsers={salesUsers} currentUserId={user.id} />
        </div>
      </header>

      {/* Desktop Table */}
      <div className="card desktop-only" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'color-mix(in srgb, var(--text-main-custom, var(--text-main)) 5%, transparent)', borderBottom: 'var(--card-border-custom, 1px solid var(--border-color))' }}>
              <th style={{ padding: '16px' }}><SortHeader label={t('companies.table.name')} field="name" /></th>
              <th style={{ padding: '16px' }}><SortHeader label={t('companies.table.industry')} field="industry" /></th>
              <th style={{ padding: '16px' }}><SortHeader label={t('companies.table.region')} field="region" /></th>
              <th style={{ padding: '16px' }}><SortHeader label={t('companies.table.platform')} field="platform" /></th>
              <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('companies.table.owner')}</th>
              <th style={{ padding: '16px' }}><SortHeader label={t('companies.table.status')} field="status" /></th>
              <th style={{ padding: '16px' }}><SortHeader label={t('companies.table.updated')} field="updatedAt" /></th>
              <th style={{ padding: '16px' }}>{t('users.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row-hover">
                <td style={{ padding: '16px' }}>
                  <Link href={`/companies/${company.id}`} style={{ fontWeight: '700', textDecoration: 'none', color: 'var(--primary)' }}>
                    {company.name}
                  </Link>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{company.website}</p>
                  <div className="flex gap-xs" style={{ marginTop: '6px', flexWrap: 'wrap' }}>
                    {company.tags.map(tag => (
                      <span key={tag.id} style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '10px', background: `${tag.color}15`, color: tag.color || 'var(--text-main)', border: `1px solid ${tag.color}30` }}>
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '16px', fontSize: '0.9rem' }}>{company.industry}</td>
                <td style={{ padding: '16px', fontSize: '0.9rem' }}>{company.region}</td>
                <td style={{ padding: '16px' }}>
                  {company.platform && (
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.7rem', 
                      fontWeight: '700',
                      background: company.platform === 'AWS' ? '#ff990022' : company.platform === 'GCP' ? '#4285f422' : '#0078d422',
                      color: company.platform === 'AWS' ? '#ff9900' : company.platform === 'GCP' ? '#4285f4' : '#0078d4',
                      border: `1px solid ${company.platform === 'AWS' ? '#ff9900' : company.platform === 'GCP' ? '#4285f4' : '#0078d4'}44`
                    }}>
                      {company.platform}
                    </span>
                  )}
                </td>
                <td style={{ padding: '16px' }}>
                  <div className="flex items-center gap-sm">
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '700', color: 'var(--primary)' }}>
                      {company.owner.name.charAt(0)}
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{company.owner.name}</span>
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600',
                    background: company.status === 'ACTIVE' ? '#f0fdf4' : '#eff6ff',
                    color: company.status === 'ACTIVE' ? '#16a34a' : '#2563eb',
                    border: `1px solid ${company.status === 'ACTIVE' ? '#dcfce7' : '#dbeafe'}`
                  }}>
                    {company.status === 'ACTIVE' ? t('companies.status.active') : t('companies.status.lead')}
                  </span>
                </td>
                <td style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {new Date(company.updatedAt).toLocaleDateString(locale === 'zh-TW' ? 'zh-TW' : locale === 'ja' ? 'ja-JP' : 'en-US')}
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                   <div className="flex gap-sm justify-end">
                      <EditCompanyModal company={company} salesUsers={salesUsers} canEdit={user.role === 'ADMIN' || user.role === 'MANAGER' || company.ownerId === user.id || company.salesDeputy === user.id} iconOnly />
                      <DeleteCompanyButton id={company.id} name={company.name} userRole={user.role} userId={user.id} ownerId={company.ownerId} iconOnly />
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="mobile-card-list mobile-only">
        {companies.map((company) => (
          <div key={company.id} className="mobile-card">
            <Link href={`/companies/${company.id}`} style={{ textDecoration: 'none', display:'block', marginBottom:'12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <p style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)', marginBottom: '2px' }}>{company.name}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{company.industry} · {company.region} · <span style={{ color: company.platform === 'AWS' ? '#ff9900' : company.platform === 'GCP' ? '#4285f4' : 'inherit', fontWeight: '700' }}>{company.platform}</span></p>
                </div>
                <span style={{
                  padding: '4px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '700', flexShrink: 0,
                  background: company.status === 'ACTIVE' ? '#f0fdf4' : '#eff6ff',
                  color: company.status === 'ACTIVE' ? '#16a34a' : '#2563eb',
                  border: `1px solid ${company.status === 'ACTIVE' ? '#dcfce7' : '#dbeafe'}`
                }}>
                  {company.status === 'ACTIVE' ? t('companies.status.active') : t('companies.status.lead')}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: '700', color: 'var(--primary)' }}>
                    {company.owner.name.charAt(0)}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{company.owner.name}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(company.updatedAt).toLocaleDateString(locale === 'zh-TW' ? 'zh-TW' : locale === 'ja' ? 'ja-JP' : 'en-US')}
                </span>
              </div>
            </Link>
            {(user.role === 'ADMIN' || user.role === 'MANAGER' || company.ownerId === user.id || company.salesDeputy === user.id) && (
              <div className="flex gap-md" style={{ borderTop:'1px solid var(--border-color)', paddingTop:'12px', marginTop:'12px' }}>
                {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                  <div style={{ flex:1 }}><EditCompanyModal company={company} salesUsers={salesUsers} canEdit={user.role === 'ADMIN' || user.role === 'MANAGER' || company.ownerId === user.id || company.salesDeputy === user.id} /></div>
                )}
                <div style={{ flex:1 }}><DeleteCompanyButton id={company.id} name={company.name} userRole={user.role} userId={user.id} ownerId={company.ownerId} /></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile FAB */}
      <div className="mobile-only">
        <AddCompanyModal salesUsers={salesUsers} currentUserId={user.id} fab />
      </div>

      <Pagination totalCount={total} pageSize={pageSize} currentPage={page} />
    </div>
  );
}
