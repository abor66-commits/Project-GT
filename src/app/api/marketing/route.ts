import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'sendBroadcast') {
      const { tagName, subject, content } = data;
      const companies = await prisma.company.findMany({
        where: { tags: { some: { name: tagName } } },
        include: { contacts: { where: { isPrimary: true } } }
      });
      if (companies.length === 0) return NextResponse.json({ error: '找不到具有此標籤的客戶' }, { status: 400 });

      type Recipient = { email: string; contactName: string; companyName: string };
      const recipients: Recipient[] = companies.flatMap(c =>
        c.contacts.filter(ct => !!ct.email).map(ct => ({
          email: ct.email as string,
          contactName: ct.name,
          companyName: c.name,
        }))
      );
      if (recipients.length === 0) return NextResponse.json({ error: '選定的客戶群中沒有有效的電子郵件' }, { status: 400 });

      let successCount = 0, failCount = 0;
      for (const r of recipients) {
        const html = content.replace(/\{\{contactName\}\}/g, r.contactName).replace(/\{\{companyName\}\}/g, r.companyName);
        const result = await sendEmail({ to: r.email, subject, html, text: html.replace(/<[^>]*>?/gm, '') });
        if (result.success) successCount++; else failCount++;
      }
      await prisma.marketingLog.create({
        data: { type: 'EMAIL_BROADCAST', target: tagName, details: `已成功發送 ${successCount} 封郵件${failCount > 0 ? `，失敗 ${failCount} 封` : ''}` }
      });
      return NextResponse.json({ success: true, message: `已成功發送 ${successCount} 封郵件${failCount > 0 ? `，失敗 ${failCount} 封` : ''}` });
    }

    if (action === 'createAutomation') {
      const rule = await prisma.automationRule.create({ data: { ...data, isActive: true } });
      return NextResponse.json({ success: true, rule });
    }

    if (action === 'deleteAutomation') {
      const { id } = data;
      await prisma.automationRule.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    if (action === 'updateApiKey') {
      const { key } = data;
      await prisma.systemSetting.upsert({
        where: { key: 'MARKETING_API_KEY' },
        update: { value: key },
        create: { key: 'MARKETING_API_KEY', value: key }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Marketing API error:', error);
    return NextResponse.json({ error: error.message || '操作失敗' }, { status: 500 });
  }
}
