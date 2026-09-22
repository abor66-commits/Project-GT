import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { userId, name, department, jobTitle, password } = await request.json();
    if (!userId || !name) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    const updateData: any = { name, department, jobTitle };
    if (password && password.trim() !== '') updateData.password = password;
    await prisma.user.update({ where: { id: userId }, data: updateData });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: '更新失敗' }, { status: 500 });
  }
}
