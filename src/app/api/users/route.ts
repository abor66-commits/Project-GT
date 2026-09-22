import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logAction } from '@/lib/audit';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'update') {
      const { id, name, role, status, department, jobTitle, region, password, defaultLanguage, exclusiveMode } = data;
      if (!id || !name || !role) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      const updateData: any = { name, role, status, department, jobTitle, region, defaultLanguage, exclusiveMode };
      if (password && password.trim() !== '') updateData.password = password;
      const user = await prisma.user.update({ where: { id }, data: updateData });
      await logAction('UPDATE_USER', 'UserManagement', `Updated user: ${user.email} (Role: ${role}, Status: ${status})`);
      return NextResponse.json({ success: true });
    }

    if (action === 'resendInvitation') {
      const { userId } = data;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return NextResponse.json({ error: '找不到使用者' }, { status: 404 });
      const { sendEmail } = await import('@/lib/mail');
      const platformUrlSetting = await prisma.systemSetting.findUnique({ where: { key: 'PLATFORM_URL' } });
      const appUrl = platformUrlSetting?.value || process.env.NEXT_PUBLIC_APP_URL || 'https://gcscrm.up.railway.app';
      const defaultLanguage = user.defaultLanguage || 'zh-TW';
      
      let subject = 'GCS CRM - 您的平台邀請 (重新發送)';
      let greeting = `您好，${user.name}，`;
      let roleText = user.role === 'SALES' ? '業務專員' : user.role === 'MARKETING' ? '行銷專員' : user.role === 'MANAGER' ? '部門主管' : '系統管理員';
      let message1 = `管理員再次邀請您加入 GCS CRM 平台，身分為：<strong>${roleText}</strong>`;
      let message2 = `請點擊以下連結完成帳號設置並綁定兩步驟驗證 (2FA)：`;
      let buttonText = `完成帳號設置`;
      let footer1 = `如果您沒有預期收到此郵件，請忽略。此邀請鏈接長期有效。`;

      if (defaultLanguage === 'en') {
          subject = 'GCS CRM - Invitation to join the team (Resend)';
          greeting = `Hello ${user.name},`;
          roleText = user.role === 'SALES' ? 'Sales Specialist' : user.role === 'MARKETING' ? 'Marketing Specialist' : user.role === 'MANAGER' ? 'Department Manager' : 'System Administrator';
          message1 = `An administrator has resent your invitation to join the GCS CRM team as a <strong>${roleText}</strong>.`;
          message2 = `Please click the button below to complete your account setup and enable Two-Factor Authentication (2FA):`;
          buttonText = `Complete Account Setup`;
          footer1 = `If you did not expect to receive this email, please ignore it. This invitation link is valid indefinitely.`;
      } else if (defaultLanguage === 'ja') {
          subject = 'GCS CRM - チームへの招待 (再送)';
          greeting = `${user.name} 様、`;
          roleText = user.role === 'SALES' ? '営業スペシャリスト' : user.role === 'MARKETING' ? 'マーケティングスペシャリスト' : user.role === 'MANAGER' ? '部門管理者' : 'システム管理者';
          message1 = `管理者があなたを GCS CRM チームの <strong>${roleText}</strong> として再度招待しました。`;
          message2 = `以下のボタンをクリックしてアカウント設定を完了し、2要素認証 (2FA) を有効にしてください：`;
          buttonText = `アカウント設定を完了する`;
          footer1 = `このメールに心当たりがない場合は、無視してください。この招待リンクは無期限で有効です。`;
      }

      await sendEmail({
        to: user.email,
        subject: subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 16px; background: white;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #1e40af; font-size: 1.5rem; font-weight: 900; margin: 0;">GCS CRM</h1>
              <p style="color: #64748b; font-size: 0.9rem;">昕奇雲端客戶管理系統</p>
            </div>
            
            <h2 style="color: #0f172a; margin-bottom: 16px;">${greeting}</h2>
            <p style="color: #475569; font-size: 1rem; line-height: 1.6;">
              ${message1}
            </p>
            <p style="color: #475569; font-size: 1rem; line-height: 1.6;">
              ${message2}
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${appUrl}/register?lang=${defaultLanguage}" style="background: #2563eb; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);">
                ${buttonText}
              </a>
            </div>
            
            <p style="color: #94a3b8; font-size: 0.8rem; text-align: center;">
              ${footer1}
            </p>
            
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
            <p style="color: #64748b; font-size: 0.75rem; text-align: center;">© 2026 GCS CRM Platform - GrandTech Cloud Services</p>
          </div>
        `
      });
      await logAction('RESEND_INVITATION', 'UserManagement', `Resent invitation to: ${user.email}`);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      const { id } = data;
      const session = await getSession();
      if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: '只有系統管理員可以刪除成員' }, { status: 403 });
      if (session.id === id) return NextResponse.json({ error: '您不能刪除自己的帳號' }, { status: 400 });
      const userToDelete = await prisma.user.findUnique({ where: { id } });
      if (!userToDelete) return NextResponse.json({ error: '找不到使用者' }, { status: 404 });
      await prisma.$transaction([
        prisma.company.updateMany({ where: { ownerId: id }, data: { ownerId: session.id } }),
        prisma.opportunity.updateMany({ where: { ownerId: id }, data: { ownerId: session.id } }),
        prisma.activity.updateMany({ where: { ownerId: id }, data: { ownerId: session.id } }),
        prisma.user.delete({ where: { id } }),
      ]);
      await logAction('DELETE_USER', 'UserManagement', `Deleted user: ${userToDelete.email}`);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json({ error: '操作失敗' }, { status: 500 });
  }
}
