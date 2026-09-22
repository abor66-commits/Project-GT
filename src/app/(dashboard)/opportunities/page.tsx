import React from 'react';
import { prisma } from '@/lib/db';
import OpportunityKanban from '@/components/OpportunityKanban';
import Link from 'next/link';
import { getSalesUsers } from '@/app/actions/users';
import { getTranslationServer } from '@/lib/i18n/server';

export default async function OpportunitiesPage() {
  const { t } = await getTranslationServer();
  const session = await (await import('@/lib/auth')).getSession();
  if (!session) return null;

  const isRestricted = session.role === 'SALES' && session.exclusiveMode === true;
  const oppFilter = isRestricted ? {
    OR: [
      { ownerId: session.id },
      { company: { salesDeputy: session.id } }
    ]
  } : {};
  const companyFilter = isRestricted ? {
    OR: [
      { ownerId: session.id },
      { salesDeputy: session.id }
    ]
  } : {};

  const [opportunities, companies, salesUsers] = await Promise.all([
    prisma.opportunity.findMany({
      where: oppFilter,
      include: {
        company: { select: { id: true, name: true } },
        owner: { select: { name: true } }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    }),
    prisma.company.findMany({ where: companyFilter, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    getSalesUsers()
  ]);

  return (
    <div className="container">
      <header className="flex justify-between items-center" style={{ marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ flex: '1 1 100%', minWidth: 0 }}>
          <h1 style={{ wordBreak: 'break-word' }}>{t('opportunities.title')}</h1>
          <p>{t('opportunities.subtitle')}</p>
        </div>
          <Link href="/opportunities/add" className="btn-primary" style={{ flexShrink: 0 }}>{t('opportunities.add_btn')}</Link>
      </header>

      <OpportunityKanban 
        initialOpportunities={opportunities} 
        companies={companies}
        users={salesUsers}
      />
    </div>
  );
}
