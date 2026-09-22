// src/app/(dashboard)/opportunities/add/page.tsx
import React from 'react';
import { prisma } from '@/lib/db';
import { getSalesUsers } from '@/app/actions/users';
import AddOpportunityForm from '@/components/AddOpportunityForm';

export const dynamic = 'force-dynamic'; // ensure server side fetch

export default async function AddOpportunityPage() {
  const [companies, users] = await Promise.all([
    prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    getSalesUsers(),
  ]);

  return (
    <div className="container" style={{ padding: '24px' }}>
      <AddOpportunityForm companies={companies} users={users} />
    </div>
  );
}
