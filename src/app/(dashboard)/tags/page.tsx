import React from 'react';
import { getTags } from '@/app/actions/tags';
import { getTranslationServer } from '@/lib/i18n/server';
import TagsManager from './TagsManager';

export default async function TagsSettingsPage() {
  const { t } = await getTranslationServer();
  const tags = await getTags();
  
  return (
    <div className="container">
      <header className="mobile-section-gap" style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: 'var(--mobile-h1-size, 1.8rem)', fontWeight: 900 }}>
          {t('tags.title' as any)}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {t('tags.subtitle' as any)}
        </p>
      </header>

      <TagsManager initialTags={tags as any} />
    </div>
  );
}
