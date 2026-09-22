'use server';

import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/mail';
import { revalidatePath } from 'next/cache';

import { getSession } from '@/lib/auth';

export async function sendSegmentedEmail(tagName: string, subject: string, content: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: '未授權' };

    const isRestricted = session.role === 'SALES' && session.exclusiveMode === true;
    const companyFilter = isRestricted ? {
      OR: [
        { ownerId: session.id },
        { salesDeputy: session.id }
      ]
    } : {};

    // 1. Fetch companies with the tag
    const companies = await prisma.company.findMany({
      where: {
        AND: [
          { tags: { some: { name: tagName } } },
          companyFilter
        ]
      },
      include: {
        contacts: {
          where: { isPrimary: true }
        }
      }
    });

    if (companies.length === 0) {
      return { success: false, error: '找不到具有此標籤的客戶' };
    }

    // 2. Build a list of recipients with their company context
    type Recipient = { email: string; contactName: string; companyName: string };
    const recipients: Recipient[] = companies.flatMap(c =>
      c.contacts
        .filter(contact => !!contact.email)
        .map(contact => ({
          email: contact.email as string,
          contactName: contact.name,
          companyName: c.name,
        }))
    );

    if (recipients.length === 0) {
      return { success: false, error: '選定的客戶群中沒有有效的電子郵件' };
    }

    // 3. Send personalized emails — replace {{contactName}} and {{companyName}} per recipient
    let successCount = 0;
    let failCount = 0;

    for (const recipient of recipients) {
      const personalizedHtml = content
        .replace(/\{\{contactName\}\}/g, recipient.contactName)
        .replace(/\{\{companyName\}\}/g, recipient.companyName);
      const personalizedText = personalizedHtml.replace(/<[^>]*>?/gm, '');

      const result = await sendEmail({
        to: recipient.email,
        subject,
        html: personalizedHtml,
        text: personalizedText,
      });

      if (result.success) successCount++;
      else failCount++;
    }

    // 4. Log the event
    await prisma.marketingLog.create({
      data: {
        type: 'EMAIL_BROADCAST',
        target: tagName,
        details: `已成功發送 ${successCount} 封郵件${failCount > 0 ? `，失敗 ${failCount} 封` : ''}`
      }
    });

    return { 
      success: true, 
      message: `已成功發送 ${successCount} 封郵件${failCount > 0 ? `，失敗 ${failCount} 封` : ''}` 
    };
  } catch (error: any) {
    console.error('Email Broadcaster Error:', error);
    return { success: false, error: error.message || '發送過程中發生錯誤' };
  }
}

export async function createAutomationRule(data: {
  name: string,
  triggerType: string,
  triggerVal: string,
  actionType: string,
  content: string
}) {
  try {
    const rule = await prisma.automationRule.create({
      data: {
        ...data,
        isActive: true
      }
    });
    return { success: true, rule };
  } catch (error: any) {
    console.error('Create Automation Rule Error:', error);
    return { success: false, error: error.message || '無法建立規則' };
  }
}

export async function deleteAutomationRule(id: string) {
  try {
    await prisma.automationRule.delete({
      where: { id }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Delete Automation Rule Error:', error);
    return { success: false, error: error.message || '無法刪除規則' };
  }
}

export async function updateMarketingApiKey(newKey: string) {
  try {
    await prisma.systemSetting.upsert({
      where: { key: 'MARKETING_API_KEY' },
      update: { value: newKey },
      create: { key: 'MARKETING_API_KEY', value: newKey }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Update Marketing API Key Error:', error);
    return { success: false, error: error.message || '無法更新 API 金鑰' };
  }
}
