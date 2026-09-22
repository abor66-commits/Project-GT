'use server';

import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/mail';
import { getSession } from '@/lib/auth';
import { randomUUID } from 'crypto';

async function getBaseUrl(): Promise<string> {
  const setting = await prisma.systemSetting.findUnique({ where: { key: 'APP_URL' } });
  if (setting?.value) return setting.value.trim().replace(/\/+$/, '');
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/+$/, '');
  if (process.env.APP_URL) return process.env.APP_URL.trim().replace(/\/+$/, '');
  return 'http://localhost:3000';
}

function injectEmailTracking(html: string, token: string, baseUrl: string): string {
  // 1. Rewrite <a href="..."> to click tracking url
  let transformed = html.replace(/<a\b([^>]*?)\bhref=(["'])(https?:\/\/[^"'>\s]+)\2([^>]*)>/gi, (match, prefix, quote, originalUrl, suffix) => {
    if (originalUrl.includes('/api/track/click')) return match;
    const trackingClickUrl = `${baseUrl}/api/track/click?t=${encodeURIComponent(token)}&url=${encodeURIComponent(originalUrl)}`;
    return `<a${prefix}href="${trackingClickUrl}"${suffix}>`;
  });

  // 2. Inject 1x1 transparent tracking pixel
  const trackingPixel = `<img src="${baseUrl}/api/track/open?t=${encodeURIComponent(token)}" width="1" height="1" alt="" style="display:none!important;width:1px!important;height:1px!important;max-height:1px!important;max-width:1px!important;opacity:0!important;border:none!important;" />`;
  if (transformed.includes('</body>')) {
    transformed = transformed.replace('</body>', `${trackingPixel}</body>`);
  } else {
    transformed += trackingPixel;
  }

  return transformed;
}

export async function sendSegmentedEmail(tagName: string, subject: string, content: string, templateId?: string) {
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

    // 2. Build recipient list with unique tokens
    type Recipient = { email: string; contactName: string; companyName: string; trackingToken: string };
    const recipients: Recipient[] = companies.flatMap(c =>
      c.contacts
        .filter(contact => !!contact.email)
        .map(contact => ({
          email: contact.email as string,
          contactName: contact.name,
          companyName: c.name,
          trackingToken: randomUUID(),
        }))
    );

    if (recipients.length === 0) {
      return { success: false, error: '選定的客戶群中沒有有效的電子郵件' };
    }

    const baseUrl = await getBaseUrl();

    // 3. Create Campaign and Recipient records in DB
    const campaign = await prisma.broadcastCampaign.create({
      data: {
        subject,
        tagName,
        templateId: templateId || null,
        senderId: session.id,
        totalRecipients: recipients.length,
        status: 'SENDING',
        contentSnapshot: content,
        recipients: {
          create: recipients.map(r => ({
            email: r.email,
            contactName: r.contactName,
            companyName: r.companyName,
            trackingToken: r.trackingToken,
            status: 'SENT',
          }))
        }
      },
      include: {
        recipients: true,
      }
    });

    const recipientMap = new Map(campaign.recipients.map(r => [r.trackingToken, r.id]));

    // 4. Send personalized & tracked emails
    let successCount = 0;
    let failCount = 0;

    for (const recipient of recipients) {
      const personalizedHtml = content
        .replace(/\{\{contactName\}\}/g, recipient.contactName)
        .replace(/\{\{companyName\}\}/g, recipient.companyName);
      
      const trackedHtml = injectEmailTracking(personalizedHtml, recipient.trackingToken, baseUrl);
      const textContent = personalizedHtml.replace(/<[^>]*>?/gm, '');

      const result = await sendEmail({
        to: recipient.email,
        subject,
        html: trackedHtml,
        text: textContent,
      });

      const recipientDbId = recipientMap.get(recipient.trackingToken);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
        if (recipientDbId) {
          await prisma.broadcastRecipient.update({
            where: { id: recipientDbId },
            data: { status: 'FAILED', errorMessage: result.error || '寄送失敗' }
          }).catch(console.error);
        }
      }
    }

    // 5. Update Campaign final stats
    await prisma.broadcastCampaign.update({
      where: { id: campaign.id },
      data: {
        successCount,
        failedCount: failCount,
        status: 'COMPLETED'
      }
    });

    // 6. Log the event for compatibility
    await prisma.marketingLog.create({
      data: {
        type: 'EMAIL_BROADCAST',
        target: tagName,
        details: `已成功發送 ${successCount} 封郵件${failCount > 0 ? `，失敗 ${failCount} 封` : ''}`
      }
    });

    return { 
      success: true, 
      campaignId: campaign.id,
      message: `已成功發送 ${successCount} 封郵件${failCount > 0 ? `，失敗 ${failCount} 封` : ''}` 
    };
  } catch (error: any) {
    console.error('Email Broadcaster Error:', error);
    return { success: false, error: error.message || '發送過程中發生錯誤' };
  }
}

export async function getBroadcastCampaigns(limit = 20) {
  try {
    const session = await getSession();
    if (!session) return { success: false, campaigns: [], summary: null };

    const isRestricted = session.role === 'SALES' && session.exclusiveMode === true;
    const whereClause = isRestricted ? { senderId: session.id } : {};

    const campaigns = await prisma.broadcastCampaign.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    const totalSent = campaigns.reduce((acc, c) => acc + c.successCount, 0);
    const totalTargeted = campaigns.reduce((acc, c) => acc + c.totalRecipients, 0);
    const totalUniqueOpens = campaigns.reduce((acc, c) => acc + c.uniqueOpenCount, 0);
    const totalUniqueClicks = campaigns.reduce((acc, c) => acc + c.uniqueClickCount, 0);

    const avgDeliveryRate = totalTargeted > 0 ? (totalSent / totalTargeted) * 100 : 0;
    const avgOpenRate = totalSent > 0 ? (totalUniqueOpens / totalSent) * 100 : 0;
    const avgClickRate = totalSent > 0 ? (totalUniqueClicks / totalSent) * 100 : 0;

    return {
      success: true,
      campaigns,
      summary: {
        campaignCount: campaigns.length,
        totalSent,
        totalUniqueOpens,
        totalUniqueClicks,
        avgDeliveryRate: Math.round(avgDeliveryRate * 10) / 10,
        avgOpenRate: Math.round(avgOpenRate * 10) / 10,
        avgClickRate: Math.round(avgClickRate * 10) / 10,
      }
    };
  } catch (error: any) {
    console.error('getBroadcastCampaigns Error:', error);
    return { success: false, campaigns: [], summary: null, error: error.message };
  }
}

export async function getCampaignDetails(campaignId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: '未授權' };

    const campaign = await prisma.broadcastCampaign.findUnique({
      where: { id: campaignId },
      include: {
        sender: {
          select: { id: true, name: true, email: true }
        },
        recipients: {
          orderBy: [
            { openedAt: 'desc' },
            { clickedAt: 'desc' },
            { createdAt: 'desc' }
          ]
        }
      }
    });

    if (!campaign) {
      return { success: false, error: '找不到該活動' };
    }

    if (session.role === 'SALES' && session.exclusiveMode === true && campaign.senderId !== session.id) {
      return { success: false, error: '無權限查看此活動' };
    }

    return {
      success: true,
      campaign
    };
  } catch (error: any) {
    console.error('getCampaignDetails Error:', error);
    return { success: false, error: error.message };
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
