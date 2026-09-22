'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { createTag, updateTag, deleteTag } from '@/app/actions/tags';
import TagModal from '@/components/TagModal';

type Tag = {
  id: string;
  name: string;
  color: string;
  description: string | null;
  _count: {
    companies: number;
    contacts: number;
  };
};

export default function TagsManager({ initialTags }: { initialTags: Tag[] }) {
  const { t } = useTranslation();
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [editingTag, setEditingTag] = useState<Tag | null | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleSave = async (data: { id?: string; name: string; color: string; description: string | null }) => {
    if (data.id) {
      await updateTag(data.id, data);
      setTags(tags.map(tag => tag.id === data.id ? { ...tag, ...data } : tag));
    } else {
      await createTag(data);
      window.location.reload();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('tags.delete_confirm' as any))) return;
    setIsDeleting(id);
    try {
      await deleteTag(id);
      setTags(tags.filter(tag => tag.id !== id));
    } catch {
      alert('刪除失敗');
    } finally {
      setIsDeleting(null);
    }
  };

  const TagBadge = ({ tag }: { tag: Tag }) => (
    <span style={{
      padding: '4px 12px',
      borderRadius: '16px',
      background: `${tag.color}20`,
      color: tag.color,
      fontWeight: 700,
      fontSize: '0.85rem',
      display: 'inline-block'
    }}>
      {tag.name}
    </span>
  );

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button
          className="btn-primary"
          onClick={() => setEditingTag(null)}
          style={{ padding: '10px 20px' }}
        >
          + {t('tags.add_btn' as any)}
        </button>
      </div>

      {/* ── Desktop: Table ── */}
      <div className="card desktop-only" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
            <tr>
              <th style={{ padding: '16px' }}>{t('tags.table.name' as any)}</th>
              <th style={{ padding: '16px' }}>{t('tags.table.description' as any)}</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>{t('tags.table.usage' as any)}</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>{t('tags.table.actions' as any)}</th>
            </tr>
          </thead>
          <tbody>
            {tags.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {t('tags.empty' as any)}
                </td>
              </tr>
            ) : (
              tags.map(tag => (
                <tr key={tag.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px' }}><TagBadge tag={tag} /></td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '300px' }}>
                    {tag.description || '-'}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: '0.9rem' }}>
                    {tag._count.companies + tag._count.contacts}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn-icon" 
                        onClick={() => setEditingTag(tag)} 
                        style={{ 
                          padding: '8px', 
                          borderRadius: '8px', 
                          color: 'var(--text-muted)', 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-card-custom, var(--bg-card))',
                          cursor: 'pointer' 
                        }}
                        title={t('tags.edit_btn' as any)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(tag.id)} 
                        disabled={isDeleting === tag.id} 
                        style={{ 
                          padding: '8px',
                          borderRadius: '8px',
                          color: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #fee2e2',
                          background: '#fef2f2',
                          cursor: isDeleting === tag.id ? 'not-allowed' : 'pointer',
                          opacity: isDeleting === tag.id ? 0.7 : 1
                        }}
                        title={t('tags.delete_btn' as any)}
                      >
                        {isDeleting === tag.id ? (
                          <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #fee2e2', borderTopColor: '#ef4444', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        )}
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile: Card list ── */}
      <div className="mobile-only" style={{ flexDirection: 'column', gap: '12px' }}>
        {tags.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontStyle: 'italic' }}>
            {t('tags.empty' as any)}
          </p>
        ) : (
          tags.map(tag => (
            <div key={tag.id} className="mobile-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Top row: badge + usage count */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <TagBadge tag={tag} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {t('tags.table.usage' as any)}: {tag._count.companies + tag._count.contacts}
                </span>
              </div>

              {/* Description */}
              {tag.description && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  {tag.description}
                </p>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', paddingTop: '4px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  className="btn-ghost"
                  onClick={() => setEditingTag(tag)}
                  style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
                >
                  {t('tags.edit_btn' as any)}
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => handleDelete(tag.id)}
                  disabled={isDeleting === tag.id}
                  style={{ flex: 1, padding: '8px', fontSize: '0.85rem', color: '#ef4444' }}
                >
                  {isDeleting === tag.id ? '...' : t('tags.delete_btn' as any)}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {editingTag !== undefined && (
        <TagModal
          tag={editingTag}
          onClose={() => setEditingTag(undefined)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
