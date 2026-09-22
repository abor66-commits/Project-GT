'use client';

import React, { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

interface TagManagerProps {
  companyId: string;
  initialTags: Tag[];
  allTags: Tag[];
}

export default function TagManager({ companyId, initialTags, allTags }: TagManagerProps) {
  const { t } = useTranslation();
  const [currentTags, setCurrentTags] = useState<Tag[]>(initialTags);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Compute fixed position from input element to escape parent overflow clipping.
  // If there's not enough space below (e.g. near the mobile bottom tab bar),
  // the dropdown flips upward instead.
  const updateDropdownPosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const TAB_BAR_HEIGHT = 64; // mobile tab bar + a bit of breathing room
    const DROPDOWN_MAX_HEIGHT = 180;
    const spaceBelow = window.innerHeight - rect.bottom - TAB_BAR_HEIGHT;

    if (spaceBelow < DROPDOWN_MAX_HEIGHT) {
      // Not enough room below → render above the input
      setDropdownStyle({
        position: 'fixed',
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
        width: rect.width,
      });
    } else {
      // Enough room below → render below the input as usual
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    // Recompute position on scroll/resize so dropdown follows the input
    window.addEventListener('scroll', updateDropdownPosition, true);
    window.addEventListener('resize', updateDropdownPosition);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updateDropdownPosition, true);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [updateDropdownPosition]);

  // Tags already applied to this company
  const currentTagIds = new Set(currentTags.map(t => t.id));

  // Filter available (not yet applied) tags by the search input
  const filteredTags = allTags.filter(
    tag => !currentTagIds.has(tag.id) &&
      tag.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Whether the typed text is a brand-new tag (doesn't match existing)
  const isNewTag = inputValue.trim() !== '' &&
    !allTags.some(tag => tag.name.toLowerCase() === inputValue.trim().toLowerCase());

  const addTag = async (name: string) => {
    if (!name.trim() || isPending) return;
    const trimmed = name.trim();

    // Check if an existing tag already has this name
    const existing = allTags.find(t => t.name.toLowerCase() === trimmed.toLowerCase());

    setInputValue('');
    setIsOpen(false);

    startTransition(async () => {
      let tagId: string | null = null;

      if (existing) {
        tagId = existing.id;
      } else {
        // Create a new tag first
        const res = await fetch('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'createTag', name: trimmed }),
        });
        const result = await res.json();
        if (result.success && result.tag) {
          tagId = result.tag.id;
          // Optimistically add to local allTags view is not needed here
        } else {
          alert(result.error || t('tags.add_fail'));
          return;
        }
      }

      if (tagId && !currentTagIds.has(tagId)) {
        await fetch('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'addTag', companyId, tagId }),
        });
        // Optimistic update: add tag to local state
        const addedTag = allTags.find(t => t.id === tagId) ?? { id: tagId, name: trimmed, color: null };
        setCurrentTags(prev => [...prev, addedTag]);
      }
    });
  };

  const removeTag = async (tagId: string) => {
    if (isPending) return;
    setCurrentTags(prev => prev.filter(t => t.id !== tagId));
    startTransition(async () => {
      await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'removeTag', companyId, tagId }),
      });
    });
  };

  return (
    <div style={{ marginTop: '16px' }} ref={containerRef}>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '600' }}>
        {t('tags.title')}
      </p>

      {/* Applied tags */}
      <div className="flex flex-wrap gap-sm" style={{ marginBottom: '10px' }}>
        {currentTags.length > 0 ? currentTags.map(tag => (
          <span
            key={tag.id}
            style={{
              background: tag.color ? `${tag.color}15` : '#f1f5f9',
              color: tag.color || 'var(--text-main)',
              border: `1px solid ${tag.color ? `${tag.color}30` : 'var(--border-color)'}`,
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {tag.name}
            <button
              onClick={() => removeTag(tag.id)}
              disabled={isPending}
              style={{
                background: 'transparent', border: 'none', color: 'inherit',
                cursor: 'pointer', fontSize: '1rem', lineHeight: 1,
                padding: 0, display: 'flex', alignItems: 'center', opacity: 0.6
              }}
            >
              ×
            </button>
          </span>
        )) : (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{t('tags.no_tags')}</p>
        )}
      </div>

      {/* Dropdown input */}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => { setInputValue(e.target.value); setIsOpen(true); }}
          onFocus={() => { updateDropdownPosition(); setIsOpen(true); }}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); if (inputValue.trim()) addTag(inputValue); }
            if (e.key === 'Escape') setIsOpen(false);
          }}
          placeholder={t('tags.add_placeholder')}
          disabled={isPending}
          style={{
            width: '100%',
            padding: '7px 12px',
            borderRadius: '8px',
            border: `1px solid ${isOpen ? 'var(--primary)' : 'var(--border-color)'}`,
            fontSize: '0.82rem',
            background: 'var(--bg-main)',
            color: 'var(--text-main)',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s'
          }}
        />

        {isOpen && (filteredTags.length > 0 || isNewTag) && (
          <div style={{
            ...dropdownStyle,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 9999,
            maxHeight: '180px',
            overflowY: 'auto',
            padding: '6px'
          }}>
            {/* Existing matching tags */}
            {filteredTags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onMouseDown={e => { e.preventDefault(); addTag(tag.name); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '7px 10px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  color: 'var(--text-main)',
                  transition: 'background 0.1s'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-main)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: tag.color || '#94a3b8',
                  flexShrink: 0
                }} />
                {tag.name}
              </button>
            ))}

            {/* Create new tag option */}
            {isNewTag && (
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); addTag(inputValue); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '7px 10px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  transition: 'background 0.1s'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-main)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: '1rem', lineHeight: 1 }}>＋</span>
                {t('tags.create_new').replace('{name}', inputValue.trim())}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
