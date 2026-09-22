import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'addTag') {
      const { companyId, tagId } = data;
      await prisma.company.update({
        where: { id: companyId },
        data: { tags: { connect: { id: tagId } } }
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'removeTag') {
      const { companyId, tagId } = data;
      await prisma.company.update({
        where: { id: companyId },
        data: { tags: { disconnect: { id: tagId } } }
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'createTag') {
      const { name, color } = data;
      const colors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const tag = await prisma.tag.create({ data: { name, color: color || randomColor } });
      return NextResponse.json({ success: true, tag });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Tags API error:', error);
    return NextResponse.json({ error: '操作失敗' }, { status: 500 });
  }
}
