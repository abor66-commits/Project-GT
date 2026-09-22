'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export async function createContact(data: {
  name: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  companyId: string;
  isPrimary?: boolean;
}) {
  const user = await getSession();
  if (!user) return { success: false, error: '請先登入' };

  try {
    const contact = await prisma.contact.create({
      data: {
        ...data,
        createdById: user.id,
      }
    });

    revalidatePath(`/companies/${data.companyId}`);
    return { success: true, id: contact.id };
  } catch (error) {
    console.error('Failed to create contact:', error);
    return { success: false, error: '建立聯絡人失敗。' };
  }
}

export async function deleteContact(id: string, companyId: string) {
  const user = await getSession();
  if (!user) return { success: false, error: '請先登入' };

  try {
    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) return { success: false, error: '聯絡人不存在' };

    // ADMIN / MANAGER 可刪任意；其他人只能刪自己建立的
    const isAdminOrManager = user.role === 'ADMIN' || user.role === 'MANAGER';
    if (!isAdminOrManager && contact.createdById !== user.id) {
      return { success: false, error: '您沒有刪除此聯絡人的權限' };
    }

    await prisma.contact.delete({ where: { id } });
    revalidatePath(`/companies/${companyId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete contact:', error);
    return { success: false, error: '刪除聯絡人失敗。' };
  }
}

export async function updateContact(id: string, data: {
  name?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  isPrimary?: boolean;
}, companyId: string) {
  const user = await getSession();
  if (!user) return { success: false, error: '請先登入' };

  try {
    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) return { success: false, error: '聯絡人不存在' };

    // ADMIN / MANAGER 可修任意；其他人只能修自己建立的
    const isAdminOrManager = user.role === 'ADMIN' || user.role === 'MANAGER';
    if (!isAdminOrManager && contact.createdById !== user.id) {
      return { success: false, error: '您沒有修改此聯絡人的權限' };
    }

    await prisma.contact.update({ where: { id }, data });
    revalidatePath(`/companies/${companyId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update contact:', error);
    return { success: false, error: '更新聯絡人失敗。' };
  }
}
