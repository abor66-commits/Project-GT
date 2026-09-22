import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/mail';
import { sendSegmentedEmail } from '@/app/actions/marketing';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'sendBroadcast') {
      const { tagName, subject, content, templateId } = data;
      const res = await sendSegmentedEmail(tagName, subject, content, templateId);
      if (!res.success) {
        return NextResponse.json({ error: res.error || '發送失敗' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: res.message, campaignId: res.campaignId });
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
