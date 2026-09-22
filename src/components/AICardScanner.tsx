'use client';

import React, { useState, useRef, useEffect } from 'react';
import { checkDomainMatch, saveScannedCard } from '@/app/actions/scanner';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function AICardScanner() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'upload' | 'scanning' | 'confirm' | 'saving' | 'error'>('upload');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [matchResult, setMatchResult] = useState<{ id: string | null; name: string | null; domain: string | null } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);
  const [hasCamera, setHasCamera] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isOpen && step === 'upload' && hasCamera) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } } })
        .then(s => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch((err) => {
          console.warn('Camera not available, falling back to file upload:', err);
          setHasCamera(false);
        });
    }
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [isOpen, step, hasCamera]);

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);
    const cv = canvasRef.current;
    const vd = videoRef.current;
    cv.width = vd.videoWidth;
    cv.height = vd.videoHeight;
    cv.getContext('2d')?.drawImage(vd, 0, 0);
    const base64 = cv.toDataURL('image/jpeg', 0.95);
    handleScanBase64(base64);
  };

  const handleScanBase64 = async (base64Image: string) => {
    setStep('scanning');
    setErrorMessage('');
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

      let res;
      try {
        res = await fetch('/api/ai/recognize-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image }),
          signal: controller.signal
        });
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          throw new Error(t('scanner.err_timeout'));
        }
        throw new Error(t('scanner.err_network'));
      } finally {
        clearTimeout(timeoutId);
      }

      const result = await res.json();
      
      if (!res.ok || !result.success) {
        throw new Error(result.error || t('scanner.err_parse'));
      }

      const data = result.data;
      const mappedData = {
        name: data.name,
        company: data.companyName,
        email: data.email,
        phone: data.phone,
        jobTitle: data.jobTitle,
      };
      
      setParsedData(mappedData);
      
      const match = await checkDomainMatch(mappedData.email);
      setMatchResult(match);
      
      setStep('confirm');
    } catch (error: any) {
      setErrorMessage(error.message);
      setStep('error');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      e.target.value = '';
      fileToBase64(file).then(base64 => {
        handleScanBase64(base64);
      }).catch(err => {
        console.error('File conversion error:', err);
      });
    }
  };

  const handleSave = async () => {
    setStep('saving');
    
    const result = await saveScannedCard({
      companyId: matchResult?.id,
      companyName: parsedData.company,
      domain: matchResult?.domain || null,
      contactName: parsedData.name,
      contactEmail: parsedData.email,
      contactPhone: parsedData.phone,
      contactTitle: parsedData.jobTitle,
    });
    
    if (result.success) {
      setIsOpen(false);
      setStep('upload');
      setParsedData(null);
      setMatchResult(null);
    } else {
      alert(result.error);
      setStep('confirm');
    }
  };

  return (
    <>
      <button 
        onClick={() => { setIsOpen(true); setStep('upload'); setHasCamera(true); }}
        className="btn-ghost"
        style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: '600' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
        {t('scanner.scan_btn')}
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: (step === 'upload' && hasCamera) ? '500px' : '400px', width: '100%', transition: 'max-width 0.4s ease' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '16px' }}>{t('scanner.title')}</h2>
            
            {step === 'upload' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {hasCamera ? (
                  <div style={{ position: 'relative', height: isLandscape ? '220px' : '380px', background: '#000', borderRadius: '16px', overflow: 'hidden', transition: 'height 0.3s ease' }}>
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
                        onClick={() => fileInputRef.current?.click()}
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
                        title={t('scanner.album')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                      </button>
                      <button type="button" aria-label="拍照快門" onClick={capture} style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'white', border: '4px solid rgba(255,255,255,0.4)', cursor: 'pointer' }} />
                      <div style={{ width: '38px' }} />
                    </div>
                  </div>
                ) : (
                  <div 
                    style={{ 
                      border: '2px dashed var(--border-color)', 
                      borderRadius: '12px', 
                      padding: '40px 20px', 
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'var(--bg-card-custom, var(--bg-card))'
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                    <p style={{ fontWeight: '600' }}>{t('scanner.upload_hint')}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('scanner.upload_format')}</p>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={onFileChange}
                />
              </div>
            )}

            {step === 'scanning' && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ fontWeight: '600', color: 'var(--primary)' }}>{t('scanner.parsing')}</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {step === 'error' && (
              <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#dc2626', marginBottom: '8px' }}>{t('scanner.error_title')}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                  {errorMessage}
                </p>
                <button 
                  onClick={() => setStep('upload')}
                  className="btn-primary"
                  style={{ padding: '10px 24px', width: '100%' }}
                >
                  {t('scanner.retry_btn')}
                </button>
              </div>
            )}

            {step === 'confirm' && parsedData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* 網域比對結果 Badge */}
                {matchResult?.id ? (
                  <div style={{ background: 'color-mix(in srgb, var(--primary) 15%, transparent)', padding: '12px', borderRadius: '8px', border: '1px solid var(--primary)' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '4px' }}>{t('scanner.match_success').replace('{domain}', matchResult.domain || '')}</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{t('scanner.match_existing').replace('{name}', matchResult.name || '')}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{t('scanner.match_hint')}</p>
                  </div>
                ) : (
                  <div style={{ background: 'var(--bg-card-custom, var(--bg-card))', padding: '12px', borderRadius: '8px', border: 'var(--card-border-custom, 1px solid var(--border-color))' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted-custom, var(--text-muted))', fontWeight: '700', marginBottom: '4px' }}>{t('scanner.create_new')}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted-custom, var(--text-muted))' }}>{t('scanner.create_new_hint').replace('{domain}', matchResult?.domain || 'N/A')}</p>
                  </div>
                )}

                <div style={{ background: 'var(--bg-card-custom, var(--bg-card))', border: 'var(--card-border-custom, 1px solid var(--border-color))', borderRadius: '8px', padding: '16px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted-custom, var(--text-muted))', fontWeight: '700', marginBottom: '8px' }}>{t('scanner.preview')}</p>
                  <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted-custom, var(--text-muted))' }}>{t('scanner.name')}</span>
                      <span style={{ fontWeight: '600' }}>{parsedData.name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted-custom, var(--text-muted))' }}>{t('scanner.job_title')}</span>
                      <span style={{ fontWeight: '600' }}>{parsedData.jobTitle}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted-custom, var(--text-muted))' }}>{t('scanner.company')}</span>
                      <span style={{ fontWeight: '600' }}>{parsedData.company}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted-custom, var(--text-muted))' }}>{t('scanner.email')}</span>
                      <span style={{ fontWeight: '600' }}>{parsedData.email}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted-custom, var(--text-muted))' }}>{t('scanner.phone')}</span>
                      <span style={{ fontWeight: '600' }}>{parsedData.phone}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button 
                    onClick={() => { setStep('upload'); setParsedData(null); }}
                    className="btn-ghost"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '10px' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                    {t('scanner.rescan_btn')}
                  </button>
                  <button 
                    onClick={handleSave}
                    className="btn-primary"
                    style={{ flex: 1, padding: '10px' }}
                  >
                    {t('scanner.confirm_btn')}
                  </button>
                </div>
              </div>
            )}

            {step === 'saving' && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ fontWeight: '600', color: 'var(--primary)' }}>{t('scanner.saving')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
