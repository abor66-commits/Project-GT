import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') ?? '';

  if (!query || query.length < 1) {
    return NextResponse.json({ companies: [], contacts: [], opportunities: [], tags: [] });
  }

  const [companies, contacts, opportunities, tags] = await Promise.all([
    prisma.company.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { website: { contains: query } },
        ]
      },
      take: 5,
      select: { id: true, name: true }
    }),
    prisma.contact.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
        ]
      },
      take: 5,
      select: { id: true, name: true, companyId: true, company: { select: { name: true } } }
    }),
    prisma.opportunity.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { company: { name: { contains: query } } },
        ]
      },
      take: 5,
      select: { id: true, name: true, company: { select: { name: true } } }
    }),
    prisma.tag.findMany({
      where: { name: { contains: query } },
      take: 5,
      select: { id: true, name: true, _count: { select: { companies: true } } }
    })
  ]);

  return NextResponse.json({ companies, contacts, opportunities, tags });
}
