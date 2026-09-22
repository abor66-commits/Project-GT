import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

// Only ADMIN and MANAGER can access tag management
export default async function TagsLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
    redirect('/');
  }
  return <>{children}</>;
}
