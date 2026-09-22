'use server';

import { sendEmail } from '@/lib/mail';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function sendFeedbackAction(feedback: string, screenshots: string[] = []) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    const user = session;
    
    // Try to find a configured recipient email, or fallback to a default
    const recipientSetting = await prisma.systemSetting.findUnique({
      where: { key: 'FEEDBACK_RECIPIENT' }
    });
    
    const recipient = recipientSetting?.value || 'Jacobchou@grandtechcloud.com';

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background: #f97316; padding: 20px; color: white;">
          <h2 style="margin: 0;">GCS CRM - 收到新的意見回饋</h2>
        </div>
        <div style="padding: 24px;">
          <p><strong>來自使用者:</strong> ${user.name} (${user.email})</p>
          <p><strong>角色:</strong> ${user.role}</p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #f97316;">
            <p style="white-space: pre-wrap; margin: 0;">${feedback}</p>
          </div>
          
          ${screenshots.length > 0 ? `
            <h3>附件截圖 (${screenshots.length})</h3>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              ${screenshots.map((s, i) => `
                <div style="margin-bottom: 10px;">
                  <img src="${s}" style="max-width: 100%; border-radius: 8px; border: 1px solid #e2e8f0;" alt="Screenshot ${i + 1}" />
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <p style="color: #64748b; font-size: 0.8rem; margin-top: 24px; border-top: 1px solid #e2e8f0; pt: 16px;">
            發送時間: ${new Date().toLocaleString('zh-TW')}
          </p>
        </div>
      </div>
    `;

    const result = await sendEmail({
      to: recipient,
      subject: `[Feedback] 來自 ${user.name} 的意見回饋`,
      html,
      text: `使用者 ${user.name} (${user.email}) 提交了回饋：\n\n${feedback}`
    });

    return result;
  } catch (error) {
    console.error('[Feedback Action Error]', error);
    return { success: false, error: (error as Error).message };
  }
}
