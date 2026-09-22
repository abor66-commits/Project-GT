'use client';

import React, { useState, useTransition } from 'react';

interface Template {
  id: string;
  name: string;
  subject?: string | null;
  content: string;
  isShared: boolean;
  createdById: string;
  createdAt: Date | string;
}

interface TemplateManagerProps {
  templates: Template[];
  currentUserId: string;
  userRole: string;
  currentContent: string;
  currentSubject: string;
  onApply: (content: string, subject?: string) => void;
}

export default function TemplateManager({
  templates,
  currentUserId,
  userRole,
  currentContent,
  currentSubject,
  onApply,
}: TemplateManagerProps) {
  const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(userRole);
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveSubject, setSaveSubject] = useState(currentSubject);
  const [saveShared, setSaveShared] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [localTemplates, setLocalTemplates] = useState<Template[]>(templates);

  const handleSave = () => {
    if (!saveName.trim()) { setSaveError('請填寫模板名稱'); return; }
    if (!currentContent.trim()) { setSaveError('郵件內容不可為空'); return; }
    setSaveError('');
    startTransition(async () => {
      const res = await fetch('/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', name: saveName.trim(), subject: saveSubject, content: currentContent, isShared: saveShared }),
      });
      const result = await res.json();
      if (result.success && result.template) {
        setLocalTemplates(prev => [result.template as Template, ...prev]);
        setShowSaveForm(false);
        setSaveName('');
      } else {
        setSaveError(result.error ?? '儲存失敗');
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('確定要刪除這個模板嗎？')) return;
    startTransition(async () => {
      const res = await fetch('/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const result = await res.json();
      if (result.success) {
        setLocalTemplates(prev => prev.filter(t => t.id !== id));
      }
    });
  };

  const handleApply = (tpl: Template) => {
    if (!confirm(`套用模板「${tpl.name}」將覆蓋目前的編輯內容，確定嗎？`)) return;
    onApply(tpl.content, tpl.subject ?? undefined);
    setIsOpen(false);
  };

  const myTemplates = localTemplates.filter(t => t.createdById === currentUserId);
  const sharedTemplates = localTemplates.filter(t => t.isShared && t.createdById !== currentUserId);

  return (
    <div style={{ position: 'relative' }}>
      {/* Toggle button */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={() => { setIsOpen(o => !o); setShowSaveForm(false); }}
          className="btn-ghost"
          style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          📁 我的模板 {localTemplates.length > 0 && <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '10px', padding: '0 6px', fontSize: '0.7rem' }}>{localTemplates.length}</span>}
        </button>
        <button
          type="button"
          onClick={() => { setShowSaveForm(o => !o); setIsOpen(false); setSaveSubject(currentSubject); }}
          className="btn-ghost"
          style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}
        >
          💾 儲存為模板
        </button>
      </div>

      {/* Save Form */}
      {showSaveForm && (
        <div style={{
          position: 'absolute', top: '44px', left: 0, zIndex: 200,
          background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)',
          borderRadius: '16px', boxShadow: 'var(--shadow-lg)', padding: '20px', width: '320px',
          animation: 'fadeInScale 0.15s ease-out',
        }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '16px' }}>💾 儲存為模板</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder="模板名稱（必填）"
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', background: 'var(--bg-main)', color: 'var(--text-main)' }}
            />
            <input
              value={saveSubject}
              onChange={e => setSaveSubject(e.target.value)}
              placeholder="預設主旨（選填）"
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', background: 'var(--bg-main)', color: 'var(--text-main)' }}
            />
            {isAdminOrManager && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={saveShared}
                  onChange={e => setSaveShared(e.target.checked)}
                />
                <span>共用給所有成員</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: '#fef3c7', padding: '1px 6px', borderRadius: '6px' }}>管理員</span>
              </label>
            )}
            {saveError && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: 0 }}>{saveError}</p>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => setShowSaveForm(false)} className="btn-ghost" style={{ flex: 1, fontSize: '0.85rem' }}>取消</button>
              <button type="button" onClick={handleSave} disabled={isPending} className="btn-primary" style={{ flex: 2, fontSize: '0.85rem' }}>
                {isPending ? '儲存中...' : '確認儲存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template List */}
      {isOpen && (
        <div style={{
          position: 'absolute', top: '44px', left: 0, zIndex: 200,
          background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)',
          borderRadius: '16px', boxShadow: 'var(--shadow-lg)', padding: '16px', width: '340px',
          maxHeight: '400px', overflowY: 'auto',
          animation: 'fadeInScale 0.15s ease-out',
        }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '12px' }}>📁 選擇模板套用</h4>

          {localTemplates.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>尚無儲存的模板</p>
          )}

          {myTemplates.length > 0 && (
            <>
              <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>我的模板</p>
              {myTemplates.map(tpl => (
                <TemplateRow key={tpl.id} tpl={tpl} currentUserId={currentUserId} isAdminOrManager={isAdminOrManager} onApply={handleApply} onDelete={handleDelete} isPending={isPending} />
              ))}
            </>
          )}

          {sharedTemplates.length > 0 && (
            <>
              <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', marginTop: myTemplates.length > 0 ? '16px' : 0 }}>共用模板</p>
              {sharedTemplates.map(tpl => (
                <TemplateRow key={tpl.id} tpl={tpl} currentUserId={currentUserId} isAdminOrManager={isAdminOrManager} onApply={handleApply} onDelete={handleDelete} isPending={isPending} />
              ))}
            </>
          )}
        </div>
      )}

      {/* Overlay to close */}
      {(isOpen || showSaveForm) && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 199 }}
          onClick={() => { setIsOpen(false); setShowSaveForm(false); }}
        />
      )}
    </div>
  );
}

function TemplateRow({ tpl, currentUserId, isAdminOrManager, onApply, onDelete, isPending }: {
  tpl: Template;
  currentUserId: string;
  isAdminOrManager: boolean;
  onApply: (t: Template) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  const canDelete = tpl.createdById === currentUserId || isAdminOrManager;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '10px 12px', borderRadius: '10px', marginBottom: '6px',
      border: '1px solid var(--border-color)', background: 'var(--bg-main)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {tpl.name}
          {tpl.isShared && <span style={{ marginLeft: '6px', fontSize: '0.65rem', background: '#dbeafe', color: '#1d4ed8', padding: '1px 5px', borderRadius: '4px' }}>共用</span>}
        </div>
        {tpl.subject && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tpl.subject}</div>}
      </div>
      <button
        type="button"
        onClick={() => onApply(tpl)}
        style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        套用
      </button>
      {canDelete && (
        <button
          type="button"
          onClick={() => onDelete(tpl.id)}
          disabled={isPending}
          style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
        >
          🗑
        </button>
      )}
    </div>
  );
}
