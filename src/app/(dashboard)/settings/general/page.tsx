'use client';

import React, { useState, useEffect } from 'react';
import { getSetting, updateSetting } from '@/app/actions/settings';

export default function GeneralSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [platformUrl, setPlatformUrl] = useState('');
  const [aiProvider, setAiProvider] = useState('gemini');

  useEffect(() => {
    async function load() {
      const [url, aiProv] = await Promise.all([
        getSetting('PLATFORM_URL'),
        getSetting('AI_PROVIDER')
      ]);
      setPlatformUrl(url || window.location.origin);
      setAiProvider(aiProv || 'gemini');
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await Promise.all([
      updateSetting('PLATFORM_URL', platformUrl),
      updateSetting('AI_PROVIDER', aiProvider)
    ]);
    setSaving(false);
    alert('✅ 系統參數已更新');
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>載入中...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '8px' }}>系統參數設定</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>配置平台基礎運行參數與全域 URL</p>
      </header>

      <div className="card" style={{ padding: '32px' }}>
        <form onSubmit={handleSave} className="flex flex-col gap-lg">
          <div className="flex flex-col gap-sm">
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>平台基礎 URL (Platform Base URL)</label>
            <input 
              type="url" 
              placeholder="https://gcscrm.up.railway.app"
              value={platformUrl}
              onChange={e => setPlatformUrl(e.target.value)}
              style={{ 
                padding: '14px', 
                borderRadius: '10px', 
                border: '1px solid var(--border-color)', 
                background: 'var(--bg-main)', 
                color: 'var(--text-main)', 
                fontSize: '1rem' 
              }}
              required
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              * 此 URL 將用於生成郵件中的邀請鏈接與驗證碼連結。
            </p>
          </div>

          <div style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#1e40af', marginBottom: '8px', fontWeight: 700 }}>為什麼需要設定此項？</h4>
            <ul style={{ fontSize: '0.85rem', color: '#3b82f6', paddingLeft: '20px', lineHeight: '1.6' }}>
              <li>確保從不同環境（開發/生產）發送的郵件連結正確無誤。</li>
              <li>支援自定義網域綁定。</li>
              <li>提供雙重驗證 (2FA) 流程的基礎跳轉路徑。</li>
            </ul>
          </div>
          
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '16px 0' }} />

          <div className="flex flex-col gap-sm">
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>預設 AI 應用來源</label>
            <select 
              value={aiProvider}
              onChange={e => setAiProvider(e.target.value)}
              style={{ 
                padding: '14px', 
                borderRadius: '10px', 
                border: '1px solid var(--border-color)', 
                background: 'var(--bg-main)', 
                color: 'var(--text-main)', 
                fontSize: '1rem' 
              }}
            >
              <option value="gemini">Google Gemini (預設)</option>
              <option value="openai">OpenAI ChatGPT (需設定 OPENAI_API_KEY)</option>
            </select>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              * 切換後將影響系統所有 AI 功能（例如名片辨識）所使用的底層模型。API Key 請於 `.env` 檔案中設定。
            </p>
          </div>

          <button type="submit" disabled={saving} className="btn-primary" style={{ marginTop: '12px', padding: '16px', fontSize: '1.1rem' }}>
            {saving ? '儲存中...' : '更新系統參數'}
          </button>
        </form>
      </div>
    </div>
  );
}
