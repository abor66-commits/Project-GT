import { prisma } from './db';
import { getSession } from './auth';

export async function logAction(action: string, resource: string, details?: string) {
  try {
    const user = await getSession();
    
    await prisma.auditLog.create({
      data: {
        userId: user?.id || 'SYSTEM',
        userName: user?.name || 'System / Guest',
        action,
        resource,
        details,
      }
    });
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // We don't want audit logging failure to break the main application flow
  }
}
