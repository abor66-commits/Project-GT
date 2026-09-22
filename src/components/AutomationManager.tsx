'use client';

import React, { useState, useTransition } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface Rule {
  id: string;
  name: string;
  triggerType: string;
  triggerVal: string;
  actionType: string;
  content: string | null;
  isActive: boolean;
}

export default function AutomationManager({ initialRules, allTags }: { initialRules: Rule[], allTags: any[] }) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [rules, setRules] = useState(initialRules);
  const [isAdding, setIsAdding] = useState(false);

  // New Rule Form State
  const [name, setName] = useState('');
  const [triggerVal, setTriggerVal] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleCreate = () => {
    if (!name || !triggerVal || !subject || !body) {
      alert(t('marketing.automation.form_error'));
      return;
    }

    startTransition(async () => {
      const content = `${subject}\n${body}`;
      const res = await fetch('/api/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createAutomation', name, triggerType: 'TAG_ADDED', triggerVal, actionType: 'SEND_EMAIL', content }),
      });
      const result = await res.json();
      if (result.success && result.rule) {
        setRules([...rules, result.rule]);
        setIsAdding(false);
        setName(''); setTriggerVal(''); setSubject(''); setBody('');
      } else {
        alert(result.error || 'Failed to create rule');
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm(t('marketing.automation.delete_confirm'))) return;
    startTransition(async () => {
      const res = await fetch('/api/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteAutomation', id }),
      });
      const result = await res.json();
      if (result.success) {
        setRules(rules.filter(r => r.id !== id));
      }
    });
  };

  return (
    <div className="card shadow-sm">
      <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{t('marketing.automation.title')}</h2>
        <button 
          className="btn-primary" 
          onClick={() => setIsAdding(!isAdding)}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          {isAdding ? t('marketing.automation.cancel') : t('marketing.automation.add_rule')}
        </button>
      </div>

      {isAdding && (
        <div style={{ padding: '20px', background: 'var(--bg-muted)', borderRadius: '12px', marginBottom: '24px' }}>
          <div className="flex flex-col gap-md">
            <input 
              type="text" 
              placeholder={t('marketing.automation.rule_name')}
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
            />
            
            <div className="flex flex-col gap-sm">
              <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t('marketing.automation.on_tag_added')}</label>
              <select 
                value={triggerVal}
                onChange={e => setTriggerVal(e.target.value)}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
              >
                <option value="">{t('marketing.automation.select_tag')}</option>
                {allTags.map(tag => (
                  <option key={tag.id} value={tag.name}>{tag.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-sm">
              <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t('marketing.automation.auto_send')}</label>
              <input 
                type="text" 
                placeholder={t('marketing.automation.email_subject')}
                value={subject}
                onChange={e => setSubject(e.target.value)}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
              />
              <textarea 
                placeholder={t('marketing.automation.email_body')}
                value={body}
                onChange={e => setBody(e.target.value)}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', minHeight: '100px' }}
              />
            </div>

            <button 
              className="btn-primary" 
              onClick={handleCreate} 
              disabled={isPending}
              style={{ padding: '12px', borderRadius: '8px' }}
            >
              {isPending ? t('marketing.automation.saving') : t('marketing.automation.save_rule')}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-sm">
        {rules.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '20px' }}>{t('marketing.automation.no_rules')}</p>
        ) : (
          rules.map(rule => (
            <div key={rule.id} style={{ 
              padding: '16px', 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ flex: 1 }}>
                <div className="flex items-center gap-sm">
                  <span style={{ fontWeight: '700' }}>{rule.name}</span>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: '#dcfce7', color: '#166534' }}>{t('marketing.automation.active')}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {t('marketing.automation.rule_desc').replace('{tag}', rule.triggerVal)}
                </p>
              </div>
              <button 
                onClick={() => handleDelete(rule.id)}
                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', padding: '8px' }}
              >
                {t('marketing.automation.delete')}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
