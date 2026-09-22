'use client';

import React, { useState, useEffect } from 'react';
import { getSetting, updateSetting } from '@/app/actions/settings';

export default function SSOPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    provider: 'Azure AD',
    clientId: '',
    clientSecret: '',
    tenantId: '',
    enabled: false
  });

  useEffect(() => {
    async function load() {
      const saved = await getSetting('SSO_CONFIG');
      if (saved) {
        try {
          setConfig(JSON.parse(saved));
        } catch (e) {}
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateSetting('SSO_CONFIG', JSON.stringify(config));
    setSaving(false);
    alert('SSO 設定已儲存');
  };

  if (loading) return <div>載入中...</div>;

  return (
    <div style={{ maxWidth: '600px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900 }}>SSO 單一登入配置</h1>
        <p style={{ color: 'var(--text-muted)' }}>整合企業級身分驗證服務 (Azure AD, Google Workspace)</p>
      </header>

      <form onSubmit={handleSave} className="card flex flex-col gap-md">
        <div className="flex items-center justify-between" style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div>
            <p style={{ fontWeight: 700, color: 'var(--text-main)' }}>啟用 SSO 登入</p>
            <p style={{ fontSize: '0.8rem' }}>啟用後，登入頁面將顯示 SSO 選項</p>
          </div>
          <input 
            type="checkbox" 
            checked={config.enabled}
            onChange={e => setConfig({...config, enabled: e.target.checked})}
            style={{ width: '20px', height: '20px' }}
          />
        </div>

        <div className="flex flex-col gap-sm">
          <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>服務提供商 (Provider)</label>
          <select 
            value={config.provider}
            onChange={e => setConfig({...config, provider: e.target.value})}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
          >
            <option>Azure AD (Microsoft Entra)</option>
            <option>Google Workspace</option>
            <option>Okta</option>
          </select>
        </div>

        <div className="flex flex-col gap-sm">
          <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>Client ID</label>
          <input 
            type="text" 
            value={config.clientId}
            onChange={e => setConfig({...config, clientId: e.target.value})}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
          />
        </div>

        <div className="flex flex-col gap-sm">
          <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>Client Secret</label>
          <input 
            type="password" 
            value={config.clientSecret}
            onChange={e => setConfig({...config, clientSecret: e.target.value})}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
          />
        </div>

        <div className="flex flex-col gap-sm">
          <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>Tenant ID (選填)</label>
          <input 
            type="text" 
            value={config.tenantId}
            onChange={e => setConfig({...config, tenantId: e.target.value})}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
          />
        </div>

        <button type="submit" disabled={saving} className="btn-primary" style={{ marginTop: '12px' }}>
          {saving ? '儲存中...' : '儲存 SSO 設定'}
        </button>
      </form>
    </div>
  );
}
