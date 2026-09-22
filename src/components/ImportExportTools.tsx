'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function ImportExportTools({ userRole, currentUserId }: { userRole: string, currentUserId: string }) {
  const { t } = useTranslation();
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState('');

  if (userRole !== 'ADMIN' && userRole !== 'MANAGER') return null;

  const handleExport = async () => {
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export' }),
      });
      const data = await res.json();
      const companies = data.data;
      const headers = ['客戶名稱', '產業', '區域', '雲端平台', '規模', '負責人', '主要聯絡人'];
      const rows = (companies as any[]).map(c => [

        c.name,
        c.industry,
        c.region,
        c.platform,
        c.sizeScale,
        c.owner.name,
        c.contacts[0]?.name || ''
      ]);

      const csvContent = [
        '\uFEFF' + headers.join(','), // Add BOM for Excel UTF-8 support
        ...rows.map(r => r.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `GCS_Companies_Export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(error);
      alert('匯出失敗');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setMessage('讀取檔案中...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length <= 1) {
          alert('CSV 檔案為空或格式錯誤');
          return;
        }

        // Simple CSV parser (split by comma, handle quotes)
        const parseCSVLine = (line: string) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' && line[i + 1] === '"') {
              current += '"';
              i++;
            } else if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = parseCSVLine(lines[0]);
        const companies = lines.slice(1).map(line => {
          const values = parseCSVLine(line);
          return {
            name: values[0],
            industry: values[1],
            region: values[2],
            platform: values[3],
            sizeScale: values[4],
            ownerId: currentUserId, // Default to current user for simplicity in import
            status: 'POTENTIAL'
          };
        }).filter(c => c.name);

        setMessage(`正在匯入 ${companies.length} 筆資料...`);
        const res = await fetch('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'bulkUpsert', companies }),
        });
        const result = await res.json();
        
        if (result.success) {
          alert(`成功匯入 ${result.count} 筆資料！`);
          window.location.reload();
        } else {
          alert(result.error);
        }
      } catch (error) {
        console.error(error);
        alert('匯入解析失敗，請確認 CSV 格式。');
      } finally {
        setIsImporting(false);
        setMessage('');
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex gap-md mobile-wrap" style={{ alignItems: 'center' }}>
      <button className="btn-ghost" onClick={handleExport} style={{ fontSize: '0.85rem' }}>
        📥 {t('companies.export')}
      </button>
      <div style={{ position: 'relative' }}>
        <button className="btn-ghost" disabled={isImporting} style={{ fontSize: '0.85rem' }}>
          📤 {isImporting ? message : t('companies.import_csv')}
        </button>
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleImport}
          style={{ 
            position: 'absolute', 
            top: 0, left: 0, width: '100%', height: '100%', 
            opacity: 0, cursor: 'pointer' 
          }}
          disabled={isImporting}
        />
      </div>
    </div>
  );
}
