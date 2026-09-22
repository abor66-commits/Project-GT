'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteContactButton({ contactId, companyId }: { contactId: string, companyId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('確定要刪除這個聯絡人嗎？此操作無法還原。')) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: contactId, companyId }),
      });
      const result = await res.json();
      if (!result.success) {
        alert(result.error || '刪除失敗');
      } else {
        router.refresh();
      }
    } catch (error) {
      alert('發生錯誤');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      style={{ 
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
      }}
      title="刪除聯絡人"
    >
      {isDeleting ? (
        <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #fee2e2', borderTopColor: '#ef4444', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
