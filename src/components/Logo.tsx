'use client';

import React, { useState, useRef, useEffect } from 'react';

interface LogoProps {
  src?: string;
  className?: string;
}

export default function Logo({ src: initialSrc, className }: LogoProps) {
  const [src, setSrc] = useState(initialSrc || '/logo.png');
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Use useEffect to apply cache busting ONLY on the client to avoid hydration mismatch
  useEffect(() => {
    const getBustedUrl = (url: string) => {
      if (!url || url.startsWith('data:')) return url;
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}t=${new Date().getTime()}`;
    };

    setSrc(getBustedUrl(initialSrc || '/logo.png'));
  }, [initialSrc]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsModalOpen(false);
      }
    }
    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModalOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (!event.target?.result) return;

      // Compress image via canvas before storing (max 400px wide, quality 0.85)
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_W = 400;
        const ratio = Math.min(1, MAX_W / img.width);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png', 0.85);

        // Update UI immediately
        setSrc(dataUrl);
        setIsModalOpen(false);

        // Persist to DB
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'updateLogo', dataUrl }),
        });
        const result = await res.json();
        if (!result?.success) {
          alert(`儲存 Logo 失敗：${result?.error || '未知錯誤'}`);
        }
      };
      img.src = event.target.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div 
      className={className} 
      style={{ 
        position: 'relative',
        width: '100%',
        padding: '0'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ position: 'relative', width: '100%', display: 'block' }}>
         <div style={{
           width: '100%',
           position: 'relative',
           aspectRatio: '16/9', 
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           overflow: 'hidden',
           borderRadius: '8px',
           background: isHovered ? '#f1f5f9' : 'transparent',
           transition: 'var(--transition)'
         }}>
           <img 
             src={src} 
             alt="CRM Logo" 
             style={{ 
               width: '100%',
               height: '100%',
               objectFit: 'contain', 
               transition: 'var(--transition)'
             }}
           />
           
           {isHovered && (
             <div 
               onClick={() => setIsModalOpen(true)}
               style={{
                 position: 'absolute',
                 top: 0, left: 0, right: 0, bottom: 0,
                 background: 'rgba(37, 99, 235, 0.05)',
                 cursor: 'pointer',
                 zIndex: 10
               }}
               title="點擊更換 Logo"
             ></div>
           )}
         </div>
      </div>

      {isModalOpen && (
        <div 
          ref={modalRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            width: '100%',
            minWidth: '220px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            border: '1px solid var(--border-color)',
            padding: '20px',
            zIndex: 1000,
            marginTop: '10px',
            animation: 'fadeInScale 0.2s ease-out'
          }}
        >
          <h3 style={{ fontSize: '0.9rem', marginBottom: '12px', fontWeight: '700' }}>更換企業標誌</h3>
          <div style={{ 
            width: '100%', 
            height: '100px', 
            background: '#f8fafc', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '16px',
            border: '2px dashed var(--border-color)'
          }}>
            <img src={src} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary"
            style={{ width: '100%', fontSize: '0.85rem' }}
          >
            上傳新圖片
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  );
}
