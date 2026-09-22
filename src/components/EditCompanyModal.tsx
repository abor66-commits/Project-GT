'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface Company {
  id: string;
  name: string;
  website: string | null;
  industry: string;
  region: string | null;
  platform: string | null;
  sizeScale: string;
  ownerId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  salesDeputy: string | null;
  owner: { name: string };
  cloudSpendEst: number | null;
  cloudRenewalDate: Date | null;
  technographics: string | null;
  priorityScore: string | null;
}

export default function EditCompanyModal({ company, salesUsers, canEdit, iconOnly = false }: { company: Company, salesUsers: any[], canEdit: boolean, iconOnly?: boolean }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [formData, setFormData] = useState({
    ...company,
    website: company.website || '',
    region: company.region || '',
    platform: company.platform || '',
    cloudSpendEst: company.cloudSpendEst !== null && company.cloudSpendEst !== undefined ? String(company.cloudSpendEst) : '',
    cloudRenewalDate: company.cloudRenewalDate ? new Date(company.cloudRenewalDate).toISOString().substring(0, 10) : '',
    technographics: company.technographics || '',
    priorityScore: company.priorityScore || ''
  });

  if (!canEdit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Only extract the fields we want to update to avoid Prisma errors with relation fields (owner, tags, contacts)
    const { 
      name, website, industry, region, platform, sizeScale, ownerId, status, salesDeputy,
      cloudSpendEst, cloudRenewalDate, technographics, priorityScore
    } = formData;
    
    const updatePayload = {
      name, website, industry, region, platform, sizeScale, ownerId, status, salesDeputy,
      cloudSpendEst: cloudSpendEst ? parseFloat(cloudSpendEst) : null,
      cloudRenewalDate: cloudRenewalDate ? new Date(cloudRenewalDate) : null,
      technographics,
      priorityScore
    };
    
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id: company.id, ...updatePayload }),
    });
    const result = await res.json();
    if (result.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      alert(result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className={iconOnly ? "btn-icon" : "btn-ghost"} 
        style={iconOnly ? { 
          padding: '8px',
          borderRadius: '8px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card-custom, var(--bg-card))',
          cursor: 'pointer'
        } : { padding: '8px 16px', fontSize: '0.9rem' }}
        title={t('common.edit')}
      >
        {iconOnly ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
        ) : t('common.edit')}
      </button>
      {isOpen && mounted && createPortal(
        <div className="modal-overlay">
          <div className="card" style={{ width: '100%', maxWidth: '600px', margin: '16px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="flex justify-between items-center" style={{ padding: '24px 24px 0', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '900', margin: 0 }}>修改客戶資料</h2>
              <button onClick={() => setIsOpen(false)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-md" style={{ padding: '0 24px 24px', overflowY: 'auto' }}>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="公司名稱 *" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
              <input type="url" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} placeholder="官方網站 (https://...)" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
              
              <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                <select required value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} style={{ flex: 1, minWidth: '150px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}>
                  <option value="">選擇產業別 *</option>
                  <option value="TECHNOLOGY">科技業</option>
                  <option value="MANUFACTURING">製造業</option>
                  <option value="FINANCE">金融業</option>
                  <option value="RETAIL">零售業</option>
                  <option value="HEALTHCARE">醫療保健</option>
                  <option value="OTHER">其他</option>
                </select>
                <select value={formData.sizeScale} onChange={e => setFormData({...formData, sizeScale: e.target.value})} style={{ flex: 1, minWidth: '150px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}>
                  <option value="SMALL">1-50 人</option>
                  <option value="MEDIUM">51-200 人</option>
                  <option value="LARGE">201-1000 人</option>
                  <option value="ENTERPRISE">1000+ 人</option>
                </select>
              </div>

              <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                <select value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} style={{ flex: 1, minWidth: '150px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}>
                  <option value="">選擇地區</option>
                  <option value="NORTH">北部</option>
                  <option value="CENTRAL">中部</option>
                  <option value="SOUTH">南部</option>
                  <option value="EAST">東部</option>
                </select>
                <select value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})} style={{ flex: 1, minWidth: '150px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}>
                  <option value="">偏好雲端平台</option>
                  <option value="AWS">AWS</option>
                  <option value="GCP">GCP</option>
                  <option value="Multi-Cloud">多雲平台</option>
                </select>
              </div>
              <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                <select required value={formData.ownerId} onChange={e => setFormData({...formData, ownerId: e.target.value})} style={{ flex: 1, minWidth: '150px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}>
                  <option value="">指派負責業務 *</option>
                  {salesUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <select value={formData.salesDeputy || ''} onChange={e => setFormData({...formData, salesDeputy: e.target.value || null})} style={{ flex: 1, minWidth: '150px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}>
                  <option value="">無業務代理人</option>
                  {salesUsers.filter(u => u.id !== formData.ownerId).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              <select required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}>
                <option value="LEAD">潛在名單 (Lead)</option>
                <option value="ACTIVE">正式客戶 (Active)</option>
              </select>

              <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>預估月雲端支出 (USD)</label>
                  <input type="number" value={formData.cloudSpendEst} onChange={e => setFormData({...formData, cloudSpendEst: e.target.value})} placeholder="例如: 5000" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '4px' }} />
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>雲端合約續約日</label>
                  <input type="date" value={formData.cloudRenewalDate} onChange={e => setFormData({...formData, cloudRenewalDate: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '4px' }} />
                </div>
              </div>

              <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>商機優先級</label>
                  <select value={formData.priorityScore} onChange={e => setFormData({...formData, priorityScore: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', marginTop: '4px' }}>
                    <option value="">設定優先級</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>技術堆疊 (Technographics)</label>
                <textarea value={formData.technographics} onChange={e => setFormData({...formData, technographics: e.target.value})} placeholder="例如: AWS, Kubernetes, Terraform" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', minHeight: '80px', marginTop: '4px' }} />
              </div>
              <div className="flex gap-md" style={{ marginTop:'16px' }}>
                <button type="button" onClick={() => setIsOpen(false)} className="btn-ghost" style={{ flex:1 }}>取消</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex:1 }}>{isSubmitting ? '儲存中...' : '儲存變更'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
