import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'create') {
      const { companyId, userId, type, content } = data;
      if (!companyId || !userId || !content) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      await prisma.activity.create({
        data: { relatedType: 'COMPANY', relatedId: companyId, ownerId: userId, type, content }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Activity API error:', error);
    return NextResponse.json({ error: '操作失敗' }, { status: 500 });
  }
}
