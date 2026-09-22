'use server';

import { prisma } from '@/lib/db';

import { getSession } from '@/lib/auth';

export async function globalSearch(query: string) {
  if (!query || query.length < 1) return { companies: [], contacts: [], opportunities: [], tags: [] };

  const session = await getSession();
  const isRestricted = session?.role === 'SALES' && session?.exclusiveMode === true;
  
  const companyFilter = isRestricted ? { OR: [{ ownerId: session.id }, { salesDeputy: session.id }] } : {};
  const oppFilter = isRestricted ? { OR: [{ ownerId: session.id }, { company: { salesDeputy: session.id } }] } : {};
  const contactFilter = isRestricted ? { company: { OR: [{ ownerId: session.id }, { salesDeputy: session.id }] } } : {};

  const [companies, contacts, opportunities, tags] = await Promise.all([
    // Search Companies
    prisma.company.findMany({
      where: {
        AND: [
          { OR: [{ name: { contains: query } }, { website: { contains: query } }] },
          companyFilter
        ]
      },
      take: 5,
      select: { id: true, name: true }
    }),
    // Search Contacts
    prisma.contact.findMany({
      where: {
        AND: [
          { OR: [{ name: { contains: query } }, { email: { contains: query } }] },
          contactFilter
        ]
      },
      take: 5,
      select: { id: true, name: true, companyId: true, company: { select: { name: true } } }
    }),
    // Search Opportunities
    prisma.opportunity.findMany({
      where: {
        AND: [
          { OR: [{ name: { contains: query } }, { company: { name: { contains: query } } }] },
          oppFilter
        ]
      },
      take: 5,
      select: { id: true, name: true, company: { select: { name: true } } }
    }),
    // Search Tags
    prisma.tag.findMany({
      where: { name: { contains: query } },
      take: 5,
      select: { id: true, name: true, _count: { select: { companies: true } } }
    })
  ]);

  return { companies, contacts, opportunities, tags };
}
