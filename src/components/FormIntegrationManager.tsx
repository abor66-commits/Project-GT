'use client';

import React, { useState, useTransition } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function FormIntegrationManager({ initialApiKey }: { initialApiKey: string }) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [showKey, setShowKey] = useState(false);
  
  // Copy to clipboard statuses
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [endpointCopied, setEndpointCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const handleCopy = (text: string, setStatus: React.Dispatch<React.SetStateAction<boolean>>) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setStatus(true);
    setTimeout(() => setStatus(false), 2000);
  };

  const generateKey = () => {
    if (apiKey && !confirm(t('marketing.integration.confirm_regen'))) {
      return;
    }
    
    const newKey = 'gcs_mkt_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    startTransition(async () => {
      const res = await fetch('/api/marketing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'updateApiKey', key: newKey }) });
      const result = await res.json();
      if (result.success) {
        setApiKey(newKey);
        setShowKey(true);
      } else {
        alert(t('marketing.integration.error_update'));
      }
    });
  };

  const endpointUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/marketing/lead` : '/api/marketing/lead';

  const codeSnippet = `fetch('${endpointUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${apiKey}'
  },
  body: JSON.stringify({
    companyName: 'Sample Corp',
    contactName: 'John Doe',
    email: 'john@example.com',
    tag: 'Web-Registration'
  })
})`;

  return (
    <div className="card shadow-sm" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>🔌</span> {t('marketing.integration.title')}
      </h2>
      
      <div className="flex flex-col gap-lg" style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
        {/* API Key Management */}
        <div style={{ 
          padding: '20px', 
          background: 'linear-gradient(135deg, var(--bg-hover) 0%, var(--bg-muted) 100%)', 
          borderRadius: '16px', 
          border: '1px solid var(--border-color)',
          width: '100%', 
          maxWidth: '100%', 
          minWidth: 0, 
          boxSizing: 'border-box',
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.02)'
        }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '16px', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🔑 {t('marketing.integration.api_key')}
            </span>
            <button 
              onClick={generateKey} 
              disabled={isPending}
              className="btn-primary" 
              style={{ 
                padding: '6px 14px', 
                fontSize: '0.75rem', 
                flexShrink: 0,
                borderRadius: '20px',
                background: apiKey ? 'var(--danger)' : 'var(--primary)',
                boxShadow: 'var(--shadow)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              {apiKey ? t('marketing.integration.regenerate') : t('marketing.integration.generate')}
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, width: '100%', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flex: 1, minWidth: '200px', position: 'relative', alignItems: 'center' }}>
              <input 
                type={showKey ? 'text' : 'password'} 
                value={apiKey || t('marketing.integration.no_key')} 
                readOnly 
                style={{ 
                  width: '100%',
                  padding: '12px 40px 12px 12px', 
                  borderRadius: '10px', 
                  border: '1px solid var(--border-color)', 
                  background: 'var(--bg-sidebar)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              />
              <button 
                onClick={() => setShowKey(!showKey)}
                style={{ 
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  padding: 0,
                  opacity: 0.7
                }}
              >
                {showKey ? '👁️' : '🔒'}
              </button>
            </div>
            
            {apiKey && (
              <button 
                className="btn-ghost" 
                onClick={() => handleCopy(apiKey, setApiKeyCopied)}
                style={{ 
                  padding: '11px 16px', 
                  borderRadius: '10px', 
                  fontSize: '0.8rem',
                  background: apiKeyCopied ? 'var(--accent)' : 'var(--bg-sidebar)',
                  color: apiKeyCopied ? '#fff' : 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  flexShrink: 0,
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.15s ease'
                }}
              >
                {apiKeyCopied ? '✓ Copied' : '📋 Copy'}
              </button>
            )}
          </div>
        </div>
 
        {/* Integration Instructions */}
        <div className="flex flex-col gap-lg" style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
          <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '14px', margin: '4px 0' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '6px' }}>{t('marketing.integration.how_to')}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                {t('marketing.integration.desc')}
              </p>
            </div>
            
            {/* Download Manual */}
            <div className="card flex items-center justify-between" style={{ padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', flexWrap: 'wrap', gap: '16px' }}>
              <div className="flex items-center gap-md">
                <div style={{ padding: '10px', background: '#eff6ff', color: '#3b82f6', borderRadius: '10px', flexShrink: 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '700', margin: '0 0 4px 0' }}>Web-to-Lead 整合說明文件</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>包含完整的 API 參數說明與各程式語言的串接範例 (Markdown格式)</p>
                </div>
              </div>
              <a href="/docs/web_to_lead_integration_guide.md" download className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                下載說明文件
              </a>
            </div>

            {/* Usage Instructions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', margin: '8px 0' }}>
              <div style={{ padding: '20px', background: 'var(--bg-sidebar)', borderRadius: '12px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: '-15px', top: '-15px', fontSize: '80px', opacity: 0.03, fontWeight: '900' }}>1</div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginBottom: '16px', fontSize: '1rem', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)' }}>1</div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>產生授權金鑰</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>點擊上方的「產生新金鑰」並妥善保存，此 API Key 將用於驗證您的所有請求。</p>
              </div>
              <div style={{ padding: '20px', background: 'var(--bg-sidebar)', borderRadius: '12px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: '-15px', top: '-15px', fontSize: '80px', opacity: 0.03, fontWeight: '900' }}>2</div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginBottom: '16px', fontSize: '1rem', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }}>2</div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>設計外部表單</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>在您的官方網站或活動落地頁 (Landing Page) 建立收集潛在客戶資料的表單。</p>
              </div>
              <div style={{ padding: '20px', background: 'var(--bg-sidebar)', borderRadius: '12px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: '-15px', top: '-15px', fontSize: '80px', opacity: 0.03, fontWeight: '900' }}>3</div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginBottom: '16px', fontSize: '1rem', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.2)' }}>3</div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>發送資料至 CRM</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>當使用者送出表單時，透過 POST 請求將資料傳送至下方的 Endpoint 網址，系統會自動建檔。</p>
              </div>
            </div>
            
            {/* Endpoint & Code block */}
            {apiKey && (
              <>
                <div className="flex flex-col gap-sm" style={{ width: '100%', minWidth: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                🌐 {t('marketing.integration.endpoint')}
              </label>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                width: '100%', 
                flexWrap: 'wrap'
              }}>
                <code style={{ 
                  flex: 1,
                  minWidth: '200px',
                  display: 'block',
                  padding: '12px', 
                  background: 'var(--bg-hover)', 
                  borderRadius: '10px', 
                  fontSize: '0.8rem',
                  color: 'var(--primary)',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  overflowWrap: 'anywhere',
                  border: '1px solid var(--border-color)'
                }}>
                  {endpointUrl}
                </code>
                
                <button 
                  className="btn-ghost" 
                  onClick={() => handleCopy(endpointUrl, setEndpointCopied)}
                  style={{ 
                    padding: '11px 16px', 
                    borderRadius: '10px', 
                    fontSize: '0.8rem',
                    background: endpointCopied ? 'var(--accent)' : 'var(--bg-sidebar)',
                    color: endpointCopied ? '#fff' : 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    flexShrink: 0,
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {endpointCopied ? '✓ Copied' : '📋 Copy URL'}
                </button>
              </div>
            </div>
 
            {/* Code example block */}
            <div className="flex flex-col gap-sm" style={{ width: '100%', minWidth: 0 }}>
              <div className="flex justify-between items-center" style={{ width: '100%' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                  💻 {t('marketing.integration.example')}
                </label>
                
                <button
                  onClick={() => handleCopy(codeSnippet, setCodeCopied)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: codeCopied ? 'var(--accent)' : 'var(--primary)',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {codeCopied ? '✓ Copied!' : '📋 Copy Code'}
                </button>
              </div>
              
              {/* Premium Terminal Code Container */}
              <div style={{ width: '100%', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                {/* macOS Terminal style bar */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '12px 16px', 
                  background: '#0f172a', 
                  borderBottom: '1px solid #1e293b' 
                }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>javascript / fetch</span>
                </div>
                
                {/* Code body */}
                <div style={{ width: '100%', overflowX: 'auto', background: '#1e293b' }}>
                  <pre style={{ 
                    padding: '20px', 
                    color: '#f8fafc', 
                    fontSize: '0.75rem',
                    lineHeight: '1.6',
                    whiteSpace: 'pre',
                    wordBreak: 'normal',
                    boxSizing: 'border-box',
                    margin: 0,
                    fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace'
                  }}>
                    {codeSnippet}
                  </pre>
                </div>
              </div>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
