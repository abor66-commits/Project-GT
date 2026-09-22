'use server';

import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getEmailTemplates() {
  const user = await getSession();
  if (!user?.id) return [];

  const templates = await prisma.emailTemplate.findMany({
    where: {
      OR: [
        { createdById: user.id },  // 自己建立的
        { isShared: true },        // 共用的
      ],
    },
    orderBy: [{ isShared: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      name: true,
      subject: true,
      content: true,
      isShared: true,
      createdById: true,
      createdAt: true,
    },
  });

  return templates;
}

export async function saveEmailTemplate(data: {
  name: string;
  subject?: string;
  content: string;
  isShared: boolean;
}) {
  const user = await getSession();
  if (!user?.id) return { success: false, error: '未登入' };

  if (!data.name.trim() || !data.content.trim()) {
    return { success: false, error: '請填寫模板名稱與內容' };
  }

  const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(user.role ?? '');
  const isShared = isAdminOrManager ? data.isShared : false;

  const template = await prisma.emailTemplate.create({
    data: {
      name: data.name.trim(),
      subject: data.subject?.trim() || null,
      content: data.content,
      isShared,
      createdById: user.id,
    },
  });

  revalidatePath('/marketing/broadcaster');
  return { success: true, template };
}

export async function deleteEmailTemplate(id: string) {
  const user = await getSession();
  if (!user?.id) return { success: false, error: '未登入' };

  const template = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!template) return { success: false, error: '找不到模板' };

  const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(user.role ?? '');
  if (template.createdById !== user.id && !isAdminOrManager) {
    return { success: false, error: '無權限刪除此模板' };
  }

  await prisma.emailTemplate.delete({ where: { id } });
  revalidatePath('/marketing/broadcaster');
  return { success: true };
}

export async function updateEmailTemplate(id: string, data: {
  name?: string;
  subject?: string;
  isShared?: boolean;
}) {
  const user = await getSession();
  if (!user?.id) return { success: false, error: '未登入' };

  const template = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!template) return { success: false, error: '找不到模板' };

  const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(user.role ?? '');
  if (template.createdById !== user.id && !isAdminOrManager) {
    return { success: false, error: '無權限修改此模板' };
  }

  await prisma.emailTemplate.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name.trim() }),
      ...(data.subject !== undefined && { subject: data.subject?.trim() || null }),
      ...(data.isShared !== undefined && isAdminOrManager && { isShared: data.isShared }),
    },
  });

  revalidatePath('/marketing/broadcaster');
  return { success: true };
}
