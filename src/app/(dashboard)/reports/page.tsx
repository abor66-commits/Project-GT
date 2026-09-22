import React from 'react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getTranslationServer } from '@/lib/i18n/server';
import CloudRoiCharts from '@/components/CloudRoiCharts';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const { t, locale } = await getTranslationServer();
  const user = await getSession();

  if (!user) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>{t('reports.roi.login_req' as any)}</p>
        <Link href="/login" className="btn-primary" style={{ display: 'inline-block', marginTop: '16px', padding: '10px 24px' }}>{t('reports.roi.login_btn' as any)}</Link>
      </div>
    );
  }

  // Check exclusive mode filters
  const isRestricted = user.role === 'SALES' && user.exclusiveMode === true;
  const companyFilter = isRestricted ? {
    OR: [
      { ownerId: user.id },
      { salesDeputy: user.id }
    ]
  } : {};

  // Fetch all companies and their opportunities for ROI calculations
  const companies = await prisma.company.findMany({
    where: companyFilter,
    include: {
      opportunities: true,
      owner: { select: { name: true } }
    }
  });

  // 1. Calculate General KPIs
  const profiledCompanies = companies.filter(c => c.cloudSpendEst !== null || c.platform || c.technographics);
  const totalProfiledAccounts = profiledCompanies.length;
  
  const totalEstCloudSpend = companies.reduce((sum, c) => sum + (c.cloudSpendEst || 0), 0);

  // Filter won opportunities of profiled accounts
  const profiledCompanyIds = new Set(profiledCompanies.map(c => c.id));
  const allOpps = companies.flatMap(c => c.opportunities);
  const profiledOpps = allOpps.filter(o => profiledCompanyIds.has(o.companyId));
  
  const totalPipeline = profiledOpps.reduce((sum, o) => sum + o.amount, 0);
  const totalWonRevenue = profiledOpps.filter(o => o.stage === 'CLOSED_WON').reduce((sum, o) => sum + o.amount, 0);

  // Inferred Intricately database cost benchmark (annual license assumed at $12,000 USD)
  const assumedToolCost = 12000;
  const roiMultiplier = totalWonRevenue > 0 ? (totalWonRevenue / assumedToolCost).toFixed(1) : '0';

  // 2. Format Cloud Spend Tiers
  // Tiers: Tier 1 (< 1k), Tier 2 (1k-5k), Tier 3 (5k-20k), Tier 4 (20k+)
  const tiers = [
    { name: '< $1K', min: 0, max: 999 },
    { name: '$1K - $5K', min: 1000, max: 4999 },
    { name: '$5K - $20K', min: 5000, max: 19999 },
    { name: '$20K+', min: 20000, max: Infinity }
  ];

  const spendTierData = tiers.map(tier => {
    const tierCompanies = companies.filter(c => {
      const spend = c.cloudSpendEst || 0;
      return spend >= tier.min && spend <= tier.max;
    });

    const tierOpps = tierCompanies.flatMap(c => c.opportunities);
    const pipeline = tierOpps.reduce((sum, o) => sum + o.amount, 0);
    const won = tierOpps.filter(o => o.stage === 'CLOSED_WON').reduce((sum, o) => sum + o.amount, 0);

    return {
      name: tier.name,
      pipeline,
      won
    };
  });

  // 3. Format Cloud Platforms distribution
  const platformCounts: Record<string, number> = {};
  companies.forEach(c => {
    const wonVal = c.opportunities.filter(o => o.stage === 'CLOSED_WON').reduce((sum, o) => sum + o.amount, 0);
    if (wonVal > 0) {
      const platform = c.platform || 'OTHER / UNKNOWN';
      platformCounts[platform] = (platformCounts[platform] || 0) + wonVal;
    }
  });

  const platformData = Object.keys(platformCounts).map(name => ({
    name,
    value: platformCounts[name]
  }));

  // Ensure default platform items for UI pie chart if empty
  if (platformData.length === 0) {
    platformData.push({ name: 'AWS', value: 0 });
    platformData.push({ name: 'GCP', value: 0 });
    platformData.push({ name: 'Multi-Cloud', value: 0 });
  }

  // Select titles based on translations
  const pageTitle = t('reports.roi.title' as any);
  const pageDesc = t('reports.roi.desc' as any);

  return (
    <div className="container">
      {/* Header */}
      <header className="flex justify-between items-center mobile-section-gap" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--mobile-h1-size, 1.75rem)' }}>{pageTitle}</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{pageDesc}</p>
        </div>
      </header>

      {/* Cloud KPIs Card Grid */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', borderLeft: '4px solid var(--primary)', paddingLeft: '10px' }}>
        {t('reports.roi.kpis' as any)}
      </h2>
      
      <div className="compact-stat-grid mobile-section-gap">
        {/* Profiled accounts */}
        <div className="card compact-stat-card">
          <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
            {t('reports.roi.profiled' as any)}
          </p>
          <p style={{ fontSize: '2rem', fontWeight: '800', margin: '12px 0' }}>
            {totalProfiledAccounts} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>/ {companies.length}</span>
          </p>
        </div>

        {/* Total Cloud Spend */}
        <div className="card compact-stat-card">
          <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
            {t('reports.roi.total_spend' as any)}
          </p>
          <p style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)', margin: '12px 0' }}>
            ${(totalEstCloudSpend / 1000).toFixed(1)}k <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>USD</span>
          </p>
        </div>

        {/* Won revenue from profiled accounts */}
        <div className="card compact-stat-card">
          <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
            {t('reports.roi.won_revenue' as any)}
          </p>
          <p style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent)', margin: '12px 0' }}>
            ${(totalWonRevenue / 1000).toFixed(1)}k <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>USD</span>
          </p>
        </div>
      </div>

      {/* ROI Efficiency Insight Card */}
      <div className="card mobile-section-gap" style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', borderLeft: '4px solid var(--accent)', padding: '20px', marginTop: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '8px', color: 'var(--accent)' }}>
          📈 {t('reports.roi.evaluation' as any)}
        </h3>
        <p style={{ lineHeight: '1.6', fontSize: '0.9rem' }}>
          {t('reports.roi.evaluation_desc' as any)
            .replace('{totalWonRevenue}', totalWonRevenue.toLocaleString())
            .replace('{roiMultiplier}', roiMultiplier)}
        </p>
      </div>

      {/* Visual Charts */}
      <CloudRoiCharts spendTierData={spendTierData} platformData={platformData} />
    </div>
  );
}
