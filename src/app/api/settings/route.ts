import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: '未授權' }, { status: 401 });

    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'updateLogo') {
      const { dataUrl } = data;
      await prisma.systemSetting.upsert({
        where: { key: 'SYSTEM_LOGO' },
        update: { value: dataUrl },
        create: { key: 'SYSTEM_LOGO', value: dataUrl },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'updateSetting') {
      const { key, value } = data;
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json({ error: '操作失敗' }, { status: 500 });
  }
}
