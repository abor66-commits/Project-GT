import { prisma } from './src/lib/db';
async function main() {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: ['MAIL_API_KEY', 'SMTP_CONFIG', 'SMTP_HOST', 'SMTP_USER'] } }
  });
  console.log(settings);
}
main();
