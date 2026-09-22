import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: '請先登入' }, { status: 401 });

    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'create') {
      const contact = await prisma.contact.create({
        data: { ...data, createdById: session.id }
      });
      return NextResponse.json({ success: true, id: contact.id });
    }

    if (action === 'update') {
      const { id, companyId, ...updateData } = data;
      const contact = await prisma.contact.findUnique({ where: { id } });
      if (!contact) return NextResponse.json({ error: '聯絡人不存在' }, { status: 404 });
      const isAdminOrManager = session.role === 'ADMIN' || session.role === 'MANAGER';
      if (!isAdminOrManager && contact.createdById !== session.id) {
        return NextResponse.json({ error: '您沒有修改此聯絡人的權限' }, { status: 403 });
      }
      await prisma.contact.update({ where: { id }, data: updateData });
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      const { id } = data;
      const contact = await prisma.contact.findUnique({ where: { id } });
      if (!contact) return NextResponse.json({ error: '聯絡人不存在' }, { status: 404 });
      const isAdminOrManager = session.role === 'ADMIN' || session.role === 'MANAGER';
      if (!isAdminOrManager && contact.createdById !== session.id) {
        return NextResponse.json({ error: '您沒有刪除此聯絡人的權限' }, { status: 403 });
      }
      await prisma.contact.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Contacts API error:', error);
    return NextResponse.json({ error: '操作失敗' }, { status: 500 });
  }
}
