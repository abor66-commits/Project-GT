'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AboutModal from './AboutModal';
import AppearanceModal, { loadSavedSkin } from './AppearanceModal';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface User {
  name: string;
  email: string;
  role: string;
}

export default function UserMenu({ user }: { user: User | null }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Load theme preferences
  useEffect(() => {
    loadSavedSkin();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '36px', 
          height: '36px', 
          borderRadius: '50%', 
          background: 'var(--primary)', 
          color: 'white', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontWeight: '700',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)',
          transition: 'var(--transition)',
          userSelect: 'none'
        }}
        className="avatar-hover"
      >
        {user.name.charAt(0).toUpperCase()}
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '48px',
          right: '0',
          width: '220px',
          background: 'var(--bg-card-custom, var(--bg-card))',
          borderRadius: '12px',
          boxShadow: 'var(--shadow, 0 10px 25px rgba(0,0,0,0.1))',
          border: 'var(--card-border-custom, 1px solid var(--border-color))',
          backdropFilter: 'var(--glass-blur, none)',
          padding: '8px',
          zIndex: 1000,
          animation: 'fadeInScale 0.2s ease-out'
        }}>
          <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main-custom, var(--text-main))' }}>{user.name}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted-custom, var(--text-muted))' }}>{user.email}</p>
            <span style={{ 
              display: 'inline-block', 
              marginTop: '4px',
              padding: '2px 8px', 
              borderRadius: '4px', 
              fontSize: '0.65rem', 
              fontWeight: '700',
              background: user.role === 'MANAGER' ? '#fef2f2' : user.role === 'MARKETING' ? '#fdf4ff' : '#eff6ff',
              color: user.role === 'MANAGER' ? '#ef4444' : user.role === 'MARKETING' ? '#c026d3' : '#2563eb'
            }}>{user.role}</span>
          </div>
          
          <Link 
            href="/profile" 
            onClick={() => setIsOpen(false)}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              padding: '10px 12px', 
              borderRadius: '8px', 
              textDecoration: 'none', 
              color: 'var(--text-main-custom, var(--text-main))',
              fontSize: '0.9rem',
              gap: '10px'
            }}
            className="dropdown-item-hover"
          >
            {t('nav.profile')}
          </Link>

          <div 
            onClick={() => { setIsAppearanceOpen(true); setIsOpen(false); }}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              padding: '10px 12px', 
              borderRadius: '8px', 
              color: 'var(--text-main-custom, var(--text-main))',
              fontSize: '0.9rem',
              cursor: 'pointer',
              gap: '10px'
            }}
            className="dropdown-item-hover"
          >
            {t('appearance.title')}
          </div>

          <div 
            onClick={() => { setIsAboutOpen(true); setIsOpen(false); }}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              padding: '10px 12px', 
              borderRadius: '8px', 
              color: 'var(--text-main-custom, var(--text-main))',
              fontSize: '0.9rem',
              cursor: 'pointer',
              gap: '10px'
            }}
            className="dropdown-item-hover"
          >
            {t('nav.about')}
          </div>
          
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }}></div>

          <button
              type="button"
              onClick={handleLogout}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                padding: '10px 12px', 
                borderRadius: '8px', 
                border: 'none',
                background: 'transparent',
                width: '100%',
                textAlign: 'left',
                color: '#ef4444',
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontWeight: '600',
                gap: '10px'
              }}
              className="dropdown-item-hover-danger"
            >
              {t('nav.logout')}
            </button>
        </div>
      )}

      {isAboutOpen && <AboutModal onClose={() => setIsAboutOpen(false)} />}
      {isAppearanceOpen && <AppearanceModal onClose={() => setIsAppearanceOpen(false)} />}
    </div>
  );
}
