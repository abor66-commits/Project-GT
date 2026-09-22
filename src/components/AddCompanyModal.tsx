'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface SalesUser { id: string; name: string; }
const REGIONS_META = [
  { field: 'companyName', label: '公司名稱', color: '#3b82f6' },
  { field: 'contactName', label: '聯絡人',   color: '#8b5cf6' },
  { field: 'contactTitle',label: '職稱',     color: '#ec4899' },
  { field: 'website',     label: '網站',     color: '#10b981' },
  { field: 'contactEmail',label: 'Email',    color: '#f59e0b' },
  { field: 'contactPhone',label: '電話',     color: '#ef4444' },
];

export default function AddCompanyModal({ salesUsers, currentUserId, fab }: { salesUsers: SalesUser[], currentUserId?: string, fab?: boolean }) {
  const { t } = useTranslation();
  
  const getMetaLabel = (field: string) => {
    switch(field) {
      case 'companyName': return t('companies.table.name');
      case 'contactName': return t('scanner.name');
      case 'contactTitle': return t('scanner.job_title');
      case 'website': return t('companies.modal.website' as any);
      case 'contactEmail': return t('scanner.email');
      case 'contactPhone': return t('scanner.phone');
      default: return '';
    }
  };
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stage, setStage] = useState<Stage>('form');
  const [showFlash, setShowFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
type Stage = 'form' | 'camera' | 'analyzing' | 'reviewing';

  const [capturedImage, setCapturedImage] = useState('');
  const [scanned, setScanned] = useState<Record<string,string>>({});
  const [isLandscape, setIsLandscape] = useState(true);
  const [formData, setFormData] = useState({
    name:'', website:'', industry:'SaaS', region:'台灣', platform:'AWS',
    sizeScale:'1-50', ownerId: currentUserId || salesUsers[0]?.id || '',
    contactName:'', contactEmail:'', contactPhone:'', contactTitle:'',
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    let stream: MediaStream | null = null;
    if (stage === 'camera') {
      navigator.mediaDevices.getUserMedia({ video: { facingMode:'environment', width:{ideal:1280} } })
        .then(s => { stream = s; if (videoRef.current) videoRef.current.srcObject = s; })
        .catch(() => { setError(t('companies.modal.camera_error' as any)); setStage('form'); });
    }
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, [stage]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (stage==='camera' && e.key==='Enter') { e.preventDefault(); capture(); } };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [stage]);

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setShowFlash(true); setTimeout(() => setShowFlash(false), 150);
    const cv = canvasRef.current, vd = videoRef.current;
    cv.width = vd.videoWidth; cv.height = vd.videoHeight;
    cv.getContext('2d')?.drawImage(vd, 0, 0);
    const base64 = cv.toDataURL('image/jpeg', 0.95);
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
        const res = result.data;
        setScanned({
          companyName: res.companyName || '',
          website: res.website || '',
          contactName: res.name || '',
          contactTitle: res.jobTitle || '',
          contactEmail: res.email || '',
          contactPhone: res.phone || '',
        });
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
      const base64 = event.target?.result as string;
      if (base64) {
        setCapturedImage(base64);
        startAnalysis(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const apply = () => {
    setFormData(p => ({ ...p, name:scanned.companyName||p.name, website:scanned.website||p.website,
      contactName:scanned.contactName||'', contactTitle:scanned.contactTitle||'',
      contactEmail:scanned.contactEmail||'', contactPhone:scanned.contactPhone||'' }));
    setStage('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true); setError(null);
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...formData }),
    });
    const result = await res.json();
    if (result.success) { setIsOpen(false); setStage('form'); setFormData({ name:'', website:'', industry:'SaaS', region:'台灣', platform:'AWS', sizeScale:'1-50', ownerId:currentUserId||salesUsers[0]?.id||'', contactName:'', contactEmail:'', contactPhone:'', contactTitle:'' }); }
    else setError(result.error || t('common.error'));
    setIsSubmitting(false);
  };

  const TITLES: Record<Stage,string> = { 
    form: t('companies.modal.add_title' as any), 
    camera: t('companies.modal.scan_title' as any), 
    analyzing: t('companies.modal.analyzing_title' as any), 
    reviewing: t('companies.modal.review_title' as any) 
  };
  const HINTS: Record<Stage,string> = { 
    form: t('companies.modal.add_subtitle' as any), 
    camera: t('companies.modal.scan_hint' as any), 
    analyzing: t('companies.modal.analyzing_hint' as any), 
    reviewing: t('companies.modal.review_hint' as any) 
  };

  return (
    <>
      {fab ? (
        <button className="fab" onClick={() => { setIsOpen(true); setStage('form'); }} aria-label={t('companies.add_btn')}>+</button>
      ) : (
        <button onClick={() => { setIsOpen(true); setStage('form'); }} className="btn-primary">{t('companies.add_btn')}</button>
      )}
      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: stage==='camera' ? '680px' : '500px', transition: 'max-width 0.4s ease' }}>
            <div className="flex justify-between items-center" style={{ marginBottom:'24px' }}>
              <div>
                <h2 style={{ fontSize:'1.5rem', fontWeight:'900' }}>{TITLES[stage]}</h2>
                <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:'2px' }}>{HINTS[stage]}</p>
              </div>
              <div className="flex gap-md items-center">
                {stage==='form' && <button onClick={() => setStage('camera')} style={{ display:'flex', alignItems:'center', background:'var(--primary-light)', color:'var(--primary)', border:'none', padding:'10px 20px', borderRadius:'14px', cursor:'pointer', fontWeight:'800' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  {t('companies.modal.scan_btn' as any)}
                </button>}
                {stage!=='form' && <button onClick={() => setStage('form')} style={{ background:'#f1f5f9', border:'none', width:'36px', height:'36px', borderRadius:'50%', cursor:'pointer', fontSize:'1.2rem' }}>&times;</button>}
              </div>
            </div>

            {stage==='camera' && (
              <div className="flex flex-col gap-md">
                <div style={{ position:'relative', height: isLandscape ? '260px' : '480px', background:'#000', borderRadius:'20px', overflow:'hidden', transition: 'height 0.3s ease' }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  <canvas ref={canvasRef} style={{ display:'none' }} />
                  {showFlash && <div style={{ position:'absolute', inset:0, background:'white', zIndex:30 }} />}
                  <button type="button" onClick={() => setIsLandscape(!isLandscape)} style={{ display:'flex', alignItems:'center', position: 'absolute', top: '16px', right: '16px', zIndex: 20, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', backdropFilter: 'blur(4px)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                    {isLandscape ? t('companies.modal.toggle_portrait' as any) : t('companies.modal.toggle_landscape' as any)}
                  </button>
                  <div style={{ position:'absolute', bottom:'28px', width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'40px', zIndex:20 }}>
                    <button 
                      type="button"
                      onClick={triggerAlbumSelect}
                      style={{ 
                        width:'44px', 
                        height:'44px', 
                        borderRadius:'50%', 
                        background:'rgba(0,0,0,0.6)', 
                        border:'none', 
                        color:'white', 
                        cursor:'pointer',
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'center',
                        backdropFilter: 'blur(4px)'
                      }}
                      title={t('scanner.album' as any)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    </button>
                    <button aria-label="拍照快門" onClick={capture} style={{ width:'64px', height:'64px', borderRadius:'50%', background:'white', border:'5px solid rgba(255,255,255,0.4)', cursor:'pointer' }} />
                    <div style={{ width:'44px' }} />
                  </div>
                </div>
              </div>
            )}


            {stage==='analyzing' && (
              <div style={{ textAlign:'center', padding:'48px 0' }}>
                <div className="spinner" style={{ margin:'0 auto 20px' }} />
                <p style={{ fontWeight:'700' }}>{t('scanner.parsing')}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>{t('companies.modal.analyzing_hint' as any)}</p>
              </div>
            )}

            {stage==='reviewing' && (
              <div className="flex flex-col gap-lg">
                <div className="form-grid-2col">
                  <div style={{ background:'#f8fafc', padding:'16px', borderRadius:'12px' }}>
                    <p style={{ fontSize:'0.8rem', fontWeight:'800', color:'var(--primary)', marginBottom:'12px' }}>{t('companies.modal.company_info' as any)}</p>
                    {['companyName','website'].map(k => { const m = REGIONS_META.find(r=>r.field===k)!; return (
                      <div key={k} className="flex items-center gap-sm" style={{ marginBottom:'10px' }}>
                        <div style={{ width:'8px', height:'8px', background:m.color, borderRadius:'2px', flexShrink:0 }} />
                        <span style={{ width:'56px', fontSize:'0.75rem', fontWeight:'700' }}>{getMetaLabel(m.field)}</span>
                        <input type="text" value={scanned[k]||''} onChange={e => setScanned(p=>({...p,[k]:e.target.value}))} style={{ flex:1, padding:'6px 8px', borderRadius:'6px', border:`1px solid ${m.color}55`, fontSize:'0.8rem' }} />
                      </div>
                    ); })}
                  </div>
                  <div style={{ background:'#f0fdf4', padding:'16px', borderRadius:'12px' }}>
                    <p style={{ fontSize:'0.8rem', fontWeight:'800', color:'#16a34a', marginBottom:'12px' }}>{t('companies.modal.contact_info' as any)}</p>
                    {['contactName','contactTitle','contactEmail','contactPhone'].map(k => { const m = REGIONS_META.find(r=>r.field===k)!; return (
                      <div key={k} className="flex items-center gap-sm" style={{ marginBottom:'10px' }}>
                        <div style={{ width:'8px', height:'8px', background:m.color, borderRadius:'2px', flexShrink:0 }} />
                        <span style={{ width:'48px', fontSize:'0.75rem', fontWeight:'700' }}>{getMetaLabel(m.field)}</span>
                        <input type="text" value={scanned[k]||''} onChange={e => setScanned(p=>({...p,[k]:e.target.value}))} style={{ flex:1, padding:'6px 8px', borderRadius:'6px', border:`1px solid ${m.color}55`, fontSize:'0.8rem' }} />
                      </div>
                    ); })}
                  </div>
                </div>
                <div className="flex gap-md">
                  <button onClick={() => setStage('camera')} className="btn-ghost" style={{ display:'flex', alignItems:'center', justifyContent:'center', flex:1 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                    {t('companies.modal.rescan_btn' as any)}
                  </button>
                  <button onClick={apply} className="btn-primary" style={{ flex:2, background:'var(--accent)' }}>{t('companies.modal.apply_btn' as any)}</button>
                </div>
              </div>
            )}

            {stage==='form' && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
                <div className="form-grid-2col" style={{ gap:'20px' }}>
                  <div className="flex flex-col gap-md">
                    <h3 style={{ fontSize:'0.85rem', color:'var(--primary)', fontWeight:'800' }}>{t('companies.modal.company_info' as any)}</h3>
                    <div><label style={{ fontSize:'0.85rem', fontWeight:'600' }}>{t('companies.modal.company_name' as any)}</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData,name:e.target.value})} style={{ width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid var(--border-color)' }} /></div>
                    <div><label style={{ fontSize:'0.85rem', fontWeight:'600' }}>{t('companies.modal.website' as any)}</label><input type="text" value={formData.website} onChange={e => setFormData({...formData,website:e.target.value})} style={{ width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid var(--border-color)' }} /></div>
                    <div><label style={{ fontSize:'0.85rem', fontWeight:'600' }}>{t('companies.modal.owner' as any)}</label>
                      <select required value={formData.ownerId} onChange={e => setFormData({...formData,ownerId:e.target.value})} style={{ width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid var(--border-color)' }}>
                        {salesUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                    <div><label style={{ fontSize:'0.85rem', fontWeight:'600' }}>{t('companies.modal.platform' as any)}</label>
                      <select required value={formData.platform} onChange={e => setFormData({...formData,platform:e.target.value})} style={{ width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid var(--border-color)' }}>
                        <option value="AWS">AWS</option>
                        <option value="GCP">GCP</option>
                        <option value="Multi-Cloud">Multi-Cloud</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-md" style={{ background:'#f8fafc', padding:'16px', borderRadius:'12px' }}>
                    <h3 style={{ fontSize:'0.85rem', fontWeight:'800' }}>{t('companies.modal.contact_info' as any)}</h3>
                    <div><label style={{ fontSize:'0.8rem' }}>{t('companies.modal.contact_name' as any)}</label><input type="text" value={formData.contactName} onChange={e => setFormData({...formData,contactName:e.target.value})} style={{ width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid var(--border-color)' }} /></div>
                    <div><label style={{ fontSize:'0.8rem' }}>{t('companies.modal.contact_title' as any)}</label><input type="text" value={formData.contactTitle} onChange={e => setFormData({...formData,contactTitle:e.target.value})} style={{ width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid var(--border-color)' }} /></div>
                    <div><label style={{ fontSize:'0.8rem' }}>{t('companies.modal.contact_email' as any)}</label><input type="text" value={formData.contactEmail} onChange={e => setFormData({...formData,contactEmail:e.target.value})} style={{ width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid var(--border-color)' }} /></div>
                  </div>
                </div>
                {error && <p style={{ color:'#ef4444', fontSize:'0.85rem' }}>{error}</p>}
                <div className="flex gap-md">
                  <button type="button" onClick={() => setIsOpen(false)} className="btn-ghost" style={{ flex:1 }}>{t('common.cancel')}</button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex:2 }}>{isSubmitting ? t('companies.modal.creating' as any) : t('companies.modal.create_confirm' as any)}</button>
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
