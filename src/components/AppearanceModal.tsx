'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export interface SkinSettings {
  primary: string;
  primaryHover: string;
  radius: string;
  shadowType: 'flat' | 'floating' | 'neumorphic';
  glassmorphism: boolean;
  iconWeight: string;
  iconLinecap: 'round' | 'square';
  bgBodyColor?: string;
  bgBodyTexture?: string;
  textMainCustom?: string;
  textMutedCustom?: string;
  cardBorderCustom?: string;
  cardBgCustom?: string;
  btnPrimaryShadow?: string;
  tabBarBgCustom?: string;
  tabBarBorderCustom?: string;
  tabBarShadowCustom?: string;
}

const PRESET_SKINS = {
  classic: { // Elegant Earth
    primary: '#8c5a35',
    primaryHover: '#70482a',
    radius: '16px',
    shadowType: 'floating',
    glassmorphism: false,
    iconWeight: '2.5px',
    iconLinecap: 'round',
    bgBodyColor: '#f4ede4',
    bgBodyTexture: 'none',
    textMainCustom: '#4a3b32',
    textMutedCustom: '#8c7a6b',
    cardBorderCustom: '1px solid #e8decb',
    cardBgCustom: '#fffdf9',
    btnPrimaryShadow: 'none',
    tabBarBgCustom: '#fffdf9',
    tabBarBorderCustom: '1px solid #e8decb',
    tabBarShadowCustom: '0 -4px 12px rgba(140, 90, 53, 0.08)'
  } as SkinSettings,
  digital: { // Cyber Neon
    primary: '#0ff',
    primaryHover: '#0cc',
    radius: '0px',
    shadowType: 'flat',
    glassmorphism: false,
    iconWeight: '1.5px',
    iconLinecap: 'square',
    bgBodyColor: '#0a0f16',
    bgBodyTexture: 'linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px)',
    textMainCustom: '#e2f1f8',
    textMutedCustom: '#8eb4c0',
    cardBorderCustom: '1px solid rgba(0, 255, 255, 0.5)',
    cardBgCustom: 'rgba(10, 15, 22, 0.8)',
    btnPrimaryShadow: '0 0 10px rgba(0, 255, 255, 0.6)',
    tabBarBgCustom: 'rgba(10, 15, 22, 0.95)',
    tabBarBorderCustom: '1px solid rgba(0, 255, 255, 0.5)',
    tabBarShadowCustom: '0 -4px 20px rgba(0, 255, 255, 0.15)'
  } as SkinSettings,
  soft: { // Soft Neumorphism
    primary: '#1e3a8a',
    primaryHover: '#1e40af',
    radius: '24px',
    shadowType: 'neumorphic',
    glassmorphism: false,
    iconWeight: '2.5px',
    iconLinecap: 'round',
    bgBodyColor: '#e0e5ec',
    bgBodyTexture: 'none',
    textMainCustom: '#2d3748',
    textMutedCustom: '#718096',
    cardBorderCustom: 'none',
    cardBgCustom: '#e0e5ec',
    btnPrimaryShadow: '5px 5px 10px #a3b1c6, -5px -5px 10px #ffffff',
    tabBarBgCustom: '#e0e5ec',
    tabBarBorderCustom: 'none',
    tabBarShadowCustom: 'none'
  } as SkinSettings
};

// Expose standard application logic for skins
export function applySkin(settings: SkinSettings) {
  const root = document.documentElement;
  root.style.setProperty('--primary', settings.primary);
  root.style.setProperty('--primary-hover', settings.primaryHover);
  root.style.setProperty('--radius', settings.radius);
  root.style.setProperty('--icon-weight', settings.iconWeight);
  root.style.setProperty('--icon-linecap', settings.iconLinecap);
  root.style.setProperty('--icon-linejoin', settings.iconLinecap === 'round' ? 'round' : 'miter');

  // Advanced Skin Parameters
  if (settings.bgBodyColor) root.style.setProperty('--bg-body-color', settings.bgBodyColor);
  else root.style.removeProperty('--bg-body-color');

  if (settings.bgBodyTexture) {
    root.style.setProperty('--bg-body-texture', settings.bgBodyTexture);
    if (settings.bgBodyTexture.includes('linear-gradient')) {
      root.style.setProperty('background-size', '20px 20px');
    } else {
      root.style.removeProperty('background-size');
    }
  } else {
    root.style.removeProperty('--bg-body-texture');
    root.style.removeProperty('background-size');
  }

  if (settings.textMainCustom) root.style.setProperty('--text-main-custom', settings.textMainCustom);
  else root.style.removeProperty('--text-main-custom');

  if (settings.textMutedCustom) root.style.setProperty('--text-muted-custom', settings.textMutedCustom);
  else root.style.removeProperty('--text-muted-custom');

  if (settings.cardBorderCustom) root.style.setProperty('--card-border-custom', settings.cardBorderCustom);
  else root.style.removeProperty('--card-border-custom');

  if (settings.cardBgCustom) root.style.setProperty('--bg-card-custom', settings.cardBgCustom);
  else root.style.removeProperty('--bg-card-custom');

  if (settings.btnPrimaryShadow) root.style.setProperty('--btn-primary-shadow', settings.btnPrimaryShadow);
  else root.style.removeProperty('--btn-primary-shadow');

  if (settings.tabBarBgCustom) root.style.setProperty('--tab-bar-bg-custom', settings.tabBarBgCustom);
  else root.style.removeProperty('--tab-bar-bg-custom');

  if (settings.tabBarBorderCustom) root.style.setProperty('--tab-bar-border-custom', settings.tabBarBorderCustom);
  else root.style.removeProperty('--tab-bar-border-custom');

  if (settings.tabBarShadowCustom) root.style.setProperty('--tab-bar-shadow-custom', settings.tabBarShadowCustom);
  else root.style.removeProperty('--tab-bar-shadow-custom');
  
  // Handle shadows
  if (settings.shadowType === 'flat') {
    root.style.setProperty('--shadow', 'none');
    root.style.setProperty('--shadow-lg', 'none');
  } else if (settings.shadowType === 'neumorphic') {
    const isDark = document.documentElement.classList.contains('dark');
    if (settings.bgBodyColor === '#e0e5ec') {
      root.style.setProperty('--shadow', '5px 5px 10px #a3b1c6, -5px -5px 10px #ffffff');
      root.style.setProperty('--shadow-lg', '8px 8px 16px #a3b1c6, -8px -8px 16px #ffffff');
    } else if (isDark) {
      root.style.setProperty('--shadow', '5px 5px 10px #151d29, -5px -5px 10px #27354d');
      root.style.setProperty('--shadow-lg', '8px 8px 16px #151d29, -8px -8px 16px #27354d');
    } else {
      root.style.setProperty('--shadow', '5px 5px 10px #d1d5db, -5px -5px 10px #ffffff');
      root.style.setProperty('--shadow-lg', '8px 8px 16px #d1d5db, -8px -8px 16px #ffffff');
    }
  } else {
    // Floating (default)
    root.style.setProperty('--shadow', '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)');
    root.style.setProperty('--shadow-lg', '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)');
  }

  // Handle glassmorphism
  if (settings.glassmorphism) {
    const isDark = document.documentElement.classList.contains('dark');
    root.style.setProperty('--bg-card-custom', isDark ? 'rgba(30, 41, 59, 0.65)' : 'rgba(255, 255, 255, 0.65)');
    root.style.setProperty('--glass-blur', 'blur(12px)');
  } else {
    // We already removed it above if not using cardBgCustom
    root.style.removeProperty('--glass-blur');
  }

  localStorage.setItem('custom-skin', JSON.stringify(settings));
}

export function loadSavedSkin() {
  const saved = localStorage.getItem('custom-skin');
  if (saved) {
    try {
      applySkin(JSON.parse(saved));
    } catch (e) {}
  }
}

export default function AppearanceModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SkinSettings>(PRESET_SKINS.classic);

  useEffect(() => {
    const saved = localStorage.getItem('custom-skin');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleChange = (newSettings: Partial<SkinSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    applySkin(updated);
  };

  const applyPreset = (presetKey: keyof typeof PRESET_SKINS) => {
    setSettings(PRESET_SKINS[presetKey]);
    applySkin(PRESET_SKINS[presetKey]);
  };

  const resetToSystemDefault = () => {
    localStorage.removeItem('custom-skin');
    window.location.reload();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>{t('appearance.title')}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-muted)' }}>&times;</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Preset Section */}
          <div style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{t('appearance.presets_title')}</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-ghost" onClick={() => applyPreset('classic')} style={{ flex: 1, borderColor: settings.primary === PRESET_SKINS.classic.primary ? 'var(--primary)' : 'var(--border-color)' }}>{t('appearance.preset.classic')}</button>
              <button className="btn-ghost" onClick={() => applyPreset('digital')} style={{ flex: 1, borderColor: settings.primary === PRESET_SKINS.digital.primary ? 'var(--primary)' : 'var(--border-color)' }}>{t('appearance.preset.digital')}</button>
              <button className="btn-ghost" onClick={() => applyPreset('soft')} style={{ flex: 1, borderColor: settings.primary === PRESET_SKINS.soft.primary ? 'var(--primary)' : 'var(--border-color)' }}>{t('appearance.preset.soft')}</button>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1', height: '1px', background: 'var(--border-color)' }}></div>

          {/* Color & Shape */}
          <div>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>{t('appearance.color_shape_title')}</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', fontWeight: '600' }}>{t('appearance.primary_color')}</label>
              <input 
                type="color" 
                value={settings.primary} 
                onChange={e => handleChange({ primary: e.target.value, primaryHover: e.target.value })} // Simplification for hover
                style={{ width: '100%', height: '40px', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', fontWeight: '600' }}>{t('appearance.border_radius')}</label>
              <input 
                type="range" 
                min="0" max="24" step="4" 
                value={parseInt(settings.radius)} 
                onChange={e => handleChange({ radius: `${e.target.value}px` })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>{t('appearance.radius.sharp')}</span>
                <span>{settings.radius}</span>
                <span>{t('appearance.radius.round')}</span>
              </div>
            </div>
          </div>

          {/* Texture & Shadow */}
          <div>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>{t('appearance.texture_shadow_title')}</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', fontWeight: '600' }}>{t('appearance.shadow_type')}</label>
              <select 
                value={settings.shadowType}
                onChange={e => handleChange({ shadowType: e.target.value as any })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
              >
                <option value="flat">{t('appearance.shadow.flat')}</option>
                <option value="floating">{t('appearance.shadow.floating')}</option>
                <option value="neumorphic">{t('appearance.shadow.neumorphic')}</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="checkbox" 
                id="glass-toggle"
                checked={settings.glassmorphism}
                onChange={e => handleChange({ glassmorphism: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              <label htmlFor="glass-toggle" style={{ fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>{t('appearance.glassmorphism')}</label>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1', height: '1px', background: 'var(--border-color)' }}></div>

          {/* Iconography */}
          <div style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>{t('appearance.icon_title')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', fontWeight: '600' }}>{t('appearance.icon_weight')}</label>
                <input 
                  type="range" 
                  min="1" max="3" step="0.5" 
                  value={parseFloat(settings.iconWeight)} 
                  onChange={e => handleChange({ iconWeight: `${e.target.value}px` })}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>{t('appearance.icon_weight.thin')}</span>
                  <span>{settings.iconWeight}</span>
                  <span>{t('appearance.icon_weight.thick')}</span>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', fontWeight: '600' }}>{t('appearance.icon_linecap')}</label>
                <select 
                  value={settings.iconLinecap}
                  onChange={e => handleChange({ iconLinecap: e.target.value as any })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                >
                  <option value="round">{t('appearance.linecap.round')}</option>
                  <option value="square">{t('appearance.linecap.square')}</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={resetToSystemDefault} className="btn-ghost" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>{t('appearance.reset_default')}</button>
          <button onClick={onClose} className="btn-primary">{t('appearance.done')}</button>
        </div>
      </div>
    </div>
  );
}
