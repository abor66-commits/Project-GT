'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { logAction } from '@/lib/audit';
import { verifyPassword, hashPassword, signSession } from '@/lib/crypto';

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !verifyPassword(password, user.password)) {
      await logAction('LOGIN_FAILED', 'Auth', `Failed attempt for email: ${email}`);
      return { error: '帳號或密碼錯誤' };
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieStore = await cookies();
    const cookieOptions = { 
      httpOnly: true, 
      secure: isProduction, 
      path: '/',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    };

    cookieStore.set('user_id', user.id, cookieOptions);
    cookieStore.set('user_role', user.role, cookieOptions);
    cookieStore.set('user_name', encodeURIComponent(user.name), cookieOptions);
    cookieStore.set('user_email', signSession(user.email), cookieOptions);

    await logAction('LOGIN_SUCCESS', 'Auth', `User logged in: ${email}`);
  } catch (error) {
    console.error('Login error:', error);
    return { error: '系統發生錯誤，請稍後再試' };
  }
  
  redirect('/');
}

export async function logout() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value;
  
  if (userEmail) {
    await logAction('LOGOUT', 'Auth', `User logged out: ${userEmail}`);
  }
  
  cookieStore.delete('user_id');
  cookieStore.delete('user_role');
  cookieStore.delete('user_name');
  cookieStore.delete('user_email');
  redirect('/login');
}

import { sendEmail } from '@/lib/mail';

export async function sendVerificationCode(email: string, purpose: 'REGISTRATION' | 'RESET_PASSWORD' = 'REGISTRATION') {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Security Check: Only allow registration code for invited (PENDING) users
  if (purpose === 'REGISTRATION') {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('此電子郵件未受邀或帳號不存在');
    }
    if (user.status === 'APPROVED') {
      throw new Error('此帳號已啟用，請直接登入');
    }
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  await prisma.verificationCode.create({
    data: {
      email,
      code,
      expiresAt
    }
  });

  await logAction('SEND_2FA', 'Auth', `2FA code sent to: ${email}`);
  
  const subject = purpose === 'REGISTRATION' ? 'GCS CRM - 您的驗證碼' : 'GCS CRM - 重設密碼驗證碼';
  const title = purpose === 'REGISTRATION' ? '驗證您的帳號' : '重設您的密碼';
  const message = purpose === 'REGISTRATION' 
    ? '您正在設置 GCS CRM 帳號。請在註冊頁面輸入以下驗證碼：' 
    : '您正在嘗試重設 GCS CRM 帳號密碼。請在重設頁面輸入以下驗證碼：';

  // Send actual email using the mail utility
  await sendEmail({
    to: email,
    subject: subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; borderRadius: 12px;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">${title}</h2>
        <p style="color: #475569; font-size: 1rem; line-height: 1.5;">${message}</p>
        <div style="background: #f8fafc; padding: 24px; text-align: center; border-radius: 8px; margin: 24px 0;">
          <span style="font-size: 2.5rem; font-weight: 800; letter-spacing: 0.2em; color: #3b82f6;">${code}</span>
        </div>
        <p style="color: #94a3b8; font-size: 0.875rem;">此驗證碼將在 10 分鐘後過期。如果您沒有請求此代碼，請忽略此郵件。</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 0.75rem; text-align: center;">© 2026 GCS CRM Platform</p>
      </div>
    `
  });

  console.log(`[2FA] Code for ${email}: ${code}`);
  return { success: true, code }; // Return code for demo purposes
}

export async function verifyCodeAndFinishRegistration(email: string, code: string, password: string) {
  const verification = await prisma.verificationCode.findFirst({
    where: { email, code, expiresAt: { gte: new Date() } },
    orderBy: { createdAt: 'desc' }
  });

  if (!verification) {
    await logAction('VERIFY_2FA_FAILED', 'Auth', `Invalid code for: ${email}`);
    throw new Error('驗證碼錯誤或已過期');
  }

  await prisma.user.update({
    where: { email },
    data: {
      password: hashPassword(password),
      status: 'APPROVED'
    }
  });

  await logAction('REGISTER_COMPLETE', 'Auth', `Registration finished for: ${email}`);

  // Cleanup codes
  await prisma.verificationCode.deleteMany({ where: { email } });

  return { success: true };
}

export async function requestPasswordReset(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: true, message: '如果帳號存在，驗證碼已寄送到您的信箱' };
  }

  const result = await sendVerificationCode(email, 'RESET_PASSWORD');
  if (result.success) {
    await logAction('RESET_PASSWORD_REQUEST', 'Auth', `Password reset requested for: ${email}`);
    return { success: true, message: '驗證碼已寄送到您的信箱' };
  } else {
    return { error: '寄送郵件失敗，請稍後再試' };
  }
}

export async function resetPassword(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const code = formData.get('code') as string;
  const newPassword = formData.get('newPassword') as string;

  if (!email || !code || !newPassword) {
    return { error: '請填寫所有欄位' };
  }

  const verification = await prisma.verificationCode.findFirst({
    where: { email, code, expiresAt: { gte: new Date() } },
    orderBy: { createdAt: 'desc' }
  });

  if (!verification) {
    await logAction('RESET_PASSWORD_FAILED', 'Auth', `Invalid reset code for: ${email}`);
    return { error: '驗證碼錯誤或已過期' };
  }

  await prisma.user.update({
    where: { email },
    data: { password: hashPassword(newPassword) }
  });

  // Cleanup
  await prisma.verificationCode.deleteMany({ where: { email } });
  await logAction('RESET_PASSWORD_SUCCESS', 'Auth', `Password reset successful for: ${email}`);

  return { success: true };
}
