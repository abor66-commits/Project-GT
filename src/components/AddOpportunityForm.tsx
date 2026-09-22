// src/components/AddOpportunityForm.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface Company { id: string; name: string; }
interface User { id: string; name: string; }

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: '10px',
  border: '1.5px solid var(--border-color)',
  background: 'var(--bg-main)',
  color: 'var(--text-main)',
  fontSize: '0.9rem',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  appearance: 'auto',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: '700',
  color: 'var(--text-muted)',
  marginBottom: '6px',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export default function AddOpportunityForm({
  companies,
  users,
  defaultCompanyId,
}: {
  companies: Company[];
  users: User[];
  defaultCompanyId?: string;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    stage: 'QUALIFICATION',
    closeDate: new Date().toISOString().split('T')[0],
    companyId: defaultCompanyId || '',
    ownerId: users[0]?.id || '',
    source: '',
    campaign: '',
  });

  const set = (key: string, val: string) =>
    setFormData((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    startTransition(async () => {
      try {
        await fetch('/api/opportunities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            ...formData,
            amount: parseFloat(formData.amount),
            closeDate: new Date(formData.closeDate),
          }),
        });
        // Return to opportunities board
        router.push('/opportunities');
      } catch (err) {
        console.error(err);
        alert(t('opportunities.form.create_error'));
      }
    });
  };

  return (
    <div className="container" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-ghost"
          style={{ marginBottom: '12px' }}
        >
          ← {t('company_detail.back').replace('← ', '')}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
            }}
          >
            📈
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
              {t('opportunities.add.title')}
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              {t('opportunities.add.subtitle')}
            </p>
          </div>
        </div>
        <div style={{ height: '1px', background: 'var(--border-color)', marginTop: '16px' }} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <Field label={t('opportunities.form.name')}>
          <input
            required
            value={formData.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder={t('opportunities.form.name_placeholder')}
            style={inputStyle}
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <Field label={t('opportunities.form.amount')}>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '13px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  fontWeight: '600',
                }}
              >
                $
              </span>
              <input
                required
                type="number"
                min="0"
                value={formData.amount}
                onChange={(e) => set('amount', e.target.value)}
                placeholder="0"
                style={{ ...inputStyle, paddingLeft: '26px' }}
              />
            </div>
          </Field>
          <Field label={t('opportunities.form.close_date')}>
            <input
              required
              type="date"
              value={formData.closeDate}
              onChange={(e) => set('closeDate', e.target.value)}
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label={t('opportunities.form.company')}>
          <select
            required
            value={formData.companyId}
            onChange={(e) => set('companyId', e.target.value)}
            style={inputStyle}
          >
            <option value="">{t('opportunities.form.company_select')}</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        {users.length > 1 && (
          <Field label={t('opportunities.form.owner')}>
            <select
              value={formData.ownerId}
              onChange={(e) => set('ownerId', e.target.value)}
              style={inputStyle}
            >
              <option value="">{t('opportunities.form.owner_unassigned')}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        {/* Marketing Tracking Section */}
        <div
          style={{
            borderRadius: '12px',
            border: '1.5px dashed #c7d7fe',
            background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: '800',
                letterSpacing: '0.08em',
                color: '#2563eb',
                textTransform: 'uppercase',
                background: '#dbeafe',
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              {t('opportunities.form.optional')}
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#1d4ed8' }}>
              {t('opportunities.form.marketing')}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label={t('opportunities.form.source')}>
              <select
                value={formData.source}
                onChange={(e) => set('source', e.target.value)}
                style={{ ...inputStyle, fontSize: '0.83rem' }}
              >
                <option value="">{t('opportunities.form.source_select')}</option>
                <option value="FB">{t('opportunities.form.source.fb')}</option>
                <option value="LinkedIn">{t('opportunities.form.source.linkedin')}</option>
                <option value="Google">{t('opportunities.form.source.google')}</option>
                <option value="Seminar">{t('opportunities.form.source.seminar')}</option>
                <option value="Referral">{t('opportunities.form.source.referral')}</option>
                <option value="Cold_Call">{t('opportunities.form.source.cold_call')}</option>
              </select>
            </Field>
            <Field label={t('opportunities.form.campaign')}>
              <input
                value={formData.campaign}
                onChange={(e) => set('campaign', e.target.value)}
                placeholder={t('opportunities.form.campaign_placeholder')}
                style={{ ...inputStyle, fontSize: '0.83rem' }}
              />
            </Field>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              flex: 1,
              padding: '13px',
              borderRadius: '10px',
              border: '1.5px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {t('opportunities.form.cancel')}
          </button>
          <button
            type="submit"
            disabled={isPending}
            style={{
              flex: 2,
              padding: '13px',
              borderRadius: '10px',
              border: 'none',
              background: isPending
                ? '#93c5fd'
                : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: '700',
              cursor: isPending ? 'not-allowed' : 'pointer',
              boxShadow: isPending ? 'none' : '0 4px 14px rgba(37, 99, 235, 0.35)',
              transition: 'all 0.15s',
            }}
          >
            {isPending ? t('opportunities.form.creating') : t('opportunities.form.create')}
          </button>
        </div>
      </form>
    </div>
  );
}
