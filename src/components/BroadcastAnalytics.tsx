'use client';

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import { getBroadcastCampaigns, getCampaignDetails } from '@/app/actions/marketing';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface CampaignSummary {
  campaignCount: number;
  totalSent: number;
  totalUniqueOpens: number;
  totalUniqueClicks: number;
  avgDeliveryRate: number;
  avgOpenRate: number;
  avgClickRate: number;
}

interface CampaignItem {
  id: string;
  subject: string;
  tagName: string;
  totalRecipients: number;
  successCount: number;
  failedCount: number;
  openCount: number;
  uniqueOpenCount: number;
  clickCount: number;
  uniqueClickCount: number;
  status: string;
  createdAt: Date | string;
  sender?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface RecipientItem {
  id: string;
  email: string;
  contactName: string;
  companyName: string;
  status: string;
  errorMessage?: string | null;
  openedAt?: Date | string | null;
  lastOpenedAt?: Date | string | null;
  openCount: number;
  clickedAt?: Date | string | null;
  lastClickedAt?: Date | string | null;
  clickCount: number;
  lastClickedUrl?: string | null;
  createdAt: Date | string;
}

interface CampaignDetailData extends CampaignItem {
  recipients: RecipientItem[];
}

interface Props {
  initialCampaignId?: string | null;
  onSelectCampaign?: (id: string | null) => void;
}

export default function BroadcastAnalytics({ initialCampaignId, onSelectCampaign }: Props) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState<CampaignSummary | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(initialCampaignId || null);
  const [campaignDetail, setCampaignDetail] = useState<CampaignDetailData | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [recipientFilter, setRecipientFilter] = useState<'ALL' | 'OPENED' | 'UNOPENED' | 'CLICKED' | 'FAILED'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');

  const loadCampaigns = () => {
    startTransition(async () => {
      const res = await getBroadcastCampaigns(50);
      if (res.success && res.campaigns) {
        setCampaigns(res.campaigns as any);
        setSummary(res.summary);
      }
    });
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  // Sync initialCampaignId if passed from parent
  useEffect(() => {
    if (initialCampaignId) {
      openDetails(initialCampaignId);
    }
  }, [initialCampaignId]);

  const openDetails = async (id: string) => {
    setSelectedCampaignId(id);
    onSelectCampaign?.(id);
    setIsLoadingDetail(true);
    setRecipientFilter('ALL');
    setSearchKeyword('');
    try {
      const res = await getCampaignDetails(id);
      if (res.success && res.campaign) {
        setCampaignDetail(res.campaign as any);
      }
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const closeDetails = () => {
    setSelectedCampaignId(null);
    setCampaignDetail(null);
    onSelectCampaign?.(null);
  };

  const formatDate = (date: Date | string) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(date));
  };

  // Filter recipients in detail modal
  const filteredRecipients = useMemo(() => {
    if (!campaignDetail) return [];
    return campaignDetail.recipients.filter(r => {
      // Status & engagement filter
      if (recipientFilter === 'OPENED' && !r.openedAt) return false;
      if (recipientFilter === 'UNOPENED' && (!!r.openedAt || r.status === 'FAILED')) return false;
      if (recipientFilter === 'CLICKED' && !r.clickedAt) return false;
      if (recipientFilter === 'FAILED' && r.status !== 'FAILED') return false;

      // Keyword search
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matchesCompany = r.companyName.toLowerCase().includes(kw);
        const matchesContact = r.contactName.toLowerCase().includes(kw);
        const matchesEmail = r.email.toLowerCase().includes(kw);
        if (!matchesCompany && !matchesContact && !matchesEmail) return false;
      }

      return true;
    });
  }, [campaignDetail, recipientFilter, searchKeyword]);

  return (
    <div style={{ width: '100%' }}>
      {/* ── Top Overview KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-md" style={{ marginBottom: '24px' }}>
        <div className="card shadow-sm" style={{ padding: '20px', borderRadius: '16px', borderLeft: '4px solid #3b82f6' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px' }}>
            {t('marketing.analytics.kpi_sent')}
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {summary?.totalSent ?? 0}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {summary?.campaignCount ?? 0} {t('marketing.analytics.kpi_campaigns')}
          </p>
        </div>

        <div className="card shadow-sm" style={{ padding: '20px', borderRadius: '16px', borderLeft: '4px solid #10b981' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px' }}>
            {t('marketing.analytics.kpi_delivery_rate')}
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: '800', color: '#10b981' }}>
            {summary?.avgDeliveryRate ?? 0}%
          </p>
          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, summary?.avgDeliveryRate ?? 0)}%`, height: '100%', background: '#10b981' }} />
          </div>
        </div>

        <div className="card shadow-sm" style={{ padding: '20px', borderRadius: '16px', borderLeft: '4px solid #8b5cf6' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px' }}>
            {t('marketing.analytics.kpi_open_rate')}
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: '800', color: '#8b5cf6' }}>
            {summary?.avgOpenRate ?? 0}%
          </p>
          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, summary?.avgOpenRate ?? 0)}%`, height: '100%', background: '#8b5cf6' }} />
          </div>
        </div>

        <div className="card shadow-sm" style={{ padding: '20px', borderRadius: '16px', borderLeft: '4px solid #f97316' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px' }}>
            {t('marketing.analytics.kpi_click_rate')}
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: '800', color: '#f97316' }}>
            {summary?.avgClickRate ?? 0}%
          </p>
          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, summary?.avgClickRate ?? 0)}%`, height: '100%', background: '#f97316' }} />
          </div>
        </div>
      </div>

      {/* ── Campaigns Table Card ── */}
      <div className="card shadow-sm" style={{ borderRadius: '16px', padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0 }}>
            {t('marketing.analytics.campaign_list_title')}
          </h3>
          <button
            onClick={loadCampaigns}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            disabled={isPending}
          >
            <span>🔄</span>
            <span>{t('marketing.analytics.refresh')}</span>
          </button>
        </div>

        <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'color-mix(in srgb, var(--text-main) 4%, transparent)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '14px 16px', fontSize: '0.8rem', fontWeight: '700' }}>
                  {t('marketing.analytics.col_subject')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                  {t('marketing.analytics.col_target')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                  {t('marketing.analytics.col_time')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                  {t('marketing.analytics.col_sent')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                  {t('marketing.analytics.col_opens')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                  {t('marketing.analytics.col_clicks')}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.8rem', fontWeight: '700', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {t('marketing.analytics.col_action')}
                </th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {isPending ? '載入中...' : t('marketing.analytics.no_campaigns')}
                  </td>
                </tr>
              ) : (
                campaigns.map(c => {
                  const openPct = c.successCount > 0 ? Math.round((c.uniqueOpenCount / c.successCount) * 100) : 0;
                  const clickPct = c.successCount > 0 ? Math.round((c.uniqueClickCount / c.successCount) * 100) : 0;

                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}>
                      <td style={{ padding: '14px 16px', fontWeight: '600', maxWidth: '240px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.subject}>
                          {c.subject}
                        </div>
                        {c.sender && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '400', marginTop: '2px' }}>
                            {c.sender.name}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          padding: '3px 8px', 
                          borderRadius: '12px', 
                          background: '#eff6ff', 
                          color: '#2563eb', 
                          fontWeight: '600' 
                        }}>
                          {c.tagName}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(c.createdAt)}
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: '700' }}>{c.successCount}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> / {c.totalRecipients}</span>
                        {c.failedCount > 0 && (
                          <span style={{ fontSize: '0.75rem', color: '#ef4444', marginLeft: '4px' }}>
                            (失敗 {c.failedCount})
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '700', color: '#8b5cf6', minWidth: '36px' }}>{openPct}%</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({c.uniqueOpenCount})</span>
                        </div>
                        <div style={{ width: '70px', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, openPct)}%`, height: '100%', background: '#8b5cf6' }} />
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '700', color: '#f97316', minWidth: '36px' }}>{clickPct}%</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({c.uniqueClickCount})</span>
                        </div>
                        <div style={{ width: '70px', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, clickPct)}%`, height: '100%', background: '#f97316' }} />
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => openDetails(c.id)}
                          className="btn-primary"
                          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                        >
                          {t('marketing.analytics.btn_details')}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Campaign Detail Modal / Drawer ── */}
      {selectedCampaignId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '16px',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="card shadow-lg" style={{
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '20px',
            padding: 0,
            overflow: 'hidden',
            background: 'var(--bg-card, white)',
          }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', fontWeight: '700' }}>
                    {campaignDetail?.tagName || 'Tag'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {campaignDetail ? formatDate(campaignDetail.createdAt) : ''}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                  {campaignDetail?.subject || '載入活動中...'}
                </h2>
              </div>
              <button
                onClick={closeDetails}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  lineHeight: '1',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            {isLoadingDetail ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                載入成效詳情中...
              </div>
            ) : campaignDetail ? (
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                {/* Funnel Metrics Grid */}
                <div className="grid grid-cols-3 gap-md" style={{ marginBottom: '24px' }}>
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                      {t('marketing.analytics.funnel_sent')}
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                      {campaignDetail.successCount}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      總發送 {campaignDetail.totalRecipients} 封 (送達率 {campaignDetail.totalRecipients > 0 ? Math.round((campaignDetail.successCount / campaignDetail.totalRecipients) * 100) : 0}%)
                    </div>
                  </div>

                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                      {t('marketing.analytics.funnel_opens')}
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#8b5cf6', marginTop: '4px' }}>
                      {campaignDetail.uniqueOpenCount}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      開信率 {campaignDetail.successCount > 0 ? Math.round((campaignDetail.uniqueOpenCount / campaignDetail.successCount) * 100) : 0}% · 累計 {campaignDetail.openCount} 次
                    </div>
                  </div>

                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                      {t('marketing.analytics.funnel_clicks')}
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#f97316', marginTop: '4px' }}>
                      {campaignDetail.uniqueClickCount}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      點擊率 {campaignDetail.successCount > 0 ? Math.round((campaignDetail.uniqueClickCount / campaignDetail.successCount) * 100) : 0}% · 累計 {campaignDetail.clickCount} 次
                    </div>
                  </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(['ALL', 'OPENED', 'UNOPENED', 'CLICKED', 'FAILED'] as const).map(filterKey => {
                      const count = campaignDetail.recipients.filter(r => {
                        if (filterKey === 'OPENED') return !!r.openedAt;
                        if (filterKey === 'UNOPENED') return !r.openedAt && r.status !== 'FAILED';
                        if (filterKey === 'CLICKED') return !!r.clickedAt;
                        if (filterKey === 'FAILED') return r.status === 'FAILED';
                        return true;
                      }).length;

                      const label = filterKey === 'ALL' ? t('marketing.analytics.filter_all')
                        : filterKey === 'OPENED' ? t('marketing.analytics.filter_opened')
                        : filterKey === 'UNOPENED' ? t('marketing.analytics.filter_unopened')
                        : filterKey === 'CLICKED' ? t('marketing.analytics.filter_clicked')
                        : t('marketing.analytics.filter_failed');

                      const isActive = recipientFilter === filterKey;

                      return (
                        <button
                          key={filterKey}
                          onClick={() => setRecipientFilter(filterKey)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                            background: isActive ? 'var(--primary)' : 'transparent',
                            color: isActive ? 'white' : 'var(--text-main)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {label} ({count})
                        </button>
                      );
                    })}
                  </div>

                  <input
                    type="text"
                    placeholder={t('marketing.analytics.search_recipient_placeholder')}
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      minWidth: '220px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Recipients Table */}
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', fontWeight: '700' }}>{t('marketing.analytics.recipient_company')}</th>
                        <th style={{ padding: '12px 16px', fontWeight: '700' }}>{t('marketing.analytics.recipient_email')}</th>
                        <th style={{ padding: '12px 16px', fontWeight: '700' }}>{t('marketing.analytics.recipient_delivery')}</th>
                        <th style={{ padding: '12px 16px', fontWeight: '700' }}>{t('marketing.analytics.recipient_open_status')}</th>
                        <th style={{ padding: '12px 16px', fontWeight: '700' }}>{t('marketing.analytics.recipient_click_status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecipients.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            {t('marketing.analytics.no_recipients')}
                          </td>
                        </tr>
                      ) : (
                        filteredRecipients.map(r => (
                          <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                              <div>{r.contactName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '400' }}>{r.companyName}</div>
                            </td>
                            <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                              {r.email}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              {r.status === 'SENT' ? (
                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: '#dcfce7', color: '#166534', fontWeight: '600' }}>
                                  已送達
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: '#fee2e2', color: '#991b1b', fontWeight: '600' }} title={r.errorMessage || ''}>
                                  失敗
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              {r.openedAt ? (
                                <div>
                                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: '#f3e8ff', color: '#7e22ce', fontWeight: '700' }}>
                                    已開信 {r.openCount} {t('marketing.analytics.times')}
                                  </span>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    {formatDate(r.openedAt)}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>未開信</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              {r.clickedAt ? (
                                <div>
                                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: '#ffedd5', color: '#c2410c', fontWeight: '700' }}>
                                    已點擊 {r.clickCount} {t('marketing.analytics.times')}
                                  </span>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.lastClickedUrl || ''}>
                                    {r.lastClickedUrl}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>未點擊</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={closeDetails} className="btn-secondary" style={{ padding: '8px 20px' }}>
                {t('marketing.analytics.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
