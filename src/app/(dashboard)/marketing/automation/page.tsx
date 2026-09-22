import React from 'react';
import { prisma } from '@/lib/db';
import AutomationManager from '@/components/AutomationManager';
import { getTranslationServer } from '@/lib/i18n/server';

export default async function AutomationPage() {
  const { t } = await getTranslationServer();
  const [allTags, automationRules] = await Promise.all([
    prisma.tag.findMany({ orderBy: { name: 'asc' } }),
    prisma.automationRule.findMany({ orderBy: { createdAt: 'desc' } })
  ]);

  return (
    <div style={{ maxWidth: '800px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '8px' }}>{t('marketing.automation.title')}</h1>
        <p style={{ color: 'var(--text-muted)' }}>{t('marketing.automation.subtitle' as any)}</p>
      </header>

      <AutomationManager initialRules={automationRules} allTags={allTags} />
    </div>
  );
}
