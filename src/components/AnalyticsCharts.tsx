'use client';

import React from 'react';
import {
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { useTranslation } from '@/lib/i18n/LanguageContext';

const CollapsibleCard = ({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: 'pointer',
          paddingBottom: isOpen ? '16px' : '0',
          borderBottom: isOpen ? '1px solid var(--border-color)' : 'none',
          marginBottom: isOpen ? '16px' : '0'
        }}
      >
        <h2 style={{ fontSize: '1rem', margin: 0, fontWeight: '700' }}>{title}</h2>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', color: 'var(--text-muted)' }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      
      <div style={{ 
        display: isOpen ? 'block' : 'none',
        height: '450px', // Increased to 450px to provide plenty of room for multi-line legends
        width: '100%'
      }}>
        {children}
      </div>
    </div>
  );
};

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface AnalyticsProps {
  industryData: any[];
  sizeData: any[];
  statusData: any[];
  ownerData: any[];
  sourceData: any[];
  campaignData: any[];
}

export default function AnalyticsCharts({ industryData, sizeData, statusData, ownerData, sourceData, campaignData }: AnalyticsProps) {
  const { t } = useTranslation();

  return (
    <div className="analytics-grid">
      
      {/* 1. 客戶產業分佈 (圓餅圖) */}
      <CollapsibleCard title={t('reports.industry_dist')}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={industryData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              nameKey="name"
              label
            >
              {industryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }}/>
          </PieChart>
        </ResponsiveContainer>
      </CollapsibleCard>

      {/* 2. 活躍/潛在客戶比例 (環狀圖) */}
      <CollapsibleCard title={t('reports.status_dist')}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              nameKey="name"
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#2563eb'} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }}/>
          </PieChart>
        </ResponsiveContainer>
      </CollapsibleCard>

      {/* 3. 企業規模分佈 (長條圖) */}
      <CollapsibleCard title={t('reports.size_dist')} defaultOpen={false}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sizeData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip cursor={{fill: '#f8fafc'}} />
            <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CollapsibleCard>

      {/* 4. 各業務員客戶分配量 (橫向長條圖) */}
      <CollapsibleCard title={t('reports.owner_dist')} defaultOpen={false}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ownerData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip cursor={{fill: '#f8fafc'}} />
            <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CollapsibleCard>

      {/* 5. 商機來源分佈 (圓餅圖) */}
      <CollapsibleCard title={t('reports.source_dist')}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sourceData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              nameKey="name"
            >
              {sourceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }}/>
          </PieChart>
        </ResponsiveContainer>
      </CollapsibleCard>

      {/* 6. 行銷活動貢獻 (長條圖) */}
      <CollapsibleCard title={t('reports.campaign_impact')} defaultOpen={false}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={campaignData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value: any) => `$${Number(value || 0).toLocaleString()}`} />
            <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CollapsibleCard>

    </div>
  );
}
