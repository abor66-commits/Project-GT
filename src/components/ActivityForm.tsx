'use client';

import React, { useState, useTransition } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { useRouter } from 'next/navigation';

export default function ActivityForm({ companyId, userId }: { companyId: string, userId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;
    
    const formData = new FormData(e.currentTarget);
    const ownerId = formData.get('userId');
    const content = formData.get('summary');

    if (!ownerId) {
      alert(t('activity.no_user_info'));
      return;
    }

    if (!content) {
      alert(t('activity.empty_content'));
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            companyId: formData.get('companyId'),
            userId: formData.get('userId'),
            type: formData.get('type'),
            content: formData.get('summary'),
          }),
        });

        if (!res.ok) throw new Error(await res.text());

        setIsOpen(false);
        // Refresh Server Components so the new activity appears immediately
        router.refresh();
      } catch (error: any) {
        console.error(error);
        alert(`${t('activity.record_fail')} ${error.message || t('activity.unknown_error')}`);
      }
    });
  }

  if (!isOpen) {
    return (
      <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => setIsOpen(true)}>
        {t('activity.add_btn')}
      </button>
    );
  }

  return (
    <div className="card animate-fade-in-scale" style={{ 
      position: 'fixed', 
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)',
      zIndex: 1000,
      width: 'calc(100% - 32px)',
      maxWidth: '500px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
    }}>
      <h2 style={{ fontSize: '1.2rem', marginBottom: '24px', fontWeight: '700' }}>{t('activity.record_new_title')}</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-md">
        <input type="hidden" name="companyId" value={companyId} />
        <input type="hidden" name="userId" value={userId} />
        
        <div className="flex flex-col gap-sm">
          <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t('activity.type_label')}</label>
          <select name="type" required style={{ 
            border: '1px solid var(--border-color)', 
            padding: '12px', 
            borderRadius: '8px', 
            color: 'var(--text-main)',
            outline: 'none',
            background: '#fff'
          }}>
            <option value="Call">{t('activity.type_call')}</option>
            <option value="Meeting">{t('activity.type_meeting')}</option>
            <option value="Email">{t('activity.type_email')}</option>
            <option value="Note">{t('activity.type_note')}</option>
          </select>
        </div>

        <div className="flex flex-col gap-sm">
          <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t('activity.content_label')}</label>
          <textarea 
            name="summary" 
            required 
            placeholder={t('activity.content_placeholder')}
            style={{ 
              border: '1px solid var(--border-color)', 
              padding: '12px', 
              borderRadius: '8px', 
              color: 'var(--text-main)',
              minHeight: '120px',
              outline: 'none',
              resize: 'vertical',
              background: '#fff'
            }}
          />
        </div>

        <div className="flex gap-md" style={{ marginTop: '16px' }}>
          <button type="submit" className="btn-primary" disabled={isPending} style={{ flex: 1, padding: '12px' }}>
            {isPending ? t('activity.saving_btn') : t('activity.save_btn')}
          </button>
          <button type="button" className="btn-ghost" onClick={() => setIsOpen(false)} style={{ flex: 1, padding: '12px' }}>
            {t('activity.cancel_btn')}
          </button>
        </div>
      </form>
    </div>
  );
}
