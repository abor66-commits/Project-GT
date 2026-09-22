import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'updateStage') {
      const { id, stage } = data;
      const opp = await prisma.opportunity.update({
        where: { id },
        data: { stage, updatedAt: new Date() }
      });

      if (opp.ownerId) {
        const owner = await prisma.user.findUnique({ where: { id: opp.ownerId } });
        const company = await prisma.company.findUnique({ where: { id: opp.companyId } });
        if (owner?.email) {
          const subject = `【通知】商機階段已更新：${opp.name}`;
          const html = `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>您負責的商機階段已有更新</h2>
              <p><strong>商機名稱：</strong>${opp.name}</p>
              <p><strong>關聯公司：</strong>${company?.name || '未知'}</p>
              <p><strong>新階段：</strong>${stage}</p>
              <p>請登入系統查看詳細資訊。</p>
            </div>
          `;
          sendEmail({ to: owner.email, subject, html }).catch(e => console.error("[Mail Error]", e));
        }
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'create') {
      const opp = await prisma.opportunity.create({ data });
      
      // Email Notification to the assigned owner
      if (opp.ownerId) {
        const owner = await prisma.user.findUnique({ where: { id: opp.ownerId } });
        const company = await prisma.company.findUnique({ where: { id: opp.companyId } });
        if (owner?.email) {
          const subject = `【通知】您被指派了新商機：${opp.name}`;
          const html = `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>您有新的商機指派</h2>
              <p><strong>商機名稱：</strong>${opp.name}</p>
              <p><strong>關聯公司：</strong>${company?.name || '未知'}</p>
              <p><strong>預期金額：</strong>$${(opp.amount || 0).toLocaleString()}</p>
              <p>請登入系統查看詳細資訊。</p>
            </div>
          `;
          sendEmail({ to: owner.email, subject, html }).catch(e => console.error("[Mail Error]", e));
        }
      }

      return NextResponse.json({ success: true, id: opp.id });
    }

    if (action === 'update') {
      const { id, ...updateData } = data;
      const existingOpp = await prisma.opportunity.findUnique({ where: { id } });
      const opp = await prisma.opportunity.update({ where: { id }, data: updateData });

      // Email Notification if the owner was changed
      if (existingOpp && existingOpp.ownerId !== opp.ownerId && opp.ownerId) {
        const newOwner = await prisma.user.findUnique({ where: { id: opp.ownerId } });
        const company = await prisma.company.findUnique({ where: { id: opp.companyId } });
        if (newOwner?.email) {
          const subject = `【通知】商機負責人變更：${opp.name}`;
          const html = `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>商機負責人已變更為您</h2>
              <p><strong>商機名稱：</strong>${opp.name}</p>
              <p><strong>關聯公司：</strong>${company?.name || '未知'}</p>
              <p><strong>預期金額：</strong>$${(opp.amount || 0).toLocaleString()}</p>
              <p>請登入系統查看詳細資訊。</p>
            </div>
          `;
          sendEmail({ to: newOwner.email, subject, html }).catch(e => console.error("[Mail Error]", e));
        }
      } else if (existingOpp && opp.ownerId) {
        const owner = await prisma.user.findUnique({ where: { id: opp.ownerId } });
        const company = await prisma.company.findUnique({ where: { id: opp.companyId } });
        if (owner?.email) {
          const subject = `【通知】商機內容已更新：${opp.name}`;
          const html = `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>您負責的商機內容已有更新</h2>
              <p><strong>商機名稱：</strong>${opp.name}</p>
              <p><strong>關聯公司：</strong>${company?.name || '未知'}</p>
              <p><strong>預期金額：</strong>$${(opp.amount || 0).toLocaleString()}</p>
              <p><strong>目前階段：</strong>${opp.stage}</p>
              <p>請登入系統查看詳細資訊。</p>
            </div>
          `;
          sendEmail({ to: owner.email, subject, html }).catch(e => console.error("[Mail Error]", e));
        }
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      const { id } = data;
      await prisma.opportunity.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Opportunities API error:', error);
    return NextResponse.json({ error: '操作失敗' }, { status: 500 });
  }
}
