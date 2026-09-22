'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface Contact {
  id: string;
  name: string;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  isPrimary: boolean;
  createdById?: string | null;
}

interface Props {
  contact: Contact;
  companyId: string;
  currentUserId: string;
  userRole: string;
}

export default function SwipeableContactCard({ contact, companyId, currentUserId, userRole }: Props) {
  const { t } = useTranslation();
  const isAdminOrManager = userRole === 'ADMIN' || userRole === 'MANAGER';
  const canModify = isAdminOrManager || contact.createdById === currentUserId;

  // Swipe state
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Long press state
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: contact.name,
    email: contact.email || '',
    phone: contact.phone || '',
    jobTitle: contact.jobTitle || '',
    isPrimary: contact.isPrimary || false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close swipe when clicking outside
  useEffect(() => {
    if (!isRevealed) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setIsRevealed(false);
        setSwipeOffset(0);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [isRevealed]);

  // --- Touch handlers (swipe right = reveal delete) ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!canModify) return;
    touchStartX.current = e.touches[0].clientX;

    // Long press timer
    longPressTimer.current = setTimeout(() => {
      setIsEditOpen(true);
      touchStartX.current = null; // cancel swipe
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    // Only swipe right → positive delta means right, but we want left-to-reveal (negative delta means left)
    // User requirement: 右滑刪除 = swipe from left to right → positive delta
    if (delta > 0) {
      // Cancel long press if moving
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      setSwipeOffset(Math.min(delta, 80));
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (swipeOffset > 50) {
      setIsRevealed(true);
      setSwipeOffset(80);
    } else {
      setIsRevealed(false);
      setSwipeOffset(0);
    }
    touchStartX.current = null;
  };

  const handleDelete = async () => {
    if (!confirm(`${t('contact.delete_confirm')}`)) {
      setIsRevealed(false);
      setSwipeOffset(0);
      return;
    }
    setIsDeleting(true);
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: contact.id, companyId }),
    });
    const result = await res.json();
    if (!result.success) {
      alert(result.error || '刪除失敗');
      setIsDeleting(false);
      setIsRevealed(false);
      setSwipeOffset(0);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setEditError(null);
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id: contact.id, companyId, ...formData }),
    });
    const result = await res.json();
    if (result.success) {
      setIsEditOpen(false);
    } else {
      setEditError(result.error || '發生錯誤');
    }
    setIsSubmitting(false);
  };

  const REVEAL_WIDTH = 80;

  return (
    <>
      {/* Card wrapper with overflow hidden for swipe clip */}
      <div ref={cardRef} style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', marginBottom: '12px' }}>

        {/* Red delete panel (behind card, revealed on swipe) */}
        {canModify && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${REVEAL_WIDTH}px`,
              background: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px 0 0 12px',
            }}
          >
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.7rem',
                fontWeight: 700,
                opacity: isDeleting ? 0.7 : 1,
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>🗑️</span>
              {isDeleting ? t('common.loading') : t('common.delete')}
            </button>
          </div>
        )}

        {/* The actual card, translates right on swipe */}
        <div
          className="mobile-card"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: `translateX(${isRevealed ? REVEAL_WIDTH : swipeOffset}px)`,
            transition: swipeOffset === 0 || isRevealed ? 'transform 0.2s ease' : 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            cursor: canModify ? 'grab' : 'default',
            position: 'relative',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '2px', wordBreak: 'break-word' }}>
                {contact.name}
                {contact.isPrimary && (
                  <span style={{ marginLeft: '8px', fontSize: '0.7rem', background: 'var(--primary)', color: '#fff', borderRadius: '4px', padding: '2px 6px', verticalAlign: 'middle' }}>
                    主要
                  </span>
                )}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{contact.jobTitle}</p>
            </div>
            {canModify && (
              <div style={{ flexShrink: 0, marginLeft: '12px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                {/* Edit hint on desktop */}
                <button 
                  onClick={() => setIsEditOpen(true)} 
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
              </div>
            )}
          </div>

          {(contact.email || contact.phone) && (
            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {contact.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>✉️</span>
                  <a href={`mailto:${contact.email}`} style={{ fontSize: '0.85rem', color: 'var(--primary)', wordBreak: 'break-all', textDecoration: 'none', fontWeight: '600' }}>{contact.email}</a>
                </div>
              )}
              {contact.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>📱</span>
                  <a href={`tel:${contact.phone}`} style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>{contact.phone}</a>
                </div>
              )}
            </div>
          )}

          {/* Swipe hint for authorized users */}
          {canModify && !isRevealed && (
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.5, margin: 0, textAlign: 'right' }}>
              {t('contact.swipe_hint')}
            </p>
          )}
        </div>
      </div>

      {/* Edit Modal via portal */}
      {isEditOpen && mounted && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: '100%', margin: '16px', maxWidth: '450px', padding: '24px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '900', margin: 0 }}>{t('contact.edit_title')}</h2>
              <button onClick={() => setIsEditOpen(false)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-md">
              <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="姓名 *" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }} />
              <input type="text" value={formData.jobTitle} onChange={e => setFormData({ ...formData, jobTitle: e.target.value })} placeholder="職稱" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }} />
              <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="Email" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }} />
              <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="電話" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }} />
              <label className="flex items-center gap-md" style={{ fontSize: '0.85rem' }}>
                <input type="checkbox" checked={formData.isPrimary} onChange={e => setFormData({ ...formData, isPrimary: e.target.checked })} /> {t('contact.primary')}
              </label>
              {editError && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{editError}</p>}
              <div className="flex gap-md" style={{ marginTop: '16px' }}>
                <button type="button" onClick={() => setIsEditOpen(false)} className="btn-ghost" style={{ flex: 1 }}>{t('common.cancel')}</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 2 }}>{isSubmitting ? t('contact.saving') : t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
