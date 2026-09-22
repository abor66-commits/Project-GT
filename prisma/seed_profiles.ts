import { prisma } from '../src/lib/db';

async function main() {
  console.log('Seed: Start updating profiles...');
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aura.com' },
    update: {},
    create: {
      email: 'admin@aura.com',
      name: 'Aura Admin',
      password: 'hashed_admin123',
      role: 'MANAGER', // Updated to match document: MANAGER
      status: 'APPROVED', // Updated: APPROVED
      employeeId: 'GT-001',
      department: '管理部',
      jobTitle: '系統管理員',
      region: '台灣'
    },
  });

  const sales = await prisma.user.upsert({
    where: { email: 'sales@aura.com' },
    update: {},
    create: {
      email: 'sales@aura.com',
      name: 'John Sales',
      password: 'hashed_sales123',
      role: 'SALES', // Updated: SALES
      status: 'APPROVED',
      employeeId: 'GT-005',
      department: '業務一部',
      jobTitle: '資深客戶經理',
      region: '台灣'
    },
  });

  console.log('Seed: User profiles seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
