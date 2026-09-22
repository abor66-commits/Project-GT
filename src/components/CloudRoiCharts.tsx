'use client';

import React from 'react';
import {
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface CloudRoiChartsProps {
  spendTierData: any[];
  platformData: any[];
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function CloudRoiCharts({ spendTierData, platformData }: CloudRoiChartsProps) {
  return (
    <div className="analytics-grid" style={{ marginTop: '24px' }}>
      
      {/* 1. Pipeline Value by Cloud Spend Tier */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '400px', padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', margin: 0 }}>
          不同雲端支出級距的 Pipeline 價值 (USD)
        </h3>
        <div style={{ flex: 1, width: '100%', height: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={spendTierData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: any) => `$${Number(value || 0).toLocaleString()} USD`} />
              <Bar dataKey="pipeline" fill="#2563eb" name="總 Pipeline 商機金額" radius={[4, 4, 0, 0]} />
              <Bar dataKey="won" fill="#10b981" name="已成交 (Closed-Won) 金額" radius={[4, 4, 0, 0]} />
              <Legend verticalAlign="bottom" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Revenue Contribution by Platform */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '400px', padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', margin: 0 }}>
          不同雲端平台的成交收益佔比
        </h3>
        <div style={{ flex: 1, width: '100%', height: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={platformData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${percent !== undefined ? (percent * 100).toFixed(0) : '0'}%`}
              >
                {platformData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `$${Number(value || 0).toLocaleString()} USD`} />
              <Legend verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
