import React from 'react';
import { prisma } from '@/lib/db';
import FormIntegrationManager from '@/components/FormIntegrationManager';
import { getTranslationServer } from '@/lib/i18n/server';

export default async function IntegrationPage() {
  const { t } = await getTranslationServer();
  const apiKeySetting = await prisma.systemSetting.findUnique({ where: { key: 'MARKETING_API_KEY' } });

  return (
    <div style={{ maxWidth: '800px', width: '100%', minWidth: 0 }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '8px' }}>{t('marketing.integration.title')}</h1>
        <p style={{ color: 'var(--text-muted)' }}>{t('marketing.integration.subtitle' as any)}</p>
      </header>

      <FormIntegrationManager initialApiKey={apiKeySetting?.value || ''} />
    </div>
  );
}
