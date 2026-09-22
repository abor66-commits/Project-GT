import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logAction } from '@/lib/audit';
import { cookies } from 'next/headers';
import { verifyPassword, signSession } from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: '請填寫帳號與密碼' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !verifyPassword(password, user.password)) {
      await logAction('LOGIN_FAILED', 'Auth', `Failed attempt for email: ${email}`);
      return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      path: '/',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
    };

    cookieStore.set('user_id', user.id, cookieOptions);
    cookieStore.set('user_role', user.role, cookieOptions);
    cookieStore.set('user_name', encodeURIComponent(user.name), cookieOptions);
    cookieStore.set('user_email', signSession(user.email), cookieOptions);

    await logAction('LOGIN_SUCCESS', 'Auth', `User logged in: ${email}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '系統發生錯誤，請稍後再試' }, { status: 500 });
  }
}
