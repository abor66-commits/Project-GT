'use client';

import React, { useState, useTransition, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import EditOpportunityModal from './EditOpportunityModal';


const getStages = (t: any) => [
  { key: 'QUALIFICATION', label: t('opportunities.stage.qualification') },
  { key: 'PROPOSAL', label: t('opportunities.stage.proposal') },
  { key: 'NEGOTIATION', label: t('opportunities.stage.negotiation') },
  { key: 'CLOSED_WON', label: t('opportunities.stage.closed_won') }
];

interface Opportunity {
  id: string;
  name: string;
  amount: number;
  stage: string;
  company: { id: string; name: string };
  source?: string | null;
  campaign?: string | null;
}

export default function OpportunityKanban({ 
  initialOpportunities,
  companies,
  users
}: { 
  initialOpportunities: Opportunity[];
  companies?: { id: string; name: string }[];
  users?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const STAGES = getStages(t);
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();
  const [movingId, setMovingId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Sync state when props change (e.g. after router.refresh())
  useEffect(() => {
    setOpportunities(initialOpportunities);
  }, [initialOpportunities]);

  // Handle focus scroll and highlight
  useEffect(() => {
    if (focusId && cardRefs.current[focusId]) {
      cardRefs.current[focusId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });

      const timer = setTimeout(() => setFocusId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [focusId]);

  const handleStageChange = async (id: string, newStage: string) => {
    setMovingId(id);
    setTimeout(() => {
      startTransition(async () => {
        try {
          await fetch('/api/opportunities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'updateStage', id, stage: newStage }) });
          setOpportunities(prev => prev.map(o => o.id === id ? { ...o, stage: newStage } : o));
          setMovingId(null);
          setFocusId(id);
        } catch (error) {
          console.error(error);
          setMovingId(null);
        }
      });
    }, 400);
  };

  const filteredOpportunities = opportunities.filter(o =>
    o.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const grouped = STAGES.reduce((acc, stage) => {
    acc[stage.key] = filteredOpportunities.filter(o => o.stage === stage.key);
    return acc;
  }, {} as Record<string, typeof opportunities>);

  // Find first match and focus when searching
  const handleSearchSelect = (id: string) => {
    setFocusId(id);
    setSearchTerm('');
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Local Search Bar */}
      <div className="local-search-bar" style={{ 
        marginBottom: '20px', 
        position: 'sticky', 
        top: '0', 
        zIndex: 20, 
        background: 'var(--bg-body-color, var(--bg-main))',
        padding: '12px 0',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px', boxSizing: 'border-box' }}>
          <input
            type="text"
            placeholder={t('opportunities.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 16px',
              borderRadius: '10px',
              border: 'var(--card-border-custom, 1px solid var(--border-color))',
              background: 'var(--bg-card-custom, var(--bg-card))',
              color: 'var(--text-main-custom, var(--text-main))',
              outline: 'none',
              fontSize: '0.9rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          />
          {searchTerm && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'var(--bg-card-custom, var(--bg-card))',
              borderRadius: '8px',
              boxShadow: 'var(--shadow, 0 10px 25px rgba(0,0,0,0.1))',
              marginTop: '8px',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 101,
              border: 'var(--card-border-custom, 1px solid var(--border-color))'
            }}>
              {filteredOpportunities.length > 0 ? (
                filteredOpportunities.map(opp => (
                  <div
                    key={opp.id}
                    onClick={() => handleSearchSelect(opp.id)}
                    style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                    className="hover-bg"
                  >
                    <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-main-custom, var(--text-main))' }}>{opp.company.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted-custom, var(--text-muted))' }}>{opp.name}</div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted-custom, var(--text-muted))', fontSize: '0.85rem' }}>
                  {t('opportunities.search_no_results')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="kanban-scroll-container" style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`,
        gap: '20px',
        alignItems: 'start'
      }}>
        {STAGES.map(stage => (
          <div key={stage.key} className="kanban-column" style={{ background: 'var(--bg-card-custom, #f8fafc)', backdropFilter: 'var(--glass-blur, none)', borderRadius: '12px', padding: '16px', border: 'var(--card-border-custom, 1px solid var(--border-color))', minHeight: '600px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '12px', borderBottom: '2px solid var(--primary)', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main-custom, var(--text-main))' }}>{stage.label}</h3>
              <span style={{ fontSize: '0.8rem', background: 'color-mix(in srgb, var(--primary) 15%, transparent)', padding: '2px 8px', borderRadius: '10px', color: 'var(--primary)' }}>
                {grouped[stage.key]?.length || 0}
              </span>
            </div>

            <div className="flex flex-col gap-md">
              {grouped[stage.key]?.map(opp => (
                <div
                  key={opp.id}
                  ref={el => { cardRefs.current[opp.id] = el; }}
                  className={`card ${movingId === opp.id ? 'card-moving' : ''} ${focusId === opp.id ? 'card-focus-highlight' : ''}`}
                  style={{
                    padding: '16px',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: isPending && movingId === opp.id ? 0.6 : 1,
                    transform: movingId === opp.id ? 'scale(0.95) translateY(10px)' : 'scale(1)',
                    position: 'relative',
                    border: focusId === opp.id ? '2px solid var(--primary)' : 'var(--card-border-custom, 1px solid var(--border-color))'
                  }}
                >
                  <div className="flex justify-between items-start" style={{ marginBottom: '4px' }}>
                    <p style={{ fontWeight: '700', fontSize: '0.9rem', margin: 0, paddingRight: '20px', color: 'var(--text-main-custom, var(--text-main))' }}>{opp.name}</p>
                    {companies && users && (
                      <button 
                        onClick={() => setEditingOpportunity(opp)}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.background = 'none'; }}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer', 
                          color: 'var(--text-muted-custom, var(--text-muted))',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px',
                          transition: 'all 0.2s',
                          opacity: 0.6
                        }}
                        title="編輯商機"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                    )}
                  </div>
                  <Link href={`/companies/${opp.company.id}`} style={{ textDecoration: 'none' }}>
                    <p style={{
                      fontSize: '0.8rem',
                      color: 'var(--primary)',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      display: 'inline-block'
                    }} className="hover-underline">
                      {opp.company.name}
                    </p>
                  </Link>
                  <div style={{ fontWeight: '800', color: '#16a34a', fontSize: '1rem', marginTop: '4px' }}>
                    ${opp.amount.toLocaleString()}
                  </div>

                  {(opp.source || opp.campaign) && (
                    <div className="flex gap-xs" style={{ marginTop: '12px', flexWrap: 'wrap' }}>
                      {opp.source && (
                        <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                          📍 {opp.source}
                        </span>
                      )}
                      {opp.campaign && (
                        <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>
                          🏷️ {opp.campaign}
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: 'var(--card-border-custom, 1px solid var(--border-color))' }}>
                    <select
                      disabled={isPending}
                      value={opp.stage}
                      onChange={(e) => handleStageChange(opp.id, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'var(--card-border-custom, 1px solid var(--border-color))',
                        fontSize: '0.8rem',
                        background: 'var(--bg-card-custom, var(--bg-card))',
                        color: 'var(--text-main-custom, var(--text-main))',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </div>

                  {isPending && movingId === opp.id && (
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      background: 'rgba(255,255,255,0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 'var(--radius)'
                    }}>
                      <span className="spinner"></span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {editingOpportunity && companies && users && (
        <EditOpportunityModal
          opportunity={editingOpportunity}
          companies={companies}
          users={users}
          onClose={() => setEditingOpportunity(null)}
          onSave={() => {
            setEditingOpportunity(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
