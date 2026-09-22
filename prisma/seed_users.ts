import { prisma } from '../src/lib/db';

const SALES_NAMES = [
  '張志豪', '李怡君', '王建宏', '陳佩君', '林承翰', 
  '劉佳玲', '黃智豪', '吳思婷', '郭宜蓁', '徐宗翰'
];

const MANAGER_NAMES = [
  '趙敏宏', '周淑惠'
];

const REGIONS = ['台灣', '香港', '日本', '東南亞'];
const DEPARTMENTS = ['雲端事業部', '數位轉型部', '策略客戶組'];

async function main() {
  console.log('Seed: Injecting 10 Sales and 2 Managers...');

  // Create 10 Sales Users
  for (let i = 0; i < SALES_NAMES.length; i++) {
    const name = SALES_NAMES[i];
    const email = `sales${i + 1}@aura.com`;
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        password: 'hashed_password123',
        role: 'SALES',
        status: 'APPROVED',
        employeeId: `GT-S${(i + 1).toString().padStart(3, '0')}`,
        jobTitle: '業務專員',
        region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
        department: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
      }
    });
  }

  // Create 2 Managers
  for (let i = 0; i < MANAGER_NAMES.length; i++) {
    const name = MANAGER_NAMES[i];
    const email = `manager${i + 1}@aura.com`;
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        password: 'hashed_password123',
        role: 'MANAGER',
        status: 'APPROVED',
        employeeId: `GT-M${(i + 1).toString().padStart(3, '0')}`,
        jobTitle: '業務經理',
        region: '台灣',
        department: '管理中心',
      }
    });
  }

  console.log('Seed: Successfully injected 12 new team members.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
