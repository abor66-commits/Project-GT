'use client';

import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface PaginationProps {
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

export default function Pagination({ totalCount, currentPage, pageSize }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const totalPages = Math.ceil(totalCount / pageSize);
  
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleLimitChange = (limit: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('limit', limit);
    params.set('page', '1'); // Reset to first page when limit changes
    router.push(`${pathname}?${params.toString()}`);
  };

  if (totalPages <= 1 && totalCount <= 20) return null;

  return (
    <div className="mobile-wrap" style={{ 
      padding: '16px 20px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      background: 'transparent',
      borderTop: '1px solid var(--border-color)'
    }}>
      <div className="flex items-center gap-md mobile-pagination-info">
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalCount)} 筆，共 {totalCount} 筆
        </span>
        <select 
          value={pageSize} 
          onChange={(e) => handleLimitChange(e.target.value)}
          style={{ 
            padding: '4px 8px', 
            borderRadius: '6px', 
            border: 'var(--card-border-custom, 1px solid var(--border-color))',
            background: 'var(--bg-card-custom, var(--bg-card))',
            color: 'var(--text-main-custom, var(--text-main))',
            fontSize: '0.85rem',
            outline: 'none'
          }}
        >
          <option value="20">20 / 頁</option>
          <option value="50">50 / 頁</option>
          <option value="100">100 / 頁</option>
        </select>
      </div>

      <div className="flex gap-sm">
        <button 
          className="btn-ghost" 
          disabled={currentPage <= 1}
          onClick={() => handlePageChange(currentPage - 1)}
          style={{ padding: '6px 12px', fontSize: '0.85rem', opacity: currentPage <= 1 ? 0.5 : 1 }}
        >
          上一頁
        </button>
        
        <div className="flex items-center gap-sm desktop-only">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Simple pagination logic for 5 pages
            let pageNum = 1;
            if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 2 + i;
                if (pageNum > totalPages) pageNum = totalPages - (4 - i);
            } else {
                pageNum = i + 1;
            }
            if (pageNum > totalPages) return null;

            return (
              <button 
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: currentPage === pageNum ? 'var(--primary)' : 'transparent',
                  color: currentPage === pageNum ? '#fff' : 'var(--text-main)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button 
          className="btn-ghost" 
          disabled={currentPage >= totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          style={{ padding: '6px 12px', fontSize: '0.85rem', opacity: currentPage >= totalPages ? 0.5 : 1 }}
        >
          下一頁
        </button>
      </div>
    </div>
  );
}
