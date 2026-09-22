import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EditUserForm from '@/components/EditUserForm';

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const currentUser = await getSession();
  if (!currentUser || (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN')) {
    redirect('/');
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) redirect('/users');

  // Managers cannot edit ADMINs
  if (currentUser.role === 'MANAGER' && user.role === 'ADMIN') {
    redirect('/users');
  }

  return (
    <div className="container" style={{ paddingTop: '8px' }}>
      <EditUserForm
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          department: user.department,
          jobTitle: user.jobTitle,
          region: user.region,
          defaultLanguage: user.defaultLanguage,
          exclusiveMode: user.exclusiveMode,
        }}
        currentUserRole={currentUser.role}
        currentUserId={currentUser.id}
      />
    </div>
  );
}
