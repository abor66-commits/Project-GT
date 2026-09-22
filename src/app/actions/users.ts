'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { logAction } from '@/lib/audit';
import { hashPassword } from '@/lib/crypto';

export async function updateUser(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const role = formData.get('role') as string;
  const status = formData.get('status') as string;
  const department = formData.get('department') as string;
  const jobTitle = formData.get('jobTitle') as string;
  const region = formData.get('region') as string;
  const password = formData.get('password') as string;
  const defaultLanguage = formData.get('defaultLanguage') as string;
  const exclusiveMode = formData.get('exclusiveMode') === 'true';

  if (!id || !name || !role) {
    throw new Error('Missing required fields');
  }

  const updateData: any = {
    name,
    role,
    status,
    department,
    jobTitle,
    region,
    defaultLanguage,
    exclusiveMode,
  };

  // Only update password if a new one is provided
  if (password && password.trim() !== '') {
    updateData.password = hashPassword(password); 
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  await logAction('UPDATE_USER', 'UserManagement', `Updated user: ${updatedUser.email} (Role: ${role}, Status: ${status})`);

  revalidatePath('/users');
  revalidatePath('/');
}

export async function getSalesUsers() {
  return await prisma.user.findMany({
    where: { role: { in: ['SALES', 'MARKETING'] }, status: 'APPROVED' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });
}
import { sendEmail } from '@/lib/mail';

export async function inviteUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const role = formData.get('role') as string;
  const defaultLanguage = (formData.get('defaultLanguage') as string) || 'zh-TW';

  if (!name || !email || !role) {
    throw new Error('Missing fields');
  }

  // Create the pending user in database
  await prisma.user.create({
    data: {
      name,
      email,
      role,
      status: 'PENDING',
      password: 'TEMPORARY_PASSWORD_SET_DURING_REGISTRATION',
      defaultLanguage
    }
  });

  await logAction('INVITE_USER', 'UserManagement', `Invited user: ${email} as ${role}`);

  // Send invitation email via Resend
  try {
    const platformUrlSetting = await prisma.systemSetting.findUnique({ where: { key: 'PLATFORM_URL' } });
    const appUrl = platformUrlSetting?.value || process.env.NEXT_PUBLIC_APP_URL || 'https://gcscrm.up.railway.app';
    
    let subject = 'GCS CRM - 邀請您加入團隊';
    let greeting = `您好 ${name}，`;
    let roleText = role === 'SALES' ? '業務專員' : role === 'MARKETING' ? '行銷專員' : role === 'MANAGER' ? '部門管理員' : '系統管理員';
    let message1 = `管理員已邀請您加入 GCS CRM 團隊，擔任 <strong>${roleText}</strong>。`;
    let message2 = `請點擊下方按鈕以完成帳號設置並啟用雙重驗證 (2FA)：`;
    let buttonText = `完成帳號設置`;
    let footer1 = `如果您沒有預期收到此郵件，請忽略。此邀請鏈接長期有效。`;

    if (defaultLanguage === 'en') {
        subject = 'GCS CRM - Invitation to join the team';
        greeting = `Hello ${name},`;
        roleText = role === 'SALES' ? 'Sales Specialist' : role === 'MARKETING' ? 'Marketing Specialist' : role === 'MANAGER' ? 'Department Manager' : 'System Administrator';
        message1 = `An administrator has invited you to join the GCS CRM team as a <strong>${roleText}</strong>.`;
        message2 = `Please click the button below to complete your account setup and enable Two-Factor Authentication (2FA):`;
        buttonText = `Complete Account Setup`;
        footer1 = `If you did not expect to receive this email, please ignore it. This invitation link is valid indefinitely.`;
    } else if (defaultLanguage === 'ja') {
        subject = 'GCS CRM - チームへの招待';
        greeting = `${name} 様、`;
        roleText = role === 'SALES' ? '営業スペシャリスト' : role === 'MARKETING' ? 'マーケティングスペシャリスト' : role === 'MANAGER' ? '部門管理者' : 'システム管理者';
        message1 = `管理者があなたを GCS CRM チームの <strong>${roleText}</strong> として招待しました。`;
        message2 = `以下のボタンをクリックしてアカウント設定を完了し、2要素認証 (2FA) を有効にしてください：`;
        buttonText = `アカウント設定を完了する`;
        footer1 = `このメールに心当たりがない場合は、無視してください。この招待リンクは無期限で有効です。`;
    }

    const emailResult = await sendEmail({
      to: email,
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
    
    revalidatePath('/users');
    
    if (!emailResult.success) {
      console.warn(`[Invite Email Warning] User created but email failed: ${emailResult.error || emailResult.message}`);
      return { success: true, message: `使用者已建立，但邀請信發送失敗（請檢查 SMTP 設定）：${emailResult.error || emailResult.message}` };
    }
    
    console.log(`[Invite Success] Invitation sent to ${email}`);
    return { success: true, message: '邀請已送出！' };
  } catch (error) {
    console.error('[Invite Email Error]', error);
    revalidatePath('/users');
    return { success: true, message: '使用者已建立，但邀請信發送時發生預期外的錯誤。' };
  }
}

export async function resendInvitation(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const platformUrlSetting = await prisma.systemSetting.findUnique({ where: { key: 'PLATFORM_URL' } });
  const appUrl = platformUrlSetting?.value || process.env.NEXT_PUBLIC_APP_URL || 'https://gcscrm.up.railway.app';

  await logAction('RESEND_INVITATION', 'UserManagement', `Resent invitation to: ${user.email}`);

  const defaultLanguage = user.defaultLanguage || 'zh-TW';

  let subject = 'GCS CRM - 重新發送邀請信';
  let greeting = `您好 ${user.name}，`;
  let message1 = `這是重新發送的邀請函。請點擊下方按鈕以完成帳號設置：`;
  let buttonText = `完成帳號設置`;

  if (defaultLanguage === 'en') {
      subject = 'GCS CRM - Resend Invitation';
      greeting = `Hello ${user.name},`;
      message1 = `This is a resent invitation. Please click the button below to complete your account setup:`;
      buttonText = `Complete Account Setup`;
  } else if (defaultLanguage === 'ja') {
      subject = 'GCS CRM - 招待メールの再送';
      greeting = `${user.name} 様、`;
      message1 = `これは再送された招待状です。以下のボタンをクリックしてアカウント設定を完了してください：`;
      buttonText = `アカウント設定を完了する`;
  }

  const emailResult = await sendEmail({
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
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${appUrl}/register?lang=${defaultLanguage}" style="background: #2563eb; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; display: inline-block;">
            ${buttonText}
          </a>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
        <p style="color: #64748b; font-size: 0.75rem; text-align: center;">© 2026 GCS CRM Platform</p>
      </div>
    `
  });

  if (!emailResult.success) {
    console.warn(`[Resend Email Warning] Resend failed: ${emailResult.error || emailResult.message}`);
    return { success: false, error: `重新寄送失敗（請檢查 SMTP 設定）：${emailResult.error || emailResult.message}` };
  }

  console.log(`[Resend Success] Invitation resent to ${user.email}`);
  return { success: true };
}

export async function deleteUser(userId: string) {
  // Re-verify admin permission
  const session = await (await import('@/lib/auth')).getSession();
  if (!session || session.role !== 'ADMIN') {
    throw new Error('只有系統管理員可以刪除成員');
  }

  if (session.id === userId) {
    throw new Error('您不能刪除自己的帳號');
  }

  const userToDelete = await prisma.user.findUnique({ where: { id: userId } });
  if (!userToDelete) throw new Error('User not found');

  // 在資料庫事務中執行擁有權轉移與刪除，以維護資料參照完整性與防止資料遺失
  await prisma.$transaction([
    // 1. 將該成員名下的所有客戶 (Company) 轉移至系統管理員名下
    prisma.company.updateMany({
      where: { ownerId: userId },
      data: { ownerId: session.id }
    }),
    // 2. 將該成員名下的所有商機 (Opportunity) 轉移至系統管理員名下
    prisma.opportunity.updateMany({
      where: { ownerId: userId },
      data: { ownerId: session.id }
    }),
    // 3. 將該成員產生的所有動態活動紀錄 (Activity) 轉移至系統管理員名下
    prisma.activity.updateMany({
      where: { ownerId: userId },
      data: { ownerId: session.id }
    }),
    // 4. 最後，安全刪除該成員帳號
    prisma.user.delete({
      where: { id: userId }
    })
  ]);

  await logAction('DELETE_USER', 'UserManagement', `Deleted user: ${userToDelete.email} (${userToDelete.name}), and reassigned their companies, opportunities, and activities to admin: ${session.name}`);

  revalidatePath('/users');
  return { success: true };
}
