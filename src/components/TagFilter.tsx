'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface Tag {
  id: string;
  name: string;
}

export default function TagFilter({ allTags }: { allTags: Tag[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const currentTag = searchParams.get('tag') || '';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      params.set('tag', value);
    } else {
      params.delete('tag');
    }
    
    params.set('page', '1'); // Reset to page 1 on filter change
    router.push(`/companies?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-sm">
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('common.tag')}:</span>
      <select 
        value={currentTag} 
        onChange={handleChange}
        style={{ 
          padding: '6px 12px', 
          borderRadius: '6px', 
          border: '1px solid var(--border-color)', 
          fontSize: '0.85rem',
          background: 'var(--bg-card-custom, var(--bg-card))',
          color: 'var(--text-main)',
          outline: 'none'
        }}
      >
        <option value="">{t('common.all')}</option>
        {allTags.map(tag => (
          <option key={tag.id} value={tag.name}>{tag.name}</option>
        ))}
      </select>
    </div>
  );
}
