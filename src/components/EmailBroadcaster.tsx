'use client';

import React, { useState, useTransition, useMemo } from 'react';

import RichEDMEditor from './RichEDMEditor';
import TemplateManager from './TemplateManager';
import EdmSettingsPanel from './EdmSettingsPanel';
import EdmPreviewModal from './EdmPreviewModal';
import BroadcastAnalytics from './BroadcastAnalytics';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { defaultEdmSettings, EdmSettings, composeEdmHtml } from '@/lib/edm/composeEdm';

interface Tag {
  id: string;
  name: string;
}

interface Template {
  id: string;
  name: string;
  subject?: string | null;
  content: string;
  isShared: boolean;
  createdById: string;
  createdAt: Date | string;
}

interface Props {
  allTags: Tag[];
  templates: Template[];
  currentUserId: string;
  userRole: string;
}

export default function EmailBroadcaster({ allTags, templates, currentUserId, userRole }: Props) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'compose' | 'analytics'>('compose');
  const [lastCampaignId, setLastCampaignId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedTag, setSelectedTag] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [edmSettings, setEdmSettings] = useState<EdmSettings>(defaultEdmSettings);
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Compose full EDM HTML (memoized — recomputes on content/settings change)
  const edmHtml = useMemo(
    () => composeEdmHtml(content, edmSettings),
    [content, edmSettings]
  );

  const handleSend = () => {
    if (!selectedTag || !subject || !content) {
      alert(t('marketing.broadcaster.form_error'));
      return;
    }

    if (!confirm(t('marketing.broadcaster.confirm').replace('{tag}', selectedTag))) {
      return;
    }

    setStatus(null);
    startTransition(async () => {
      const res = await fetch('/api/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendBroadcast',
          tagName: selectedTag,
          subject,
          // Send full composed EDM HTML
          content: edmHtml,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setStatus({ type: 'success', message: result.message || t('marketing.broadcaster.send_success') });
        if (result.campaignId) {
          setLastCampaignId(result.campaignId);
        }
        setSubject('');
        setContent('');
        setEdmSettings(defaultEdmSettings);
      } else {
        setStatus({ type: 'error', message: result.error || t('marketing.broadcaster.send_failed') });
      }
    });
  };

  return (
    <>
      {/* ── Main Feature Tabs ── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('compose')}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            fontSize: '0.95rem',
            fontWeight: '700',
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'compose' ? 'var(--primary)' : 'color-mix(in srgb, var(--text-main) 6%, transparent)',
            color: activeTab === 'compose' ? 'white' : 'var(--text-main)',
            boxShadow: activeTab === 'compose' ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          {t('marketing.broadcaster.tab_compose')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            fontSize: '0.95rem',
            fontWeight: '700',
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'analytics' ? 'var(--primary)' : 'color-mix(in srgb, var(--text-main) 6%, transparent)',
            color: activeTab === 'analytics' ? 'white' : 'var(--text-main)',
            boxShadow: activeTab === 'analytics' ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          {t('marketing.broadcaster.tab_analytics')}
        </button>
      </div>

      {activeTab === 'analytics' ? (
        <BroadcastAnalytics
          initialCampaignId={lastCampaignId}
          onSelectCampaign={setLastCampaignId}
        />
      ) : (
        <div className="card shadow-sm">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '24px', fontWeight: '700' }}>
            {t('marketing.broadcaster.title')}
          </h2>

        <div className="flex flex-col gap-md">
          {/* ── Segment & Subject ── */}
          <div className="flex flex-col gap-sm">
            <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>{t('marketing.broadcaster.tag_select')}</label>
            <select
              id="broadcaster-tag-select"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              style={{
                padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none',
              }}
            >
              <option value="">{t('marketing.broadcaster.tag_placeholder')}</option>
              {allTags.map(tag => (
                <option key={tag.id} value={tag.name}>{tag.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-sm">
            <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>{t('marketing.broadcaster.subject')}</label>
            <input
              id="broadcaster-subject-input"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('marketing.broadcaster.subject_placeholder')}
              style={{
                padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none',
              }}
            />
          </div>

          {/* ── Content area: settings toggle + editor ── */}
          <div className="flex flex-col gap-sm">
            {/* Toolbar row: label / TemplateManager / Settings toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>{t('marketing.broadcaster.content')}</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <TemplateManager
                  templates={templates}
                  currentUserId={currentUserId}
                  userRole={userRole}
                  currentContent={content}
                  currentSubject={subject}
                  onApply={(tplContent, tplSubject) => {
                    setContent(tplContent);
                    if (tplSubject) setSubject(tplSubject);
                  }}
                />
                {/* EDM Settings toggle button */}
                <button
                  type="button"
                  onClick={() => setShowSettings(v => !v)}
                  className="btn-ghost"
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    borderRadius: '6px',
                    border: showSettings ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    color: showSettings ? 'var(--primary)' : 'var(--text-muted)',
                    background: showSettings ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  ⚙️ {t('marketing.edm.settings_title')}
                </button>
              </div>
            </div>

            {/* Two-column layout: Settings panel (collapsible) + Editor */}
            <div style={{
              display: 'grid',
              // On desktop: settings sidebar (240px) + editor (1fr), hidden on mobile
              gridTemplateColumns: showSettings ? '240px 1fr' : '1fr',
              gap: '16px',
              alignItems: 'start',
            }}>
              {/* EDM Settings Panel — hidden on mobile via media query class */}
              {showSettings && (
                <div
                  className="edm-settings-sidebar"
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '16px',
                    background: 'var(--bg-muted)',
                    position: 'sticky',
                    top: '80px',
                  }}
                >
                  <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('marketing.edm.settings_title')}
                  </p>
                  <EdmSettingsPanel settings={edmSettings} onChange={setEdmSettings} />
                </div>
              )}

              {/* Rich Editor */}
              <div>
                <RichEDMEditor content={content} onChange={setContent} />
              </div>
            </div>
          </div>

          {/* ── Status message ── */}
          {status && (
            <div style={{
              padding: '12px 16px', borderRadius: '8px',
              background: status.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: status.type === 'success' ? '#166534' : '#991b1b',
              fontSize: '0.9rem', fontWeight: '500',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              gap: '12px', flexWrap: 'wrap',
            }}>
              <span>✅ {status.message}</span>
              {status.type === 'success' && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('analytics')}
                    style={{
                      background: '#166534',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>📊</span>
                    <span>{t('marketing.broadcaster.view_analytics_btn')}</span>
                  </button>
                  <a
                    href="/marketing/history"
                    style={{ fontSize: '0.85rem', fontWeight: '700', color: '#166534', textDecoration: 'underline', whiteSpace: 'nowrap' }}
                  >
                    查看發送紀錄 →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ── Action buttons ── */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
            {/* Preview button */}
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="btn-secondary"
              style={{ padding: '14px 20px', borderRadius: '8px', fontWeight: '600' }}
            >
              🔍 預覽 EDM
            </button>

            {/* Send button */}
            <button
              id="broadcaster-send-btn"
              type="button"
              onClick={handleSend}
              disabled={isPending}
              className="btn-primary"
              style={{ padding: '14px', borderRadius: '8px', fontWeight: '700', flex: 1, minWidth: '160px' }}
            >
              {isPending ? t('marketing.broadcaster.sending') : t('marketing.broadcaster.send_now')}
            </button>
          </div>
        </div>
      </div>
      )}

      {/* ── EDM Preview Modal ── */}
      {showPreview && (
        <EdmPreviewModal edmHtml={edmHtml} onClose={() => setShowPreview(false)} />
      )}

      {/* Hide settings sidebar on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .edm-settings-sidebar { display: none !important; }
        }
      `}</style>
    </>
  );
}
