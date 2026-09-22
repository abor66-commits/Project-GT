import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logAction } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: '請填寫所有欄位' }, { status: 400 });
    }

    const verification = await prisma.verificationCode.findFirst({
      where: { email, code, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: 'desc' }
    });

    if (!verification) {
      await logAction('RESET_PASSWORD_FAILED', 'Auth', `Invalid reset code for: ${email}`);
      return NextResponse.json({ error: '驗證碼錯誤或已過期' }, { status: 400 });
    }

    await prisma.user.update({
      where: { email },
      data: { password: newPassword }
    });

    await prisma.verificationCode.deleteMany({ where: { email } });
    await logAction('RESET_PASSWORD_SUCCESS', 'Auth', `Password reset successful for: ${email}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: '重設密碼失敗，請稍後再試' }, { status: 500 });
  }
}
