import { prisma } from '../src/lib/db';

async function main() {
  console.log('Task: Adding recent activities for the dashboard...');

  const sales = await prisma.user.findMany({ where: { role: 'SALES' }, take: 5 });
  const companies = await prisma.company.findMany({ take: 10 });

  if (sales.length === 0 || companies.length === 0) {
    console.error('Missing sales or companies.');
    return;
  }

  const activityTypes = ['CALL', 'MEETING', 'EMAIL'];
  const contents = [
    '與客戶討論雲端遷移時程，對方表現出高度興趣。',
    '完成產品簡報，準備提供正式報價單。',
    '客戶詢問資安合規性問題，已交由技術團隊回覆。',
    '電話追蹤合約簽署進度，預計下週完成。',
    '現場拜訪討論年度預算規劃。'
  ];

  for (let i = 0; i < 8; i++) {
    const s = sales[i % sales.length];
    const c = companies[i % companies.length];
    await prisma.activity.create({
      data: {
        ownerId: s.id,
        relatedType: 'COMPANY',
        relatedId: c.id,
        type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
        content: contents[Math.floor(Math.random() * contents.length)],
        createdAt: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000) // Within last 2 days
      }
    });
  }

  console.log('Task: Successfully added 8 recent activities.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
