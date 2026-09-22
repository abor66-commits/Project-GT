'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

const FIELD_META = {
  name:     { color: '#3b82f6' },
  jobTitle: { color: '#8b5cf6' },
  email:    { color: '#10b981' },
  phone:    { color: '#f59e0b' },
} as const;

type Stage = 'form' | 'camera' | 'analyzing' | 'reviewing';

export default function AddContactModal({ companyId }: { companyId: string }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const getMetaLabel = (field: string) => {
    switch(field) {
      case 'name': return t('scanner.name');
      case 'jobTitle': return t('scanner.job_title');
      case 'email': return t('scanner.email');
      case 'phone': return t('scanner.phone');
      default: return '';
    }
  };

  const STAGE_TITLE: Record<Stage, string> = {
    form: t('contact.modal.title' as any), 
    camera: t('contact.modal.camera_title' as any),
    analyzing: t('contact.modal.analyzing_title' as any), 
    reviewing: t('contact.modal.review_title' as any)
  };
  const STAGE_HINT: Record<Stage, string> = {
    form: t('contact.modal.hint' as any),
    camera: t('contact.modal.camera_hint' as any),
    analyzing: t('contact.modal.analyzing_hint' as any),
    reviewing: t('contact.modal.review_hint' as any),
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stage, setStage] = useState<Stage>('form');
  const [showFlash, setShowFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', jobTitle: '', companyId, isPrimary: false });
  const [scannedData, setScannedData] = useState({ name: '', email: '', phone: '', jobTitle: '' });
  const [isLandscape, setIsLandscape] = useState(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (stage === 'camera') {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } } })
        .then(s => { stream = s; if (videoRef.current) videoRef.current.srcObject = s; })
        .catch(() => { setError(t('companies.modal.camera_error' as any)); setStage('form'); });
    }
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, [stage]);

  // Enter key to capture
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (stage === 'camera' && e.key === 'Enter') { e.preventDefault(); handleCapture(); } };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [stage]);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setShowFlash(true); setTimeout(() => setShowFlash(false), 150);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(base64);
    startAnalysis(base64);
  };

  const startAnalysis = async (base64Image: string) => {
    setStage('analyzing');
    try {
      const response = await fetch('/api/ai/recognize-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });
      const result = await response.json();
      if (result.success && result.data) {
        setScannedData(prev => ({
          ...prev,
          name: result.data.name || '',
          jobTitle: result.data.jobTitle || '',
          email: result.data.email || '',
          phone: result.data.phone || '',
        }));
      } else {
        console.error('AI Recognition failed:', result.error);
        alert(t('scanner.err_parse') + ': ' + (result.error || t('scanner.err_unknown')));
      }
    } catch (err: any) {
      console.error('API call failed:', err);
      alert(t('scanner.err_network') + ': ' + (err.message || ''));
    } finally {
      setStage('reviewing');
    }
  };

  const triggerAlbumSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d')?.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.95);
        setCapturedImage(base64);
        startAnalysis(base64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const applyScannedData = () => { setFormData(p => ({ ...p, ...scannedData })); setStage('form'); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true); setError(null);
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...formData }),
    });
    const result = await res.json();
    if (result.success) { setIsOpen(false); setStage('form'); setFormData({ name: '', email: '', phone: '', jobTitle: '', companyId, isPrimary: false }); }
    else setError(result.error || t('common.error'));
    setIsSubmitting(false);
  };

  return (
    <>
      <button onClick={() => { setIsOpen(true); setStage('form'); }} className="btn-ghost" style={{ fontSize: '0.85rem' }}>{t('contact.add_btn')}</button>

      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', width: 'calc(100% - 32px)', margin: '16px', maxWidth: '450px', borderRadius: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', padding: '24px', maxHeight: '92vh', overflowY: 'auto', transition: 'max-width 0.4s ease' }}>

            <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '900' }}>{STAGE_TITLE[stage]}</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{STAGE_HINT[stage]}</p>
              </div>
              <div className="flex gap-md items-center">
                {stage === 'form' && <button onClick={() => setStage('camera')} style={{ display: 'flex', alignItems: 'center', background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  {t('companies.modal.scan_btn' as any)}
                </button>}
                {stage !== 'form' && <button onClick={() => setStage('form')} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>}
              </div>
            </div>

            {stage === 'camera' && (
              <div className="flex flex-col gap-md">
                <div style={{ position: 'relative', height: isLandscape ? '240px' : '380px', background: '#000', borderRadius: '16px', overflow: 'hidden', transition: 'height 0.3s ease' }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  {showFlash && <div style={{ position: 'absolute', inset: 0, background: 'white', zIndex: 30 }} />}
                  <button type="button" onClick={() => setIsLandscape(!isLandscape)} style={{ display: 'flex', alignItems: 'center', position: 'absolute', top: '12px', right: '12px', zIndex: 20, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', backdropFilter: 'blur(4px)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                    {isLandscape ? t('companies.modal.toggle_portrait' as any) : t('companies.modal.toggle_landscape' as any)}
                  </button>
                  <div style={{ position: 'absolute', bottom: '20px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', zIndex: 20 }}>
                    <button 
                      type="button"
                      onClick={triggerAlbumSelect}
                      style={{ 
                        width: '38px', 
                        height: '38px', 
                        borderRadius: '50%', 
                        background: 'rgba(0,0,0,0.6)', 
                        border: 'none', 
                        color: 'white', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(4px)'
                      }}
                      title={t('scanner.album' as any)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    </button>
                    <button onClick={handleCapture} style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'white', border: '4px solid rgba(255,255,255,0.4)', cursor: 'pointer' }} />
                    <div style={{ width: '38px' }} />
                  </div>
                </div>
              </div>
            )}

            {/* ANALYZING */}
            {stage === 'analyzing' && (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div className="spinner" style={{ margin: '0 auto 20px' }} />
                <p style={{ fontWeight: '700' }}>{t('contact.modal.analyzing_detail' as any)}</p>
              </div>
            )}

            {/* REVIEWING */}
            {stage === 'reviewing' && (
              <div className="flex flex-col gap-md">
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                  {(['name', 'jobTitle', 'email', 'phone'] as const).map(k => (
                    <div key={k} className="flex items-center gap-md" style={{ marginBottom: '10px' }}>
                      <div style={{ width: '10px', height: '10px', background: FIELD_META[k].color, borderRadius: '2px', flexShrink: 0 }} />
                      <span style={{ width: '52px', fontSize: '0.8rem', fontWeight: '700', color: FIELD_META[k].color }}>{getMetaLabel(k)}</span>
                      <input type="text" value={scannedData[k]} onChange={e => setScannedData(p => ({ ...p, [k]: e.target.value }))} style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: `1px solid ${FIELD_META[k].color}66`, fontSize: '0.85rem' }} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-md">
                  <button onClick={() => setStage('camera')} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                    {t('companies.modal.rescan_btn' as any)}
                  </button>
                  <button onClick={applyScannedData} className="btn-primary" style={{ flex: 2, background: 'var(--accent)' }}>{t('companies.modal.apply_btn' as any)}</button>
                </div>
              </div>
            )}

            {/* FORM */}
            {stage === 'form' && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-md">
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder={t('scanner.name') + ' *'} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                <input type="text" value={formData.jobTitle} onChange={e => setFormData({...formData, jobTitle: e.target.value})} placeholder={t('scanner.job_title')} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder={t('scanner.email')} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder={t('scanner.phone')} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                <label className="flex items-center gap-md" style={{ fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={formData.isPrimary} onChange={e => setFormData({...formData, isPrimary: e.target.checked})} /> {t('contact.primary')}
                </label>
                {error && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</p>}
                <div className="flex gap-md">
                  <button type="button" onClick={() => setIsOpen(false)} className="btn-ghost" style={{ flex: 1 }}>{t('common.cancel')}</button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 2 }}>{isSubmitting ? t('contact.saving') : t('contact.save')}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
      />
    </>
  );
}

declare global { interface Window { Tesseract: any; } }
