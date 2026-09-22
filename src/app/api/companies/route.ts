import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logAction } from '@/lib/audit';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// POST /api/companies - create
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: '未授權' }, { status: 401 });

    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'create') {
      const { contactName, contactEmail, contactPhone, contactTitle, ...companyData } = data;
      const result = await prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: { ...companyData, status: companyData.status || 'POTENTIAL' }
        });
        if (contactName) {
          await tx.contact.create({
            data: {
              name: contactName,
              email: contactEmail || '',
              phone: contactPhone || '',
              jobTitle: contactTitle || '聯絡窗口',
              companyId: company.id,
              isPrimary: true
            }
          });
        }
        return company;
      });
      await logAction('CREATE_COMPANY', 'CRM', `Created company: ${result.name}`);
      return NextResponse.json({ success: true, id: result.id });
    }

    if (action === 'update') {
      const { id, ...updateData } = data;
      const existing = await prisma.company.findUnique({ where: { id }});
      if (session.role !== 'ADMIN' && session.role !== 'MANAGER' && existing?.ownerId !== session.id && existing?.salesDeputy !== session.id) {
         return NextResponse.json({ error: '您沒有權限修改這筆資料' }, { status: 403 });
      }
      const company = await prisma.company.update({ where: { id }, data: updateData });
      await logAction('UPDATE_COMPANY', 'CRM', `Updated company: ${company.name}`);
      revalidatePath('/companies');
      revalidatePath(`/companies/${id}`);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      const { id } = data;
      const company = await prisma.company.findUnique({ where: { id }, select: { name: true, ownerId: true } });
      if (!company) return NextResponse.json({ error: '找不到該客戶資料' }, { status: 404 });
      if (session.role !== 'ADMIN' && session.role !== 'MANAGER' && company.ownerId !== session.id) {
        return NextResponse.json({ error: '您沒有權限刪除其他人的客戶資料' }, { status: 403 });
      }
      const contacts = await prisma.contact.findMany({ where: { companyId: id }, select: { id: true } });
      const contactIds = contacts.map(c => c.id);
      await prisma.$transaction([
        prisma.activity.deleteMany({ where: { relatedType: 'COMPANY', relatedId: id } }),
        prisma.activity.deleteMany({ where: { relatedType: 'CONTACT', relatedId: { in: contactIds } } }),
        prisma.contact.deleteMany({ where: { companyId: id } }),
        prisma.opportunity.deleteMany({ where: { companyId: id } }),
        prisma.company.delete({ where: { id } }),
      ]);
      await logAction('DELETE_COMPANY', 'CRM', `Deleted company: ${company.name}`);
      return NextResponse.json({ success: true });
    }

    if (action === 'bulkUpsert') {
      const { companies } = data;
      const results = [];
      for (const c of companies) {
        const existing = await prisma.company.findFirst({ where: { name: c.name } });
        if (existing) {
          results.push(await prisma.company.update({ where: { id: existing.id }, data: c }));
        } else {
          results.push(await prisma.company.create({ data: c }));
        }
      }
      await logAction('BULK_IMPORT', 'CRM', `Imported ${results.length} companies`);
      return NextResponse.json({ success: true, count: results.length });
    }

    if (action === 'export') {
      const isRestricted = session.role === 'SALES' && session.exclusiveMode === true;
      const exclusiveFilter = isRestricted ? {
        OR: [
          { ownerId: session.id },
          { salesDeputy: session.id }
        ]
      } : {};

      const companies = await prisma.company.findMany({
        where: exclusiveFilter,
        include: { owner: { select: { name: true } }, contacts: { where: { isPrimary: true }, take: 1 } },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json({ success: true, data: companies });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Companies API error:', error);
    return NextResponse.json({ error: '操作失敗' }, { status: 500 });
  }
}
