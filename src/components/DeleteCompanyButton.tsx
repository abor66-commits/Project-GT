'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function DeleteCompanyButton({ 
  id, 
  name, 
  userRole,
  userId,
  ownerId,
  iconOnly
}: { 
  id: string, 
  name: string, 
  userRole: string,
  userId?: string,
  ownerId?: string,
  iconOnly?: boolean
}) {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const isOwner = userId && ownerId && userId === ownerId;
  const canDelete = userRole === 'ADMIN' || userRole === 'MANAGER' || isOwner;

  if (!canDelete) return null;

  const handleDelete = async () => {
    if (!confirm(t('companies.delete_confirm').replace('{name}', name))) return;

    setIsDeleting(true);
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    const result = await res.json();
    if (!result.success) {
      alert(result.error);
    } else {
      router.push('/companies');
      router.refresh();
    }
    setIsDeleting(false);
  };

  return (
    <button 
      onClick={handleDelete} 
      disabled={isDeleting}
      style={iconOnly ? { 
          padding: '8px',
          borderRadius: '8px',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #fee2e2',
          background: '#fef2f2',
          cursor: isDeleting ? 'not-allowed' : 'pointer',
          opacity: isDeleting ? 0.7 : 1
      } : { 
        padding: '6px 12px', 
        fontSize: '0.8rem', 
        color: '#ef4444', 
        background: '#fef2f2', 
        border: '1px solid #fee2e2',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600'
      }}
      className={iconOnly ? "" : "btn-delete"}
      title={t('common.delete')}
    >
      {iconOnly ? (
        isDeleting ? (
          <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #fee2e2', borderTopColor: '#ef4444', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
        )
      ) : (
        isDeleting ? t('companies.deleting') : t('common.delete')
      )}
      {iconOnly && <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>}
    </button>
  );
}
