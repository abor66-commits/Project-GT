import { prisma } from '../src/lib/db';

const TAIWAN_STARTUPS = [
  'Appier (沛星互動)', 'Gogoro (睿能創意)', 'Pinkoi (果翼科技)', 'KKday (酷遊天)', 'Klook (客路)', 
  'iCHEF (資廚管理)', 'Gandi (台灣分公司)', '17LIVE', 'Shopline', 'MaiCoin (現代財富)', 
  'BitoPro (幣託)', 'CoolBitX (庫幣)', 'GliaCloud (集雅科技)', 'iKala (愛卡拉)', 'NextDrive (聯齊科技)',
  'Health2Sync (慧智微)', 'OwlTing (奧丁丁)', 'Vpon (威朋)', 'Ubiqconn (攸泰科技)', 'M17 Entertainment',
  'Whoscall (Gogolook)', 'Easyship', 'AmazingTalker', 'Hahow (好學校)', 'PressPlay', 
  'Hoolala', 'Insto', 'Kneron (耐能人工智能)', 'Moovup', 'Lalamove', 
  'AsiaYo', 'FunNow', 'Noodoe', 'Airtripp', 'Skyscanner (Taiwan)',
  'Lucid (台灣研發中心)', 'Aura Labs (台灣支社)', 'Dcard', 'CakeResume', 'Yourator',
  'SurveyCake', 'Accupass (活動通)', 'Tink Labs', 'WeMo Scooter', 'GoShare',
  'Goshare', 'iRent', 'Gomaji', 'PChome (新創育成)', 'Momo (數位科技)'
];

const LAST_NAMES = ['陳', '林', '李', '王', '張', '劉', '黃', '吳', '郭', '趙', '周', '徐', '孫', '馬', '朱'];
const FIRST_NAMES = ['志明', '雅婷', '俊宏', '淑惠', '冠廷', '怡君', '建宏', '佩君', '承翰', '佳玲', '智豪', '思婷', '宜蓁', '宗翰', '惠如'];
const JOB_TITLES = ['CTO 技術長', '採購經理', '資訊部門主管', '營運總監', '創辦人', '專案經理', '資深工程師', '市場行銷主管'];

const INDUSTRIES = ['SaaS', 'FinTech', 'E-commerce', 'AI', 'Logistics', 'EdTech', 'CleanTech', 'Blockchain'];
const REGIONS = ['台灣', '香港', '日本', '東南亞'];

async function main() {
  console.log('Seed: Start adding companies and primary contacts...');

  // Clear existing data
  await prisma.activity.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();

  const admin = await prisma.user.findUnique({ where: { email: 'admin@aura.com' } });
  if (!admin) throw new Error('Admin not found.');

  // Create Companies and Contacts
  const createdCompanies = [];
  for (let i = 0; i < TAIWAN_STARTUPS.length; i++) {
    const name = TAIWAN_STARTUPS[i];
    const company = await prisma.company.create({
      data: {
        name,
        website: `https://www.${name.toLowerCase().replace(/[^\w]/g, '')}.com.tw`,
        industry: INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)],
        region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
        platform: ['Multi-Cloud', 'AWS', 'GCP'][Math.floor(Math.random() * 3)],
        sizeScale: ['1-50', '51-200', '201-500', '500+'][Math.floor(Math.random() * 4)],
        status: Math.random() > 0.5 ? 'ACTIVE' : 'POTENTIAL',
        ownerId: admin.id,
      }
    });

    // Create one primary contact for each company
    const contactName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)] + FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    await prisma.contact.create({
      data: {
        companyId: company.id,
        name: contactName,
        jobTitle: JOB_TITLES[Math.floor(Math.random() * JOB_TITLES.length)],
        phone: `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        email: `${contactName.toLowerCase()}@${company.name.toLowerCase().replace(/[^\w]/g, '')}.com.tw`,
        isPrimary: true
      }
    });

    createdCompanies.push(company);
  }

  // Create Opportunities
  for (const company of createdCompanies) {
    const numOpps = Math.floor(Math.random() * 2) + 1;
    for (let j = 0; j < numOpps; j++) {
      await prisma.opportunity.create({
        data: {
          name: `${company.name} - ${['雲端遷移', 'AI導入', '系統升級', '數位轉型'][Math.floor(Math.random() * 4)]}專案`,
          amount: Math.floor(Math.random() * 500000) + 100000,
          stage: ['QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON'][Math.floor(Math.random() * 4)],
          closeDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000),
          companyId: company.id,
          ownerId: admin.id,
        }
      });
    }
  }

  console.log(`Seed: Successfully added ${createdCompanies.length} Taiwan Startups with primary contacts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
