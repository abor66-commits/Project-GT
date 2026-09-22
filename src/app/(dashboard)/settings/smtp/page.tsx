'use client';

import React, { useState, useEffect } from 'react';
import { getSetting, updateSetting, testSMTPConnection } from '@/app/actions/settings';

export default function SMTPPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [mode, setMode] = useState<'SMTP' | 'API'>('SMTP');
  
  const [smtpConfig, setSmtpConfig] = useState({
    host: '',
    port: '',
    user: '',
    pass: '',
    from: ''
  });

  const [apiConfig, setApiConfig] = useState({
    url: '',
    key: ''
  });

  useEffect(() => {
    async function load() {
      // Load SMTP Config
      const savedSmtp = await getSetting('SMTP_CONFIG');
      if (savedSmtp) {
        try { setSmtpConfig(JSON.parse(savedSmtp)); } catch (e) {}
      }

      // Load API Config
      const savedUrl = await getSetting('MAIL_API_URL');
      const savedKey = await getSetting('MAIL_API_KEY');
      setApiConfig({ url: savedUrl, key: savedKey });

      // Determine default mode
      if (savedUrl) setMode('API');
      
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Save SMTP
    await updateSetting('SMTP_CONFIG', JSON.stringify(smtpConfig));
    
    // Save API (Clear if in SMTP mode? No, better keep it but decide mode via MAIL_API_URL existence in mail.ts logic)
    // Actually, let's make it explicit.
    if (mode === 'API') {
      await updateSetting('MAIL_API_URL', apiConfig.url);
      await updateSetting('MAIL_API_KEY', apiConfig.key);
    } else {
      await updateSetting('MAIL_API_URL', ''); // Emptying URL disables API mode in mail.ts
      await updateSetting('MAIL_API_KEY', apiConfig.key);
    }
    
    setSaving(false);
    alert('✅ 郵件服務設定已成功儲存');
  };

  const handleTest = async () => {
    if (!testEmail) return alert('請輸入測試收件人的 Email');
    setTesting(true);
    const result = await testSMTPConnection(testEmail);
    setTesting(false);
    if (result.success) {
      alert('🚀 測試郵件已成功寄出，請檢查您的信箱！');
    } else {
      alert(`❌ 寄送失敗: ${result.error || '未知錯誤'}`);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>載入中...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '8px' }}>郵件發送服務設定</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>設定系統如何發送通知、驗證碼與週報郵件</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px', alignItems: 'start' }}>
        <div className="flex flex-col gap-lg">
          {/* Mode Switcher */}
          <div className="card" style={{ padding: '8px', display: 'flex', gap: '8px', background: 'color-mix(in srgb, var(--text-main-custom, var(--text-main)) 5%, transparent)' }}>
            <button 
              onClick={() => setMode('SMTP')}
              style={{ 
                flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                fontWeight: 700, transition: 'all 0.2s',
                background: mode === 'SMTP' ? 'var(--primary)' : 'transparent',
                color: mode === 'SMTP' ? 'white' : 'var(--text-muted)'
              }}
            >
              🌐 標準 SMTP 模式
            </button>
            <button 
              onClick={() => setMode('API')}
              style={{ 
                flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                fontWeight: 700, transition: 'all 0.2s',
                background: mode === 'API' ? 'var(--accent)' : 'transparent',
                color: mode === 'API' ? 'white' : 'var(--text-muted)'
              }}
            >
              ⚡️ Railway API 模式
            </button>
          </div>

          <form onSubmit={handleSave} className="card flex flex-col gap-lg" style={{ padding: '32px' }}>
            {mode === 'SMTP' ? (
              <>
                <div className="flex flex-col gap-sm">
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>SMTP 主機 (Host)</label>
                  <input 
                    type="text" 
                    placeholder="smtp.resend.com"
                    value={smtpConfig.host}
                    onChange={e => setSmtpConfig({...smtpConfig, host: e.target.value})}
                    style={{ padding: '14px', borderRadius: '10px', border: 'var(--card-border-custom, 1px solid var(--border-color))', background: 'var(--bg-card-custom, var(--bg-card))', color: 'var(--text-main-custom, var(--text-main))', fontSize: '1rem' }}
                    required={mode === 'SMTP'}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="flex flex-col gap-sm">
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>連接埠 (Port)</label>
                    <input 
                      type="text" 
                      placeholder="465 或 587"
                      value={smtpConfig.port}
                      onChange={e => setSmtpConfig({...smtpConfig, port: e.target.value})}
                      style={{ padding: '14px', borderRadius: '10px', border: 'var(--card-border-custom, 1px solid var(--border-color))', background: 'var(--bg-card-custom, var(--bg-card))', color: 'var(--text-main-custom, var(--text-main))', fontSize: '1rem' }}
                      required={mode === 'SMTP'}
                    />
                  </div>
                  <div className="flex flex-col gap-sm">
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>發件者郵件 (From)</label>
                    <input 
                      type="text" 
                      placeholder="no-reply@grandtech.com"
                      value={smtpConfig.from}
                      onChange={e => setSmtpConfig({...smtpConfig, from: e.target.value})}
                      style={{ padding: '14px', borderRadius: '10px', border: 'var(--card-border-custom, 1px solid var(--border-color))', background: 'var(--bg-card-custom, var(--bg-card))', color: 'var(--text-main-custom, var(--text-main))', fontSize: '1rem' }}
                      required={mode === 'SMTP'}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-sm">
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>使用者名稱 (Username)</label>
                  <input 
                    type="text" 
                    placeholder="resend"
                    value={smtpConfig.user}
                    onChange={e => setSmtpConfig({...smtpConfig, user: e.target.value})}
                    style={{ padding: '14px', borderRadius: '10px', border: 'var(--card-border-custom, 1px solid var(--border-color))', background: 'var(--bg-card-custom, var(--bg-card))', color: 'var(--text-main-custom, var(--text-main))', fontSize: '1rem' }}
                    required={mode === 'SMTP'}
                  />
                </div>

                <div className="flex flex-col gap-sm">
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>密碼 / API Key (Password)</label>
                  <input 
                    type="password" 
                    placeholder="re_xxxxxxxxxxxxxx"
                    value={smtpConfig.pass}
                    onChange={e => setSmtpConfig({...smtpConfig, pass: e.target.value})}
                    style={{ padding: '14px', borderRadius: '10px', border: 'var(--card-border-custom, 1px solid var(--border-color))', background: 'var(--bg-card-custom, var(--bg-card))', color: 'var(--text-main-custom, var(--text-main))', fontSize: '1rem' }}
                    required={mode === 'SMTP'}
                  />
                </div>
              </>
            ) : (
              <>
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '8px' }}>
                  <p style={{ fontSize: '0.9rem', color: '#059669', fontWeight: 600 }}>
                    💡 API 模式適用於您部署在 Railway 上的 Resend 轉發服務。它比 SMTP 更穩定且支援更高併發。
                  </p>
                </div>
                
                <div className="flex flex-col gap-sm">
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>服務端點 URL (Service URL)</label>
                  <input 
                    type="url" 
                    placeholder="https://resend-template-service.up.railway.app/send"
                    value={apiConfig.url}
                    onChange={e => setApiConfig({...apiConfig, url: e.target.value})}
                    style={{ padding: '14px', borderRadius: '10px', border: 'var(--card-border-custom, 1px solid var(--border-color))', background: 'var(--bg-card-custom, var(--bg-card))', color: 'var(--text-main-custom, var(--text-main))', fontSize: '1rem' }}
                    required={mode === 'API'}
                  />
                </div>

                <div className="flex flex-col gap-sm">
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>服務驗證金鑰 (API Key)</label>
                  <input 
                    type="password" 
                    placeholder="可選的驗證金鑰"
                    value={apiConfig.key}
                    onChange={e => setApiConfig({...apiConfig, key: e.target.value})}
                    style={{ padding: '14px', borderRadius: '10px', border: 'var(--card-border-custom, 1px solid var(--border-color))', background: 'var(--bg-card-custom, var(--bg-card))', color: 'var(--text-main-custom, var(--text-main))', fontSize: '1rem' }}
                  />
                </div>
              </>
            )}

            <button type="submit" disabled={saving} className="btn-primary" style={{ marginTop: '12px', padding: '16px', fontSize: '1.1rem' }}>
              {saving ? '儲存中...' : '儲存所有郵件設定'}
            </button>
          </form>
        </div>

        <div className="card flex flex-col gap-md" style={{ padding: '24px', background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e40af' }}>⚡️ 系統測試</h3>
          <p style={{ fontSize: '0.9rem', color: '#3b82f6', marginBottom: '8px' }}>建議每次更換模式或修改設定後都進行測試。</p>
          <input 
            type="email" 
            placeholder="收件人 Email"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)', marginBottom: '8px' }}
          />
          <button 
            onClick={handleTest} 
            disabled={testing || saving} 
            className="btn-secondary"
            style={{ padding: '14px', width: '100%', borderColor: '#3b82f6', color: '#3b82f6', fontWeight: 800 }}
          >
            {testing ? '寄送測試中...' : '寄送測試郵件'}
          </button>
          
          <div style={{ marginTop: '24px', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '16px' }}>
            <strong>目前使用架構：</strong>
            <p style={{ marginTop: '8px', color: 'var(--text-main)', fontWeight: 600 }}>
              {mode === 'SMTP' ? '🌐 傳統 SMTP 連線' : '⚡️ REST API 轉發'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
