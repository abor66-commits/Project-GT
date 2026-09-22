'use client';

import React, { useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  department: string | null;
  jobTitle: string | null;
  region: string | null;
}

export default function EditUserModal({ user, currentUserRole }: { user: User, currentUserRole: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  function closeModal() {
    setIsOpen(false);
    setShowDeleteConfirm(false);
    setShowPassword(false);
    setIsDeleting(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
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
          password: formData.get('password'),
        }),
      });
      const data = await res.json();
      if (data.success) closeModal();
      else alert(data.error || '更新失敗');
    } catch (error) {
      console.error(error);
      alert('更新失敗，請檢查欄位格式');
    } finally {
      setIsPending(false);
    }
  }

  async function handleDeleteConfirmed() {
    setIsDeleting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: user.id }),
      });
      const data = await res.json();
      if (data.success) closeModal();
      else { alert(data.error || '刪除失敗'); setIsDeleting(false); }
    } catch (e) {
      alert(e instanceof Error ? e.message : '刪除失敗');
      setIsDeleting(false);
    }
  }

  const canAssignAdmin = currentUserRole === 'ADMIN';

  return (
    <>
      <button
        className="btn-ghost"
        onClick={() => setIsOpen(true)}
        style={{ padding: '4px 12px', fontSize: '0.8rem' }}
      >
        修改
      </button>

      {/* Main Edit Modal */}
      {isOpen && (
        <div
          className="modal-overlay"
          onClick={closeModal}
        >
          <div
            className="modal-card"
            style={{ maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>修改成員資料</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>正在編輯：{user.email}</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-md">
              <div className="flex flex-col gap-sm">
                <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>姓名</label>
                <input name="name" defaultValue={user.name} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)' }} />
              </div>

              <div className="form-grid-2col">
                <div className="flex flex-col gap-sm">
                  <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>職位角色</label>
                  <select name="role" defaultValue={user.role} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                    <option value="SALES">SALES (業務)</option>
                    <option value="MARKETING">MARKETING (行銷專員)</option>
                    <option value="MANAGER">MANAGER (管理員)</option>
                    {canAssignAdmin && <option value="ADMIN">ADMIN (系統管理員)</option>}
                    <option value="ASSISTANT">ASSISTANT (助理)</option>
                    <option value="SSO">SSO (單一登入用戶)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-sm">
                  <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>帳號狀態</label>
                  <select name="status" defaultValue={user.status} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                    <option value="APPROVED">APPROVED (已核准)</option>
                    <option value="PENDING">PENDING (待審核)</option>
                    <option value="DISABLED">DISABLED (停用)</option>
                    <option value="REJECTED">REJECTED (拒絕)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-sm" style={{ padding: '12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary)' }}>重設密碼 (選填)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="若不修改請留空"
                    style={{ width: '100%', padding: '10px', paddingRight: '40px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '8px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', fontSize: '1rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px'
                    }}
                  >
                    {showPassword ? '👁' : '👁‍🗨'}
                  </button>
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>* 填寫後將直接覆蓋原成員密碼</p>
              </div>

              <div className="form-grid-2col">
                <div className="flex flex-col gap-sm">
                  <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>部門</label>
                  <input name="department" defaultValue={user.department || ''} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)' }} />
                </div>
                <div className="flex flex-col gap-sm">
                  <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>區域</label>
                  <select name="region" defaultValue={user.region || '台灣'} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                    <option value="台灣">台灣</option>
                    <option value="香港">香港</option>
                    <option value="日本">日本</option>
                    <option value="東南亞">東南亞</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-sm">
                <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>職稱</label>
                <input name="jobTitle" defaultValue={user.jobTitle || ''} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)' }} />
              </div>

              <div className="flex gap-md" style={{ marginTop: '24px' }}>
                <button type="submit" className="btn-primary" disabled={isPending} style={{ flex: 1, padding: '12px' }}>
                  {isPending ? '更新中...' : '儲存變更'}
                </button>
                <button type="button" className="btn-ghost" onClick={closeModal} style={{ flex: 1, padding: '12px' }}>
                  取消
                </button>
              </div>
            </form>

            {currentUserRole === 'ADMIN' && (
              <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#fef2f2',
                    color: '#ef4444',
                    border: '1px solid #fee2e2',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  🗑️ 刪除此成員
                </button>
              </div>
            )}

            {user.status.toUpperCase() === 'PENDING' && (
              <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: '#b45309', marginBottom: '12px', fontWeight: '600' }}>⚠️ 此成員尚未完成帳號設置</p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'resendInvitation', userId: user.id }),
                      });
                      const data = await res.json();
                      if (data.success) alert('✅ 邀請信已重新寄出');
                      else alert('❌ 寄送失敗');
                    } catch (e) {
                      alert('❌ 寄送失敗: ' + (e instanceof Error ? e.message : '未知錯誤'));
                    }
                  }}
                  className="btn-secondary"
                  style={{
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
                  }}
                >
                  📧 重新寄送邀請信
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation — stacked overlay above main modal */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px',
            animation: 'fadeIn 0.15s ease',
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '20px',
              padding: '28px 24px',
              maxWidth: '360px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'fadeInScale 0.2s ease',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#ef4444', marginBottom: '8px' }}>
              確認永久刪除成員？
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '600', marginBottom: '6px' }}>
              {user.name}（{user.email}）
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
              此動作無法復原。該成員名下的所有客戶、商機與活動紀錄將自動移交給您。
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? '刪除中...' : '確認刪除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
