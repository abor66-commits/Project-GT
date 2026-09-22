import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { processAutomation } from '@/lib/automation';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify API Key
    const apiKey = req.headers.get('x-api-key');
    const systemApiKey = await prisma.systemSetting.findUnique({ where: { key: 'MARKETING_API_KEY' } });

    if (!apiKey || !systemApiKey || apiKey !== systemApiKey.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { companyName, contactName, email, phone, industry, tag } = data;

    if (!companyName || !email) {
      return NextResponse.json({ error: 'Missing required fields (companyName, email)' }, { status: 400 });
    }

    // 2. Process Company & Contact (Upsert logic)
    // Find or create company
    let company = await prisma.company.findFirst({
      where: { name: companyName }
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: companyName,
          industry: industry || 'Other',
          region: 'Global',
          sizeScale: '1-50', // Default size for new leads
          status: 'LEAD',
          ownerId: (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))?.id || ''
        }
      });
    }

    // Find or create contact
    let contact = await prisma.contact.findFirst({
      where: { email }
    });

    if (!contact) {
      await prisma.contact.create({
        data: {
          name: contactName || email.split('@')[0],
          email,
          phone: phone || '',
          companyId: company.id,
          isPrimary: true
        }
      });
    }

    // 3. Apply Tag if provided
    const tagName = tag || 'Web-Lead';
    let tagObj = await prisma.tag.findUnique({ where: { name: tagName } });
    if (!tagObj) {
      tagObj = await prisma.tag.create({
        data: { name: tagName, color: '#3b82f6' }
      });
    }

    // Connect tag to company
    await prisma.company.update({
      where: { id: company.id },
      data: {
        tags: { connect: { id: tagObj.id } }
      }
    });

    // 4. Trigger Automation
    await processAutomation('TAG_ADDED', tagName, { companyId: company.id });

    return NextResponse.json({ success: true, companyId: company.id });
  } catch (error: any) {
    console.error('[Web-to-Lead API Error]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
