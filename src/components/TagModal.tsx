'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

type TagInput = {
  id?: string;
  name: string;
  color: string;
  description: string | null;
};

interface Props {
  tag?: TagInput | null;
  onClose: () => void;
  onSave: (data: { id?: string; name: string; color: string; description: string | null }) => Promise<void>;
}

const PRESET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export default function TagModal({ tag, onClose, onSave }: Props) {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState<TagInput>({
    id: tag?.id,
    name: tag?.name || '',
    color: tag?.color || PRESET_COLORS[0],
    description: tag?.description || '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!tag;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name.trim()) {
      setError('標籤名稱不可為空');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || '儲存失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px', width: '100%' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '1.25rem', fontWeight: 800 }}>
          {isEdit ? t('tags.modal.edit_title' as any) : t('tags.modal.add_title' as any)}
        </h2>

        {error && (
          <div style={{ padding: '12px', background: '#fee2e2', color: '#ef4444', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.95rem' }}>
              {t('tags.modal.name_label' as any)}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. VIP, 2024 Event..."
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--card-border-custom, 1px solid var(--border-color))', outline: 'none', background: 'var(--bg-card-custom, var(--bg-card))', color: 'var(--text-main-custom, var(--text-main))', fontSize: '1rem' }}
              required
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.95rem' }}>
              {t('tags.modal.color_label' as any)}
            </label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: c,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: formData.color === c ? `0 0 0 2px var(--bg-card-custom, var(--bg-main)), 0 0 0 4px ${c}` : 'none',
                    transition: 'all 0.2s'
                  }}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.95rem' }}>
              {t('tags.modal.desc_label' as any)}
            </label>
            <textarea
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="請描述這個標籤的使用時機與規則..."
              rows={4}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--card-border-custom, 1px solid var(--border-color))', outline: 'none', background: 'var(--bg-card-custom, var(--bg-card))', color: 'var(--text-main-custom, var(--text-main))', fontSize: '1rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-ghost"
              style={{ padding: '10px 24px' }}
            >
              {t('tags.modal.cancel' as any)}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ padding: '10px 24px' }}
            >
              {isSubmitting ? '...' : t('tags.modal.save' as any)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
