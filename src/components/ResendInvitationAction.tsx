'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function ResendInvitationAction({ userId, userEmail }: { userId: string, userEmail: string }) {
  const { t } = useTranslation();
  const [isSending, setIsSending] = useState(false);

  const handleResend = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSending) return;
    
    setIsSending(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resendInvitation', userId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`${t('users.resend_action.success')}${userEmail}`);
      } else {
        alert(`${t('users.resend_action.fail')}: ${data.error || t('users.resend_action.unexpected_error')}`);
      }
    } catch (error: any) {
      alert(`${t('users.resend_action.error_prefix')}${error.message || t('users.resend_action.unexpected_error')}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <button 
      onClick={handleResend}
      disabled={isSending}
      title={t('users.resend_action.tooltip')}
      style={{
        background: 'none',
        border: 'none',
        cursor: isSending ? 'not-allowed' : 'pointer',
        padding: '4px',
        fontSize: '1.1rem',
        opacity: isSending ? 0.5 : 1,
        transition: 'transform 0.2s'
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {isSending ? '⏳' : '📧'}
    </button>
  );
}
