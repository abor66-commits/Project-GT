import React from 'react';

interface StageData {
  stage: string;
  count: number;
  value: number;
}

const STAGE_MAP: Record<string, string> = {
  'QUALIFICATION': '資格審查',
  'PROPOSAL': '提案報價',
  'NEGOTIATION': '議價談判',
  'CLOSED_WON': '成交結案',
};

const BAR_GRADIENTS = [
  'linear-gradient(180deg, #94a3b8 0%, #64748b 100%)', // Gray
  'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)', // Blue
  'linear-gradient(180deg, #c084fc 0%, #7c3aed 100%)', // Purple
  'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)', // Orange
  'linear-gradient(180deg, #4ade80 0%, #16a34a 100%)', // Green
];

export default function PipelineChart({ data }: { data: StageData[] }) {
  // Filter out any stages not in our map if necessary, but here we'll just show what's passed
  const maxVal = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div style={{ height: '320px', display: 'flex', flexDirection: 'column', paddingTop: '20px' }}>
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'flex-end', 
        gap: '24px', 
        paddingBottom: '12px', 
        borderBottom: '1px solid var(--border-color)',
        minHeight: '200px' // Ensure minimum height for bars to grow
      }}>
        {data.map((d, i) => {
          const heightPercent = Math.max((d.value / maxVal) * 100, 5); // Minimum 5% height for visibility
          return (
            <div key={d.stage} style={{ 
              flex: 1, 
              height: '100%',
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'flex-end',
              alignItems: 'center', 
              gap: '12px' 
            }}>
              <div style={{ 
                width: '100%', 
                height: `${heightPercent}%`, 
                background: BAR_GRADIENTS[i % BAR_GRADIENTS.length],
                borderRadius: '8px 8px 0 0',
                position: 'relative',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer'
              }} title={`${d.count} 個商機`}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-30px', 
                  width: '100%', 
                  textAlign: 'center', 
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  color: 'var(--text-main)'
                }}>
                  ${(d.value / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}k
                </div>
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)', 
                textAlign: 'center', 
                fontWeight: '600',
                whiteSpace: 'nowrap',
                marginTop: '8px'
              }}>
                {STAGE_MAP[d.stage] || d.stage}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
