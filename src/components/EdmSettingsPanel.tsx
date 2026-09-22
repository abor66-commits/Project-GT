'use client';

import React, { useState } from 'react';
import { EdmSettings } from '@/lib/edm/composeEdm';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface Props {
  settings: EdmSettings;
  onChange: (settings: EdmSettings) => void;
}

function SectionHeader({ label, expanded, onToggle }: { label: string; expanded: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        width: '100%', padding: '10px 0', border: 'none', background: 'transparent',
        cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-main)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      {label}
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▼</span>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border-color)',
  background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.82rem', outline: 'none',
  width: '100%', boxSizing: 'border-box',
};

export default function EdmSettingsPanel({ settings, onChange }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState({ header: true, banner: false, cta: false, footer: false });

  const set = <K extends keyof EdmSettings>(key: K, value: EdmSettings[K]) =>
    onChange({ ...settings, [key]: value });

  const toggle = (section: keyof typeof open) =>
    setOpen(prev => ({ ...prev, [section]: !prev[section] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '12px' }}>
        <SectionHeader label={`🎨 ${t('marketing.edm.section_header')}`} expanded={open.header} onToggle={() => toggle('header')} />
        {open.header && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px' }}>
            <Field label={t('marketing.edm.header_title')}>
              <input
                type="text"
                value={settings.headerTitle}
                onChange={e => set('headerTitle', e.target.value)}
                placeholder={t('marketing.edm.header_title_placeholder')}
                style={inputStyle}
              />
            </Field>
            <Field label={t('marketing.edm.header_bg_color')}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={settings.headerBgColor}
                  onChange={e => set('headerBgColor', e.target.value)}
                  style={{ width: '36px', height: '30px', borderRadius: '4px', border: '1px solid var(--border-color)', padding: '1px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={settings.headerBgColor}
                  onChange={e => set('headerBgColor', e.target.value)}
                  style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }}
                />
              </div>
            </Field>
          </div>
        )}
      </div>

      {/* ── Banner ── */}
      <div style={{ marginBottom: '12px' }}>
        <SectionHeader label={`🖼 ${t('marketing.edm.section_banner')}`} expanded={open.banner} onToggle={() => toggle('banner')} />
        {open.banner && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.bannerEnabled}
                onChange={e => set('bannerEnabled', e.target.checked)}
                style={{ width: '14px', height: '14px' }}
              />
              {t('marketing.edm.banner_enable')}
            </label>
            {settings.bannerEnabled && (
              <>
                <Field label={t('marketing.edm.banner_url')}>
                  <input
                    type="url"
                    value={settings.bannerImageUrl}
                    onChange={e => set('bannerImageUrl', e.target.value)}
                    placeholder="https://..."
                    style={inputStyle}
                  />
                </Field>
                <Field label={t('marketing.edm.banner_alt')}>
                  <input
                    type="text"
                    value={settings.bannerAltText}
                    onChange={e => set('bannerAltText', e.target.value)}
                    placeholder={t('marketing.edm.banner_alt_placeholder')}
                    style={inputStyle}
                  />
                </Field>
                {settings.bannerImageUrl && (
                  <img
                    src={settings.bannerImageUrl}
                    alt="banner preview"
                    style={{ width: '100%', borderRadius: '6px', border: '1px solid var(--border-color)', maxHeight: '80px', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── CTA ── */}
      <div style={{ marginBottom: '12px' }}>
        <SectionHeader label={`🔘 ${t('marketing.edm.section_cta')}`} expanded={open.cta} onToggle={() => toggle('cta')} />
        {open.cta && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.ctaEnabled}
                onChange={e => set('ctaEnabled', e.target.checked)}
                style={{ width: '14px', height: '14px' }}
              />
              {t('marketing.edm.cta_enable')}
            </label>
            {settings.ctaEnabled && (
              <>
                <Field label={t('marketing.edm.cta_label')}>
                  <input
                    type="text"
                    value={settings.ctaLabel}
                    onChange={e => set('ctaLabel', e.target.value)}
                    placeholder={t('marketing.edm.cta_label_placeholder')}
                    style={inputStyle}
                  />
                </Field>
                <Field label={t('marketing.edm.cta_url')}>
                  <input
                    type="url"
                    value={settings.ctaUrl}
                    onChange={e => set('ctaUrl', e.target.value)}
                    placeholder="https://..."
                    style={inputStyle}
                  />
                </Field>
                <Field label={t('marketing.edm.cta_bg_color')}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={settings.ctaBgColor}
                      onChange={e => set('ctaBgColor', e.target.value)}
                      style={{ width: '36px', height: '30px', borderRadius: '4px', border: '1px solid var(--border-color)', padding: '1px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={settings.ctaBgColor}
                      onChange={e => set('ctaBgColor', e.target.value)}
                      style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }}
                    />
                  </div>
                </Field>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{ marginBottom: '12px' }}>
        <SectionHeader label={`📄 ${t('marketing.edm.section_footer')}`} expanded={open.footer} onToggle={() => toggle('footer')} />
        {open.footer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.footerEnabled}
                onChange={e => set('footerEnabled', e.target.checked)}
                style={{ width: '14px', height: '14px' }}
              />
              {t('marketing.edm.footer_enable')}
            </label>
            {settings.footerEnabled && (
              <Field label={t('marketing.edm.footer_text')}>
                <textarea
                  value={settings.footerText}
                  onChange={e => set('footerText', e.target.value)}
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
                />
              </Field>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
