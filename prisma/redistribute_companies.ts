import { prisma } from '../src/lib/db';

async function main() {
  console.log('Task: Redistributing companies among all Sales users...');

  // 1. Get all Sales users
  const salesUsers = await prisma.user.findMany({
    where: { role: 'SALES', status: 'APPROVED' },
    orderBy: { createdAt: 'asc' }
  });

  if (salesUsers.length === 0) {
    console.error('No approved Sales users found. Aborting.');
    return;
  }

  console.log(`Found ${salesUsers.length} Sales users.`);

  // 2. Get all companies
  const companies = await prisma.company.findMany({
    orderBy: { name: 'asc' }
  });

  console.log(`Distributing ${companies.length} companies...`);

  // 3. Round-robin distribution
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    const assignedSales = salesUsers[i % salesUsers.length];

    // Update Company Owner
    await prisma.company.update({
      where: { id: company.id },
      data: { ownerId: assignedSales.id }
    });

    // Update all related Opportunities to the same owner
    await prisma.opportunity.updateMany({
      where: { companyId: company.id },
      data: { ownerId: assignedSales.id }
    });
  }

  console.log('Task: Successfully redistributed all companies and opportunities.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
