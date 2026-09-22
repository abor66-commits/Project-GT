import React from 'react';
import { prisma } from '@/lib/db';
import EmailBroadcaster from '@/components/EmailBroadcaster';
import { getSession } from '@/lib/auth';
import { getEmailTemplates } from '@/app/actions/emailTemplates';
import { getTranslationServer } from '@/lib/i18n/server';

export default async function BroadcasterPage() {
  const { t } = await getTranslationServer();
  const [allTags, templates, user] = await Promise.all([
    prisma.tag.findMany({ orderBy: { name: 'asc' } }),
    getEmailTemplates(),
    getSession(),
  ]);

  return (
    <div style={{ maxWidth: '1000px', width: '100%' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '8px' }}>{t('marketing.broadcaster.title')}</h1>
        <p style={{ color: 'var(--text-muted)' }}>{t('marketing.broadcaster.subtitle' as any)}</p>
      </header>

      <EmailBroadcaster
        allTags={allTags}
        templates={templates}
        currentUserId={user?.id ?? ''}
        userRole={user?.role ?? 'SALES'}
      />
    </div>
  );
}
