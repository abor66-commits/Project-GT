'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function InviteUserModal({ onInvite, fab }: { onInvite: (formData: FormData) => Promise<any>, fab?: boolean }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    try {
      const result = await onInvite(formData);
      // If we returned a message, show it
      if (result?.message) {
        alert(result.message);
      }
      setIsOpen(false);
    } catch (error: any) {
      alert(error.message || t('users.invite_modal.error_default'));
    }
    setIsPending(false);
  };

  if (!isOpen) {
    if (fab) {
      return (
        <button className="fab" onClick={() => setIsOpen(true)}>
          +
        </button>
      );
    }
    return (
      <button className="btn-primary" onClick={() => setIsOpen(true)}>
        {t('users.invite_modal.btn')}
      </button>
    );
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.5)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(4px)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{t('users.invite_modal.title')}</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
          {t('users.invite_modal.desc')}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div className="flex flex-col gap-sm">
            <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t('users.invite_modal.name')}</label>
            <input name="name" required placeholder={t('users.invite_modal.name_placeholder')} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }} />
          </div>

          <div className="flex flex-col gap-sm">
            <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t('users.invite_modal.email')}</label>
            <input name="email" type="email" required placeholder={t('users.invite_modal.email_placeholder')} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }} />
          </div>

          <div className="form-grid-2col">
            <div className="flex flex-col gap-sm">
              <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t('users.invite_modal.role')}</label>
              <select name="role" style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}>
                <option value="SALES">{t('users.invite_modal.role.sales')}</option>
                <option value="MARKETING">{t('users.invite_modal.role.marketing')}</option>
                <option value="MANAGER">{t('users.invite_modal.role.manager')}</option>
                <option value="ASSISTANT">{t('users.invite_modal.role.assistant')}</option>
              </select>
            </div>
            <div className="flex flex-col gap-sm">
              <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t('users.invite_modal.default_language')}</label>
              <select name="defaultLanguage" style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}>
                <option value="zh-TW">{t('users.invite_modal.lang.zh_tw')}</option>
                <option value="en">{t('users.invite_modal.lang.en')}</option>
                <option value="ja">{t('users.invite_modal.lang.ja')}</option>
              </select>
            </div>
          </div>

          <div className="flex gap-md" style={{ marginTop: '24px' }}>
            <button type="submit" className="btn-primary" disabled={isPending} style={{ flex: 1 }}>
              {isPending ? t('users.invite_modal.sending') : t('users.invite_modal.send')}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setIsOpen(false)} style={{ flex: 1 }}>
              {t('users.invite_modal.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
