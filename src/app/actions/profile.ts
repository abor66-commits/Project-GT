'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { hashPassword } from '@/lib/crypto';

export async function updateProfile(formData: FormData) {
  const userId = formData.get('userId') as string;
  const name = formData.get('name') as string;
  const department = formData.get('department') as string;
  const jobTitle = formData.get('jobTitle') as string;
  const password = formData.get('password') as string;

  if (!userId || !name) {
    throw new Error('Missing required fields');
  }

  const updateData: any = {
    name,
    department,
    jobTitle,
  };

  // Only update password if provided
  if (password && password.trim() !== '') {
    updateData.password = hashPassword(password);
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  revalidatePath('/profile');
}
