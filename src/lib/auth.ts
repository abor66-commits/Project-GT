import { prisma } from './db';
import { cookies } from 'next/headers';
import { verifySession } from './crypto';

export type UserRole = 'SALES' | 'MARKETING' | 'MANAGER' | 'ASSISTANT' | 'SSO' | 'ADMIN';

export async function getSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('user_email')?.value;

  if (!sessionToken) return null;

  const email = verifySession(sessionToken);
  if (!email) return null;

  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  return user;
}

export async function checkRole(requiredRoles: UserRole[]) {
  const user = await getSession();
  if (!user) return false;
  return requiredRoles.includes(user.role as UserRole);
}
