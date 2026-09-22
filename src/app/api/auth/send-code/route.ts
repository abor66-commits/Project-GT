import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logAction } from '@/lib/audit';
import { sendEmail } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    const { email, purpose = 'REGISTRATION', lang } = await request.json();

    if (!email) {
      return NextResponse.json({ error: '請提供電子郵件' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: '此電子郵件未受邀或帳號不存在' }, { status: 404 });
    }

    if (purpose === 'REGISTRATION') {
      if (user.status === 'APPROVED') {
        return NextResponse.json({ error: '此帳號已啟用，請直接登入' }, { status: 400 });
      }
    }

    const defaultLanguage = lang || user.defaultLanguage || 'zh-TW';

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.verificationCode.create({ data: { email, code, expiresAt } });
    await logAction('SEND_2FA', 'Auth', `2FA code sent to: ${email}`);

    let subject = purpose === 'REGISTRATION' ? 'GCS CRM - 您的驗證碼' : 'GCS CRM - 重設密碼驗證碼';
    let title = purpose === 'REGISTRATION' ? '驗證您的帳號' : '重設您的密碼';
    let message = purpose === 'REGISTRATION'
      ? '您正在設置 GCS CRM 帳號。請在註冊頁面輸入以下驗證碼：'
      : '您正在嘗試重設 GCS CRM 帳號密碼。請在重設頁面輸入以下驗證碼：';
    let expireText = '此驗證碼將在 10 分鐘後過期。如果您沒有請求此代碼，請忽略此郵件。';

    if (defaultLanguage === 'en') {
      subject = purpose === 'REGISTRATION' ? 'GCS CRM - Your Verification Code' : 'GCS CRM - Password Reset Code';
      title = purpose === 'REGISTRATION' ? 'Verify Your Account' : 'Reset Your Password';
      message = purpose === 'REGISTRATION'
        ? 'You are setting up your GCS CRM account. Please enter the following code on the registration page:'
        : 'You are attempting to reset your GCS CRM password. Please enter the following code on the reset page:';
      expireText = 'This code will expire in 10 minutes. If you did not request this code, please ignore this email.';
    } else if (defaultLanguage === 'ja') {
      subject = purpose === 'REGISTRATION' ? 'GCS CRM - 認証コード' : 'GCS CRM - パスワードリセットコード';
      title = purpose === 'REGISTRATION' ? 'アカウントの確認' : 'パスワードのリセット';
      message = purpose === 'REGISTRATION'
        ? 'GCS CRMアカウントの設定を行っています。登録ページで以下の認証コードを入力してください：'
        : 'GCS CRMのパスワードをリセットしようとしています。リセットページで以下の認証コードを入力してください：';
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

    console.log(`[2FA] Code for ${email}: ${code}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send verification code error:', error);
    return NextResponse.json({ error: '寄送驗證碼失敗，請稍後再試' }, { status: 500 });
  }
}
