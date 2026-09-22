import React from 'react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import PipelineChart from '@/components/PipelineChart';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import TimeframeSelector from '@/components/TimeframeSelector';
import { getTranslationServer } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ timeframe?: string }>;
}) {
  const { t, locale } = await getTranslationServer();
  const user = await getSession();
  const resolvedSearchParams = await searchParams;
  const timeframe = resolvedSearchParams.timeframe || 'all';

  // Base filters based on role for live metrics
  const isRestricted = user?.role === 'SALES' && user?.exclusiveMode === true;
  
  const companyFilter = isRestricted ? {
    OR: [
      { ownerId: user?.id },
      { salesDeputy: user?.id }
    ]
  } : {};

  const oppFilter = isRestricted ? {
    OR: [
      { ownerId: user?.id },
      { company: { salesDeputy: user?.id } }
    ]
  } : {};

  // Calculate Start Date based on timeframe for reports
  let startDate = new Date(0); // Default to all time
  const now = new Date();

  if (timeframe === 'monthly') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (timeframe === 'quarterly') {
    const quarter = Math.floor(now.getMonth() / 3);
    startDate = new Date(now.getFullYear(), quarter * 3, 1);
  } else if (timeframe === 'yearly') {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  // Combined Prisma Queries for both operational and marketing data
  const [
    companyCount,
    opportunities,
    recentActivities,
    industries,
    sizes,
    statuses,
    owners,
    totalValue,
    sourceDistribution,
    campaignPerformance
  ] = await Promise.all([
    // 1. Operational live queries
    prisma.company.count({ where: companyFilter }),
    prisma.opportunity.findMany({
      where: oppFilter,
      include: { company: true }
    }),
    prisma.activity.findMany({
      where: isRestricted ? { ownerId: user?.id } : {},
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { owner: true }
    }),
    // 2. Analytical timeframed queries (Department-wide)
    prisma.company.groupBy({
      by: ['industry'],
      where: { createdAt: { gte: startDate }, ...companyFilter },
      _count: { id: true },
    }),
    prisma.company.groupBy({
      by: ['sizeScale'],
      where: { createdAt: { gte: startDate }, ...companyFilter },
      _count: { id: true },
    }),
    prisma.company.groupBy({
      by: ['status'],
      where: { createdAt: { gte: startDate }, ...companyFilter },
      _count: { id: true },
    }),
    prisma.opportunity.findMany({
      where: { createdAt: { gte: startDate }, ...oppFilter },
      include: { owner: { select: { name: true } } }
    }),
    prisma.opportunity.aggregate({
      where: { createdAt: { gte: startDate }, ...oppFilter },
      _sum: { amount: true }
    }),
    prisma.opportunity.groupBy({
      by: ['source'],
      where: { createdAt: { gte: startDate }, ...oppFilter },
      _count: { id: true }
    }),
    prisma.opportunity.groupBy({
      by: ['campaign'],
      where: { createdAt: { gte: startDate }, ...oppFilter },
      _sum: { amount: true }
    })
  ]);

  // Operational Live Calculations
  const totalPipelineValue = opportunities.reduce((sum, o) => sum + o.amount, 0);
  const wonValue = opportunities.filter(o => o.stage === 'CLOSED_WON').reduce((sum, o) => sum + o.amount, 0);
  
  const stages = ['QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON'];
  const chartData = stages.map(stage => ({
    stage,
    count: opportunities.filter(o => o.stage === stage).length,
    value: opportunities.filter(o => o.stage === stage).reduce((sum, o) => sum + o.amount, 0)
  }));

  // Marketing Analytics Formatting
  const industryData = industries.map(i => ({ name: i.industry, value: i._count.id }));
  const sizeData = sizes.map(s => ({ name: s.sizeScale, value: s._count.id }));
  const statusData = statuses.map(st => ({ 
    name: st.status === 'ACTIVE' ? t('companies.status.active') : t('companies.status.lead'), 
    value: st._count.id 
  }));
  
  const sourceData = sourceDistribution.map(s => ({ 
    name: s.source || 'Unknown', 
    value: s._count.id 
  }));
  
  const campaignData = campaignPerformance
    .filter(c => c.campaign)
    .map(c => ({ 
      name: c.campaign as string, 
      value: c._sum.amount || 0 
    }));
  
  // Group by owner name
  const ownerCounts = owners.reduce((acc: any, curr) => {
    const name = curr.owner.name;
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const ownerData = Object.keys(ownerCounts).map(name => ({ name, value: ownerCounts[name] }));

  const timeframeLabel = timeframe === 'all' ? t('reports.all_time') : 
                        timeframe === 'monthly' ? t('reports.monthly') : 
                        timeframe === 'quarterly' ? t('reports.quarterly') : 
                        t('reports.yearly');

  return (
    <div className="container">
      {/* 1. Header */}
      <header className="flex justify-between items-center mobile-section-gap" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--mobile-h1-size, 1.75rem)' }}>{t('dashboard.title')}</h1>
          <p style={{ fontSize: '0.85rem' }}>{t('dashboard.subtitle')}</p>
        </div>
      </header>

      {/* 2. Real-time Live KPIs Section */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', borderLeft: '4px solid var(--primary)', paddingLeft: '10px' }}>
        {t('dashboard.realtime_kpis' as any)}
      </h2>
      <div className="compact-stat-grid mobile-section-gap">
        <div className="card compact-stat-card">
          <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
            {t('dashboard.stats.active_clients')}
          </p>
          <p style={{ fontSize: '2rem', fontWeight: '800', margin: '12px 0' }}>{companyCount}</p>
        </div>
        
        <div className="card compact-stat-card">
          <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>{t('dashboard.pipeline_value' as any)}</p>
          <p style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)', margin: '12px 0' }}>
            ${(totalPipelineValue / 1000).toFixed(1)}k
          </p>
        </div>

        <div className="card compact-stat-card">
          <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>{t('dashboard.revenue_won')}</p>
          <p style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent)', margin: '12px 0' }}>
            ${(wonValue / 1000).toFixed(1)}k
          </p>
        </div>
      </div>

      {/* 3. Marketing Performance & Timeframe Section */}
      <div className="flex justify-between items-center" style={{ marginTop: '32px', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', borderLeft: '4px solid var(--secondary)', paddingLeft: '10px', margin: 0 }}>
          {t('reports.title')} ({timeframeLabel})
        </h2>
        <TimeframeSelector />
      </div>

      {/* 4. Marketing Period Stats Section */}
      <div className="compact-stat-grid mobile-section-gap">
        <div className="card compact-stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
           <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('reports.new_customers')}</p>
           <p style={{ fontSize: '1.75rem', fontWeight: '800', margin: '8px 0 0' }}>
             {industries.reduce((sum, i) => sum + i._count.id, 0)}
           </p>
        </div>
        <div className="card compact-stat-card" style={{ borderLeft: '4px solid var(--accent)' }}>
           <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('reports.new_opp_value')}</p>
           <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--accent)', margin: '8px 0 0' }}>
             ${(totalValue._sum.amount || 0).toLocaleString()}
           </p>
        </div>
        <div className="card compact-stat-card" style={{ borderLeft: '4px solid var(--secondary)' }}>
           <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('reports.closed_won')}</p>
           <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--secondary)', margin: '8px 0 0' }}>
             {owners.filter(o => o.stage === 'Closed_Won' || o.stage === 'CLOSED_WON').length}
           </p>
        </div>
      </div>

      {/* 5. Marketing Analytics and Segmentation Charts Grid */}
      <div style={{ marginBottom: '32px' }}>
        <AnalyticsCharts 
          industryData={industryData}
          sizeData={sizeData}
          statusData={statusData}
          ownerData={ownerData}
          sourceData={sourceData}
          campaignData={campaignData}
        />
      </div>

      {/* 6. AI Insights Summary */}
      <div className="card mobile-section-gap" style={{ background: '#f8fafc', borderLeft: '4px solid var(--accent)' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '12px', fontWeight: '700' }}>{t('reports.summary')} ({timeframeLabel})</h2>
        <p style={{ lineHeight: '1.6', fontSize: '0.9rem', color: 'var(--text-main)' }}>
          {totalValue._sum.amount && totalValue._sum.amount > 1000000 ? 
            t('reports.insights_strong') : 
            t('reports.insights_stable')}
        </p>
      </div>

      {/* 7. Live Operational Details Section */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', borderLeft: '4px solid var(--accent)', paddingLeft: '10px', marginTop: '32px' }}>
        {t('dashboard.sales_funnel' as any)}
      </h2>
      <div className="dashboard-main-grid">
         <div className="card mobile-section-gap" style={{ display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
            <h2 style={{ fontSize: '1rem', marginBottom: '10px' }}>{t('dashboard.pipeline_stages')}</h2>
            <div style={{ flex: 1, marginTop: '10px' }}>
               <PipelineChart data={chartData} />
            </div>
         </div>

         <div className="card">
            <h2 style={{ fontSize: '1rem', marginBottom: '16px' }}>{t('dashboard.recent_activities')}</h2>
            <div className="flex flex-col gap-md">
               {recentActivities.map((activity) => (
                 <div key={activity.id} style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                   <p style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                     <strong>{activity.owner.name}</strong>：{activity.type}
                   </p>
                   <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                     {new Date(activity.createdAt).toLocaleDateString(locale === 'zh-TW' ? 'zh-TW' : locale === 'ja' ? 'ja-JP' : 'en-US')}
                   </p>
                 </div>
               ))}
               {recentActivities.length === 0 && (
                 <p style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('dashboard.no_activities')}</p>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
