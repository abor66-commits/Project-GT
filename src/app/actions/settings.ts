'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { logAction } from '@/lib/audit';

export async function updateSystemLogo(dataUrl: string) {
  // Store the logo in the SystemSetting table
  try {
    await prisma.systemSetting.upsert({
      where: { key: 'SYSTEM_LOGO' },
      update: { value: dataUrl },
      create: { key: 'SYSTEM_LOGO', value: dataUrl },
    });

    revalidatePath('/', 'layout'); // Revalidate the whole layout so dashboard re-fetches the logo
    return { success: true };
  } catch (error) {
    console.error('[updateSystemLogo] Failed:', error);
    return { success: false, error: String(error) };
  }
}

export async function getSystemLogo() {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'SYSTEM_LOGO' },
  });
  return setting?.value || '/logo.png';
}

export async function getSetting(key: string) {
  const setting = await prisma.systemSetting.findUnique({
    where: { key },
  });
  return setting?.value || '';
}

export async function updateSetting(key: string, value: string) {
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  
  await logAction('UPDATE_SETTING', 'System', `Updated system setting: ${key}`);
  revalidatePath('/settings');
}

export async function getAuditLogs(skip: number = 0, take: number = 20) {
  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take
    }),
    prisma.auditLog.count()
  ]);
  
  return { logs, totalCount };
}

import { sendEmail } from '@/lib/mail';

export async function testSMTPConnection(toEmail: string) {
  const result = await sendEmail({
    to: toEmail,
    subject: 'GCS CRM - SMTP 測試郵件',
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #10b981;">✅ SMTP 連線測試成功</h2>
        <p>這是一封來自 GCS CRM 的測試郵件，代表您的 SMTP 設定已生效。</p>
        <p style="color: #64748b; font-size: 0.8rem; margin-top: 20px;">發送時間: ${new Date().toLocaleString()}</p>
      </div>
    `,
    text: 'GCS CRM - SMTP 測試郵件成功'
  });

  if (result.success) {
    await logAction('TEST_SMTP', 'System', `Successfully tested SMTP connection to: ${toEmail}`);
  } else {
    await logAction('TEST_SMTP_FAILED', 'System', `Failed SMTP test to: ${toEmail}`);
  }

  return result;
}
