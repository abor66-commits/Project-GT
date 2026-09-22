'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

export default function EditContactModal({ contact, companyId }: { contact: any; companyId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [formData, setFormData] = useState({
    name: contact.name,
    email: contact.email || '',
    phone: contact.phone || '',
    jobTitle: contact.jobTitle || '',
    isPrimary: contact.isPrimary || false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsSubmitting(true); 
    setError(null);
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id: contact.id, companyId, ...formData }),
    });
    const result = await res.json();
    if (result.success) { 
      setIsOpen(false); 
      router.refresh();
    } else {
      setError(result.error || '發生錯誤');
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="btn-icon"
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
        title="修改聯絡人"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
      </button>

      {isOpen && mounted && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: '100%', margin: '16px', maxWidth: '450px', padding: '24px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '900', margin: 0 }}>修改聯絡人</h2>
              <button onClick={() => setIsOpen(false)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-md">
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="姓名 *" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
              <input type="text" value={formData.jobTitle} onChange={e => setFormData({...formData, jobTitle: e.target.value})} placeholder="職稱" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="電話" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
              <label className="flex items-center gap-md" style={{ fontSize: '0.85rem' }}>
                <input type="checkbox" checked={formData.isPrimary} onChange={e => setFormData({...formData, isPrimary: e.target.checked})} /> 設為主要聯絡人
              </label>
              {error && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</p>}
              <div className="flex gap-md" style={{ marginTop: '16px' }}>
                <button type="button" onClick={() => setIsOpen(false)} className="btn-ghost" style={{ flex: 1 }}>取消</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 2 }}>{isSubmitting ? '儲存中...' : '儲存修改'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
