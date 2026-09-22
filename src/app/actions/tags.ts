'use server';

import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const colors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4'];

export async function getTags() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const tags = await prisma.tag.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { companies: true, contacts: true }
      }
    }
  });
  return tags;
}

export async function createTag(data: { name: string; color: string; description?: string | null }) {
  const user = await getSession();
  if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) throw new Error('Unauthorized');

  if (!data.name) throw new Error('標籤名稱不能為空');

  const tagColor = data.color || colors[Math.floor(Math.random() * colors.length)];

  await prisma.tag.create({
    data: {
      name: data.name,
      color: tagColor,
      description: data.description || null,
    }
  });

  revalidatePath('/settings/tags');
  revalidatePath('/companies');
  return { success: true };
}

export async function updateTag(id: string, data: { name: string; color: string; description?: string | null }) {
  const user = await getSession();
  if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) throw new Error('Unauthorized');

  if (!data.name) throw new Error('標籤名稱不能為空');

  await prisma.tag.update({
    where: { id },
    data: {
      name: data.name,
      color: data.color,
      description: data.description || null,
    }
  });

  revalidatePath('/settings/tags');
  revalidatePath('/companies');
  return { success: true };
}

export async function deleteTag(id: string) {
  const user = await getSession();
  if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) throw new Error('Unauthorized');

  // Since relations are implicit many-to-many, Prisma will automatically
  // delete the rows in the join table when the tag is deleted.
  await prisma.tag.delete({
    where: { id }
  });

  revalidatePath('/settings/tags');
  revalidatePath('/companies');
  return { success: true };
}
