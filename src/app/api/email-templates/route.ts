import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: '未登入' }, { status: 401 });

    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'save') {
      const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(session.role ?? '');
      const isShared = isAdminOrManager ? data.isShared : false;
      if (!data.name?.trim() || !data.content?.trim()) {
        return NextResponse.json({ error: '請填寫模板名稱與內容' }, { status: 400 });
      }
      const template = await prisma.emailTemplate.create({
        data: { name: data.name.trim(), subject: data.subject?.trim() || null, content: data.content, isShared, createdById: session.id }
      });
      return NextResponse.json({ success: true, template });
    }

    if (action === 'delete') {
      const { id } = data;
      const template = await prisma.emailTemplate.findUnique({ where: { id } });
      if (!template) return NextResponse.json({ error: '找不到模板' }, { status: 404 });
      const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(session.role ?? '');
      if (template.createdById !== session.id && !isAdminOrManager) {
        return NextResponse.json({ error: '無權限刪除此模板' }, { status: 403 });
      }
      await prisma.emailTemplate.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Email templates API error:', error);
    return NextResponse.json({ error: '操作失敗' }, { status: 500 });
  }
}
