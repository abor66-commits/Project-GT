'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function GlobalSearch() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    companies: any[];
    contacts: any[];
    opportunities: any[];
    tags: any[];
  } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard Shortcuts (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsFocused(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim()) {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          setResults(data);
          setIsOpen(true);
        } catch {
          // silently ignore network errors
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults(null);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const flattenedResults = results ? [
    ...results.companies.map(c => ({ ...c, type: 'company', label: t('search.type.company'), icon: '🏢' })),
    ...results.contacts.map(c => ({ ...c, type: 'contact', label: t('search.type.contact'), icon: '👤', sub: c.company?.name })),
    ...results.opportunities.map(o => ({ ...o, type: 'opportunity', label: t('search.type.opportunity'), icon: '💰', sub: o.company?.name })),
    ...results.tags.map(tag => ({ ...tag, type: 'tag', label: t('search.type.tag'), icon: '🏷️', sub: `${tag._count?.companies ?? 0} ${t('search.clients_suffix')}` }))
  ] : [];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex(prev => Math.min(prev + 1, flattenedResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      const item = flattenedResults[selectedIndex];
      navigateTo(item);
    }
  };

  const navigateTo = (item: any) => {
    setIsOpen(false);
    setIsFocused(false);
    setQuery('');
    if (item.type === 'company') router.push(`/companies/${item.id}`);
    else if (item.type === 'contact') router.push(`/companies/${item.companyId || item.id}`);
    else if (item.type === 'opportunity') router.push(`/opportunities`);
    else if (item.type === 'tag') router.push(`/companies?tag=${encodeURIComponent(item.name)}`);
  };

  return (
    <div ref={searchRef} className={`global-search-wrapper ${isFocused ? 'is-focused' : ''}`} style={{ position: 'relative', zIndex: isFocused ? 1200 : 100 }}>
      {isFocused && (
        <div 
          className="search-backdrop" 
          onClick={(e) => {
            e.stopPropagation();
            setIsFocused(false);
            setIsOpen(false);
            setQuery('');
          }}
        />
      )}
      
      {isFocused && (
        <button 
          type="button"
          className="mobile-search-back-btn"
          onClick={(e) => {
            e.stopPropagation();
            setIsFocused(false);
            setIsOpen(false);
            setQuery('');
          }}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.4rem',
            cursor: 'pointer',
            color: 'var(--text-main)',
            marginRight: '12px',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
            padding: '4px'
          }}
        >
          ←
        </button>
      )}
      
      <div 
        className="search-input-container"
        onClick={() => {
          setIsFocused(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          background: 'var(--bg-hover)', 
          padding: '8px 16px', 
          borderRadius: '20px',
          border: (isOpen || isFocused) ? '2px solid var(--primary)' : '2px solid transparent',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          width: '100%',
          overflow: 'hidden'
        }}
      >
        <span style={{ color: 'var(--text-muted)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isLoading ? (
            <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', borderColor: 'var(--text-muted)', borderTopColor: 'transparent' }}></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          )}
        </span>
        <input 
          ref={inputRef}
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          placeholder={t('common.search')} 
          style={{ 
            background: 'transparent', 
            border: 'none', 
            outline: 'none', 
            width: '100%', 
            fontSize: '0.9rem',
            color: 'var(--text-main)',
            opacity: isFocused ? 1 : 0,
            transition: 'opacity 0.2s',
            pointerEvents: isFocused ? 'auto' : 'none'
          }} 
        />
        {isFocused && query && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setQuery('');
              inputRef.current?.focus();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            ✕
          </button>
        )}
        <span className="search-shortcut" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px', flexShrink: 0, display: isFocused ? 'none' : 'block' }}>⌘ K</span>
      </div>

      <style jsx>{`
        .global-search-wrapper {
          width: 400px;
          display: flex;
          align-items: center;
          transition: all 0.3s ease;
        }
        @media (max-width: 768px) {
          .global-search-wrapper {
            width: 36px;
            height: 36px;
            justify-content: center;
          }
          
          /* Circular icon container when collapsed on mobile */
          .global-search-wrapper:not(.is-focused) .search-input-container {
            padding: 0 !important;
            width: 36px !important;
            height: 36px !important;
            justify-content: center !important;
            border-radius: 50% !important;
            background: var(--bg-hover) !important;
            border: none !important;
            gap: 0 !important;
          }
          
          .global-search-wrapper:not(.is-focused) .search-shortcut {
            display: none !important;
          }
          
          /* Full screen header overlay search with smooth slide-down and fade */
          .global-search-wrapper.is-focused {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 56px !important;
            background: var(--bg-sidebar) !important;
            display: flex !important;
            align-items: center !important;
            padding: 0 16px !important;
            z-index: 2000 !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            animation: slideDownMobileSearch 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }

          @keyframes slideDownMobileSearch {
            from {
              transform: translateY(-56px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes fadeInBackdrop {
            from {
              opacity: 0;
              backdrop-filter: blur(0px);
            }
            to {
              opacity: 1;
              backdrop-filter: blur(8px);
            }
          }

          .search-backdrop {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(15, 23, 42, 0.35);
            z-index: 1900;
            animation: fadeInBackdrop 0.25s ease-out forwards;
          }

          .mobile-search-back-btn {
            display: flex !important;
            z-index: 2010;
          }

          .global-search-wrapper.is-focused .search-input-container {
            flex: 1 !important;
            border-radius: 20px !important;
            background: var(--bg-hover) !important;
            padding: 8px 16px !important;
            height: 40px !important;
            border: 1px solid var(--border-color) !important;
            z-index: 2010;
          }
          
          .global-search-wrapper.is-focused :global(.search-results-popup) {
            position: fixed !important;
            top: 56px !important;
            left: 0 !important;
            right: 0 !important;
            width: 100vw !important;
            border-radius: 0 0 16px 16px !important;
            border-left: none !important;
            border-right: none !important;
            max-height: calc(100vh - 56px) !important;
            box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
            z-index: 2010 !important;
            animation: slideUpPopup 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }

          @keyframes slideUpPopup {
            from {
              transform: translateY(10px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          .global-search-wrapper.is-focused :global(.search-no-results-popup) {
            position: fixed !important;
            top: 56px !important;
            left: 0 !important;
            right: 0 !important;
            width: 100vw !important;
            border-radius: 0 0 16px 16px !important;
            border-left: none !important;
            border-right: none !important;
            box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
            z-index: 2010 !important;
            animation: slideUpPopup 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        }
      `}</style>

      {isOpen && flattenedResults.length > 0 && (
        <div className="search-results-popup" style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: 'var(--bg-sidebar)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-color)',
          zIndex: 1000,
          overflow: 'hidden',
          padding: '8px 0'
        }}>
          {flattenedResults.map((item, index) => (
            <div 
              key={`${item.type}-${item.id}`}
              onClick={() => navigateTo(item)}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                background: selectedIndex === index ? 'var(--bg-hover)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderLeft: selectedIndex === index ? '4px solid var(--primary)' : '4px solid transparent'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>{item.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {item.label} {item.sub ? `• ${item.sub}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && flattenedResults.length === 0 && query.trim() !== '' && !isLoading && (
        <div className="search-no-results-popup" style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: 'var(--bg-sidebar)',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-color)',
          zIndex: 1000
        }}>
          {t('search.no_results').replace('{query}', query)}
        </div>
      )}
    </div>
  );
}
