'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/mail';

import { getSession } from '@/lib/auth';

export async function updateOpportunityStage(id: string, newStage: string) {
  if (!id || !newStage) return;

  const session = await getSession();
  if (!session) return;

  const existing = await prisma.opportunity.findUnique({ where: { id }, include: { company: true } });
  if (!existing) return;

  if (session.role !== 'ADMIN' && session.role !== 'MANAGER' && existing.ownerId !== session.id && existing.company.salesDeputy !== session.id) {
    return;
  }

  const opp = await prisma.opportunity.update({
    where: { id },
    data: { 
      stage: newStage,
      updatedAt: new Date()
    },
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
          <p><strong>新階段：</strong>${newStage}</p>
          <p>請登入系統查看詳細資訊。</p>
        </div>
      `;
      sendEmail({ to: owner.email, subject, html }).catch(e => console.error("[Mail Error]", e));
    }
  }

  revalidatePath('/opportunities');
  revalidatePath('/');
}

export async function createOpportunity(data: {
  name: string;
  amount: number;
  stage: string;
  closeDate: Date;
  companyId: string;
  ownerId: string;
  source?: string;
  campaign?: string;
}) {
  const opp = await prisma.opportunity.create({
    data: {
      name: data.name,
      amount: data.amount,
      stage: data.stage,
      closeDate: data.closeDate,
      companyId: data.companyId,
      ownerId: data.ownerId,
      source: data.source,
      campaign: data.campaign
    }
  });

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

  revalidatePath('/opportunities');
  revalidatePath(`/companies/${data.companyId}`);
  return opp;
}
