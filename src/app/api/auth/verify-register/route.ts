import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logAction } from '@/lib/audit';
import { hashPassword } from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    const { email, code, password } = await request.json();

    if (!email || !code || !password) {
      return NextResponse.json({ error: '請填寫所有欄位' }, { status: 400 });
    }

    const verification = await prisma.verificationCode.findFirst({
      where: { email, code, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: 'desc' }
    });

    if (!verification) {
      await logAction('VERIFY_2FA_FAILED', 'Auth', `Invalid code for: ${email}`);
      return NextResponse.json({ error: '驗證碼錯誤或已過期' }, { status: 400 });
    }

    await prisma.user.update({
      where: { email },
      data: { password: hashPassword(password), status: 'APPROVED' }
    });

    await logAction('REGISTER_COMPLETE', 'Auth', `Registration finished for: ${email}`);
    await prisma.verificationCode.deleteMany({ where: { email } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify registration error:', error);
    return NextResponse.json({ error: '驗證失敗，請稍後再試' }, { status: 500 });
  }
}
