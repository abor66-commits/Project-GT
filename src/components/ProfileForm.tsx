'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface UserData {
  id: string;
  name: string;
  email: string;
  employeeId: string | null;
  role: string;
  status: string;
  department: string | null;
  jobTitle: string | null;
  updatedAt: string | Date;
}

export default function ProfileForm({ userData }: { userData: UserData }) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: formData.get('userId'),
          name: formData.get('name'),
          department: formData.get('department'),
          jobTitle: formData.get('jobTitle'),
          password: formData.get('password'),
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(t('profile.alert_success'));
        router.refresh();
      } else {
        alert(data.error || t('profile.alert_error'));
      }
    } catch {
      alert(t('profile.alert_exception'));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="userId" value={userData.id} />

      {/* Section 1: Read-only System Info */}
      <section className="card" style={{ marginBottom: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '20px' }}>{t('profile.system_info_title')}</h2>
        <div className="form-grid-2col" style={{ gap: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{t('profile.email')}</label>
            <input type="text" value={userData.email} disabled style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{t('profile.employee_id')}</label>
            <input type="text" value={userData.employeeId || 'N/A'} disabled style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{t('profile.role')}</label>
            <input type="text" value={userData.role} disabled style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{t('profile.status')}</label>
            <div style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: userData.status === 'Active' || userData.status === 'APPROVED' ? '#10b981' : '#f59e0b' }}></span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{userData.status}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Editable Profile Info */}
      <section className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '20px' }}>{t('profile.basic_info_title')}</h2>
        <div className="flex flex-col gap-lg">
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '600', marginBottom: '8px' }}>{t('profile.name')}</label>
            <input type="text" name="name" defaultValue={userData.name} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' }} />
          </div>
          <div className="form-grid-2col" style={{ gap: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '600', marginBottom: '8px' }}>{t('profile.department')}</label>
              <input type="text" name="department" defaultValue={userData.department || ''} placeholder={t('profile.department_placeholder')} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '600', marginBottom: '8px' }}>{t('profile.job_title')}</label>
              <input type="text" name="jobTitle" defaultValue={userData.jobTitle || ''} placeholder={t('profile.job_title_placeholder')} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Password Change */}
      <section className="card" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1rem', color: 'var(--secondary)', marginBottom: '20px' }}>{t('profile.security_title')}</h2>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '600', marginBottom: '8px' }}>{t('profile.change_password')}</label>
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              name="password" 
              placeholder={t('profile.password_placeholder')} 
              style={{ width: '100%', padding: '12px', paddingRight: '45px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' }} 
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: '1.2rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px'
              }}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>{t('profile.password_hint')}</p>
        </div>
      </section>

      <div className="profile-form-actions">
        <button type="submit" className="btn-primary" style={{ padding: '12px 40px' }} disabled={isPending}>
          {isPending ? t('profile.saving_btn') : t('profile.save_btn')}
        </button>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('profile.last_updated')} {new Date(userData.updatedAt).toLocaleString()}</p>
      </div>
    </form>
  );
}
