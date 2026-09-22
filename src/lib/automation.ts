import { sendEmail } from './mail';
import { prisma } from './db';
import { getTranslationServer } from './i18n/server';

export async function processAutomation(triggerType: string, triggerVal: string, context: { companyId: string, contactEmail?: string }) {
  try {
    const rules = await prisma.automationRule.findMany({
      where: { triggerType, triggerVal, isActive: true }
    });

    for (const rule of rules) {
      if (rule.actionType === 'SEND_EMAIL') {
        await handleSendEmailAction(rule, context);
      }
    }
  } catch (error) {
    console.error('[Automation Engine Error]', error);
  }
}

async function handleSendEmailAction(rule: any, context: any) {
  const { contactEmail, companyId } = context;
  const { t } = await getTranslationServer();

  // Find recipient email if not provided
  let email = contactEmail;
  if (!email) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { contacts: { take: 1 } }
    });
    email = company?.contacts[0]?.email;
  }

  if (email) {
    // Parse content (assuming first line is subject if it contains \n)
    const parts = rule.content?.split('\n');
    const subject = parts && parts.length > 1 ? parts[0] : null;
    const body = parts && parts.length > 1 ? parts.slice(1).join('\n') : rule.content;

    await sendEmail({
      to: email,
      subject: subject || `${t('marketing.automation.default_subject')}: ${rule.name}`,
      html: body || rule.content,
      text: body || rule.content
    });
    
    // Log automation trigger
    await prisma.marketingLog.create({
      data: {
        type: 'AUTOMATION_TRIGGER',
        target: rule.name,
        details: `自動發送郵件至 ${email}`
      }
    });

    console.log(`[Automation] Email sent to ${email} for rule: ${rule.name}`);
  }
}
