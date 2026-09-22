'use client';

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';

export default function SortHeader({ 
  label, 
  field 
}: { 
  label: string; 
  field: string; 
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const currentSort = searchParams.get('sort');
  const currentOrder = searchParams.get('order');
  
  const isActive = currentSort === field;
  const nextOrder = isActive && currentOrder === 'asc' ? 'desc' : 'asc';
  
  // Create a new URLSearchParams object to keep other params (like page)
  const params = new URLSearchParams(searchParams.toString());
  params.set('sort', field);
  params.set('order', nextOrder);
  
  const icon = isActive ? (currentOrder === 'asc' ? '▴' : '▾') : '↕';

  return (
    <Link 
      href={`${pathname}?${params.toString()}`}
      style={{ 
        textDecoration: 'none', 
        color: isActive ? 'var(--primary)' : 'var(--text-muted)',
        fontWeight: isActive ? '800' : '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        cursor: 'pointer',
        userSelect: 'none'
      }}
      className="sort-header-hover"
    >
      {label}
      <span style={{ fontSize: '0.7rem', opacity: isActive ? 1 : 0.3 }}>{icon}</span>
    </Link>
  );
}
