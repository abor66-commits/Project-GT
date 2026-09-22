import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

async function logAction(action: string, resource: string, details: string, userId?: string, userName?: string, ipAddress?: string) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? 'system',
        userName: userName ?? 'system',
        action,
        resource,
        details,
        ipAddress,
      },
    });
  } catch (_) {}
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value;
  const userName = cookieStore.get('user_name')?.value;

  if (userEmail) {
    const ip = request.headers.get('x-forwarded-for') ?? undefined;
    await logAction('LOGOUT', 'Auth', `User logged out: ${userEmail}`, userEmail, userName, ip);
  }

  cookieStore.delete('user_id');
  cookieStore.delete('user_role');
  cookieStore.delete('user_name');
  cookieStore.delete('user_email');

  return NextResponse.json({ success: true });
}
