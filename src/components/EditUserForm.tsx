'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  department: string | null;
  jobTitle: string | null;
  region: string | null;
  defaultLanguage: string;
  exclusiveMode: boolean;
}

export default function EditUserForm({
  user,
  currentUserRole,
  currentUserId,
}: {
  user: User;
  currentUserRole: string;
  currentUserId: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { t } = useTranslation();

  const canAssignAdmin = currentUserRole === 'ADMIN';
  const canDelete = currentUserRole === 'ADMIN' && user.id !== currentUserId;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: user.id,
          name: formData.get('name'),
          role: formData.get('role'),
          status: formData.get('status'),
          department: formData.get('department'),
          jobTitle: formData.get('jobTitle'),
          region: formData.get('region'),
          defaultLanguage: formData.get('defaultLanguage'),
          exclusiveMode: formData.get('exclusiveMode') === 'true',
          password: formData.get('password'),
        }),
      });
      const data = await res.json();
      if (data.success) setSuccessMsg(t('users.edit.success_update'));
      else setErrorMsg(`❌ ${data.error || t('users.edit.error_update_default')}`);
    } catch {
      setErrorMsg(`❌ ${t('users.edit.error_update_default')}`);
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: user.id }),
      });
      const data = await res.json();
      if (data.success) window.location.href = '/users';
      else { setErrorMsg(data.error || '刪除失敗'); setIsDeleting(false); setShowDeleteConfirm(false); }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '刪除失敗');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  async function handleResend() {
    setIsResending(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resendInvitation', userId: user.id }),
      });
      const data = await res.json();
      if (data.success) setSuccessMsg(t('users.edit.success_resend'));
      else setErrorMsg(`❌ ${t('users.edit.error_resend')}`);
    } catch {
      setErrorMsg(`❌ ${t('users.edit.error_resend')}`);
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto' }}>
      {/* Back navigation */}
      <Link
        href="/users"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-muted)',
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontWeight: '500',
          marginBottom: '24px',
        }}
      >
        {t('users.edit.back')}
      </Link>

      <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '4px' }}>{t('users.edit.title')}</h1>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '32px' }}>
        {t('users.edit.editing').replace('{email}', user.email)}
      </p>

      {/* Status messages */}
      {successMsg && (
        <div style={{
          padding: '12px 16px',
          background: '#f0fdf4',
          border: '1px solid #dcfce7',
          borderRadius: '10px',
          color: '#16a34a',
          fontSize: '0.875rem',
          fontWeight: '600',
          marginBottom: '20px',
        }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{
          padding: '12px 16px',
          background: '#fef2f2',
          border: '1px solid #fee2e2',
          borderRadius: '10px',
          color: '#ef4444',
          fontSize: '0.875rem',
          fontWeight: '600',
          marginBottom: '20px',
        }}>
          {errorMsg}
        </div>
      )}

      {/* Edit Form */}
      <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div className="flex flex-col gap-sm">
            <label style={{ fontSize: '0.875rem', fontWeight: '600' }}>{t('users.edit.name')}</label>
            <input
              name="name"
              defaultValue={user.name}
              required
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem' }}
            />
          </div>

          <div className="form-grid-2col">
            <div className="flex flex-col gap-sm">
              <label style={{ fontSize: '0.875rem', fontWeight: '600' }}>{t('users.edit.role')}</label>
              <select
                name="role"
                defaultValue={user.role}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem' }}
              >
                <option value="SALES">{t('role.SALES')}</option>
                <option value="MARKETING">{t('role.MARKETING')}</option>
                <option value="MANAGER">{t('role.MANAGER')}</option>
                {canAssignAdmin && <option value="ADMIN">{t('role.ADMIN')}</option>}
                <option value="ASSISTANT">{t('role.ASSISTANT')}</option>
                <option value="SSO">{t('role.SSO')}</option>
              </select>
            </div>
            <div className="flex flex-col gap-sm">
              <label style={{ fontSize: '0.875rem', fontWeight: '600' }}>{t('users.edit.status')}</label>
              <select
                name="status"
                defaultValue={user.status}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem' }}
              >
                <option value="APPROVED">{t('status.APPROVED')}</option>
                <option value="PENDING">{t('status.PENDING')}</option>
                <option value="DISABLED">{t('status.DISABLED')}</option>
                <option value="REJECTED">{t('status.REJECTED')}</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-sm" style={{ padding: '14px', background: 'var(--bg-hover)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary)' }}>{t('users.edit.reset_password')}</label>
            <div style={{ position: 'relative' }}>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('users.edit.reset_password_placeholder')}
                style={{ width: '100%', padding: '12px', paddingRight: '48px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '1rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1 }}
              >
                {showPassword ? '👁' : '👁‍🗨'}
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('users.edit.reset_password_hint')}</p>
          </div>

          <div className="form-grid-2col">
            <div className="flex flex-col gap-sm">
              <label style={{ fontSize: '0.875rem', fontWeight: '600' }}>{t('users.edit.department')}</label>
              <input
                name="department"
                defaultValue={user.department || ''}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem' }}
              />
            </div>
            <div className="flex flex-col gap-sm">
              <label style={{ fontSize: '0.875rem', fontWeight: '600' }}>{t('users.edit.region')}</label>
              <select
                name="region"
                defaultValue={user.region || '台灣'}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem' }}
              >
                <option value="台灣">{t('region.台灣')}</option>
                <option value="香港">{t('region.香港')}</option>
                <option value="日本">{t('region.日本')}</option>
                <option value="東南亞">{t('region.東南亞')}</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2col">
            <div className="flex flex-col gap-sm">
              <label style={{ fontSize: '0.875rem', fontWeight: '600' }}>{t('users.edit.job_title')}</label>
              <input
                name="jobTitle"
                defaultValue={user.jobTitle || ''}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem' }}
              />
            </div>
            <div className="flex flex-col gap-sm">
              <label style={{ fontSize: '0.875rem', fontWeight: '600' }}>{t('users.edit.default_language')}</label>
              <select
                name="defaultLanguage"
                defaultValue={user.defaultLanguage || 'zh-TW'}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem' }}
              >
                <option value="zh-TW">{t('users.invite_modal.lang.zh_tw')}</option>
                <option value="en">{t('users.invite_modal.lang.en')}</option>
                <option value="ja">{t('users.invite_modal.lang.ja')}</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-sm">
            <label style={{ fontSize: '0.875rem', fontWeight: '600' }}>{t('users.edit.exclusive_mode')}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="checkbox" 
                name="exclusiveMode" 
                value="true"
                defaultChecked={user.exclusiveMode} 
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
              />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('users.edit.exclusive_mode_desc')}</span>
            </div>
          </div>

          <div className="flex gap-md" style={{ marginTop: '8px' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={isPending}
              style={{ flex: 1, padding: '14px', fontSize: '1rem' }}
            >
              {isPending ? t('users.edit.saving') : t('users.edit.save')}
            </button>
            <Link
              href="/users"
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontWeight: '600',
                fontSize: '1rem',
                textAlign: 'center',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {t('users.edit.cancel')}
            </Link>
          </div>
        </form>
      </div>

      {/* Pending — Resend Invitation */}
      {user.status.toUpperCase() === 'PENDING' && (
        <div className="card" style={{ padding: '20px', marginBottom: '20px', background: 'rgba(245, 158, 11, 0.04)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
          <p style={{ fontSize: '0.875rem', color: '#b45309', fontWeight: '700', marginBottom: '4px' }}>{t('users.edit.pending_warning')}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>{t('users.edit.pending_desc')}</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: '#f59e0b',
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: '700',
              cursor: isResending ? 'not-allowed' : 'pointer',
              opacity: isResending ? 0.7 : 1,
            }}
          >
            {isResending ? t('users.edit.resending') : t('users.edit.resend_btn')}
          </button>
        </div>
      )}

      {/* Delete Zone — only for ADMIN, not self */}
      {canDelete && (
        <div className="card" style={{ padding: '20px', border: '1px solid #fee2e2', background: '#fef9f9' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: '700', color: '#ef4444', marginBottom: '4px' }}>{t('users.edit.danger_zone')}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            {t('users.edit.delete_desc')}
          </p>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #fee2e2',
                background: '#fef2f2',
                color: '#ef4444',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              {t('users.edit.delete_btn')}
            </button>
          ) : (
            <div style={{ padding: '16px', background: '#fff5f5', borderRadius: '10px', border: '1px solid #fca5a5' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: '700', color: '#dc2626', marginBottom: '6px', textAlign: 'center' }}>
                {t('users.edit.delete_confirm').replace('{name}', user.name)}
              </p>
              <p style={{ fontSize: '0.78rem', color: '#9ca3af', textAlign: 'center', marginBottom: '16px' }}>
                {t('users.edit.delete_warning')}
              </p>
              <div className="flex gap-md">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  {t('users.edit.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#dc2626',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    opacity: isDeleting ? 0.7 : 1,
                  }}
                >
                  {isDeleting ? t('users.edit.deleting') : t('users.edit.confirm_delete')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
