'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createActivity(formData: FormData) {
  const companyId = formData.get('companyId') as string;
  const ownerId = formData.get('userId') as string; // userId from form mapped to ownerId
  const type = formData.get('type') as string;
  const content = formData.get('summary') as string; // summary from form mapped to content

  if (!companyId || !ownerId || !content) {
    throw new Error('Missing required fields');
  }

  await prisma.activity.create({
    data: {
      relatedType: 'COMPANY',
      relatedId: companyId,
      ownerId: ownerId,
      type,
      content,
    },
  });

  revalidatePath(`/companies/${companyId}`);
}
