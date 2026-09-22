import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logAction } from '@/lib/audit';
import { sendEmail } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    const { email, lang } = await request.json();

    if (!email) {
      return NextResponse.json({ error: '請提供電子郵件' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success to avoid email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.verificationCode.create({ data: { email, code, expiresAt } });
    await logAction('RESET_PASSWORD_REQUEST', 'Auth', `Password reset requested for: ${email}`);

    const defaultLanguage = lang || user.defaultLanguage || 'zh-TW';

    let subject = 'GCS CRM - 重設密碼驗證碼';
    let title = '重設您的密碼';
    let message = '您正在嘗試重設 GCS CRM 帳號密碼。請在重設頁面輸入以下驗證碼：';
    let expireText = '此驗證碼將在 10 分鐘後過期。如果您沒有請求此代碼，請忽略此郵件。';

    if (defaultLanguage === 'en') {
      subject = 'GCS CRM - Password Reset Code';
      title = 'Reset Your Password';
      message = 'You are attempting to reset your GCS CRM password. Please enter the following code on the reset page:';
      expireText = 'This code will expire in 10 minutes. If you did not request this code, please ignore this email.';
    } else if (defaultLanguage === 'ja') {
      subject = 'GCS CRM - パスワードリセットコード';
      title = 'パスワードのリセット';
      message = 'GCS CRMのパスワードをリセットしようとしています。リセットページで以下の認証コードを入力してください：';
      expireText = 'このコードは10分後に有効期限が切れます。このリクエストに心当たりがない場合は、このメールを無視してください。';
    }

    await sendEmail({
      to: email,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0f172a; margin-bottom: 16px;">${title}</h2>
          <p style="color: #475569; font-size: 1rem; line-height: 1.5;">${message}</p>
          <div style="background: #f8fafc; padding: 24px; text-align: center; border-radius: 8px; margin: 24px 0;">
            <span style="font-size: 2.5rem; font-weight: 800; letter-spacing: 0.2em; color: #3b82f6;">${code}</span>
          </div>
          <p style="color: #94a3b8; font-size: 0.875rem;">${expireText}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #64748b; font-size: 0.75rem; text-align: center;">© 2026 GCS CRM Platform</p>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: '寄送郵件失敗，請稍後再試' }, { status: 500 });
  }
}
