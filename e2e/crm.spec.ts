import { test, expect } from '@playwright/test';
import { prisma } from '../src/lib/db';

const TEST_EMAIL = 'test_activation@aura.com';
const TEST_PASSWORD = 'password123';
const COMPANY_NAME = '昕奇雲端測試科技股份有限公司';
const CONTACT_A_NAME = '測試聯絡人甲';
const CONTACT_B_NAME = '測試聯絡人乙';

// 輔助函式：模擬人類緩慢打字，並在打字前後加入停頓，使影片看起來舒適流暢
async function humanType(page: any, selector: string, text: string) {
  const element = page.locator(selector);
  await element.click();
  await page.waitForTimeout(400);
  await element.pressSequentially(text, { delay: 100 }); // 每個字元間隔 100 毫秒
  await page.waitForTimeout(800);
}

test.describe.serial('GCS CRM E2E Auto Test and Recording', () => {
  test.describe.configure({ timeout: 150000 });
  
  test.beforeAll(async () => {
    // 1. 清理舊測試資料
    try {
      const existingUser = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
      if (existingUser) {
        const companies = await prisma.company.findMany({ where: { ownerId: existingUser.id } });
        for (const company of companies) {
          await prisma.contact.deleteMany({ where: { companyId: company.id } });
          await prisma.activity.deleteMany({ where: { relatedId: company.id } });
          await prisma.opportunity.deleteMany({ where: { companyId: company.id } });
        }
        await prisma.company.deleteMany({ where: { ownerId: existingUser.id } });
        await prisma.user.delete({ where: { id: existingUser.id } });
      }
      
      const existingCompany = await prisma.company.findFirst({ where: { name: COMPANY_NAME } });
      if (existingCompany) {
        await prisma.contact.deleteMany({ where: { companyId: existingCompany.id } });
        await prisma.company.delete({ where: { id: existingCompany.id } });
      }
      
      const existingAiCompany = await prisma.company.findFirst({ where: { name: '昕奇雲端智慧科技股份有限公司' } });
      if (existingAiCompany) {
        await prisma.contact.deleteMany({ where: { companyId: existingAiCompany.id } });
        await prisma.company.delete({ where: { id: existingAiCompany.id } });
      }

      await prisma.tag.deleteMany({ where: { name: 'AI-Pioneer' } });
      await prisma.opportunity.deleteMany({ where: { name: 'AI 智惠名片行銷整合專案' } });
    } catch (e) {
      console.warn('Cleanup failed:', e);
    }

    // 2. 建立 PENDING 測試帳號
    await prisma.user.create({
      data: {
        name: '測試專員',
        email: TEST_EMAIL,
        role: 'SALES',
        status: 'PENDING',
        password: 'TEMPORARY_PASSWORD',
        employeeId: 'GT-TEST01',
        jobTitle: '自動化測試工程師',
        region: '台灣',
        department: '研發部',
      }
    });
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('1_activation', async ({ page }) => {
    // 1. 前往註冊啟用頁面
    await page.goto('/register');
    await page.waitForTimeout(5000); // 讓觀眾看清頁面載入並確保 React 水合完成
    await expect(page).toHaveTitle(/GCSCRM/);
    await expect(page.locator('h1')).toContainText('完成帳號設置');

    // 2. 輸入受邀 Email 和密碼（使用人性化緩慢輸入）
    await page.waitForLoadState('networkidle');
    await humanType(page, 'input[type="email"]', TEST_EMAIL);
    await humanType(page, 'input[type="password"]', TEST_PASSWORD);
    
    // 3. 點擊發送驗證碼
    page.once('dialog', async dialog => {
      const msg = dialog.message();
      expect(msg.includes('發送') || msg.toLowerCase().includes('sent') || msg.includes('送信')).toBeTruthy();
      await page.waitForTimeout(1000); // 讓彈窗停留一下
      await dialog.accept();
    });
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2500); // 等待驗證碼發送完成的動畫

    // 4. 從資料庫讀取最新的 2FA 驗證碼
    const verification = await prisma.verificationCode.findFirst({
      where: { email: TEST_EMAIL },
      orderBy: { createdAt: 'desc' }
    });
    
    expect(verification).not.toBeNull();
    const code = verification!.code;

    // 5. 輸入 2FA 碼（緩慢輸入）
    await humanType(page, 'input[placeholder="######"]', code);
    await page.waitForTimeout(1000); // 送出前的短暫停頓

    // 點擊確認啟用
    await page.click('button[type="submit"]');

    // 6. 驗證啟用成功訊息
    await expect(page.locator('text=帳號已成功啟用')).toBeVisible();
    await page.waitForTimeout(4000); // 停留充足時間供影片播放
  });

  test('2_login', async ({ page }) => {
    // 1. 前往登入頁面
    await page.goto('/login');
    await page.waitForTimeout(1500);
    
    // 2. 輸入新帳密（模擬人類輸入）
    await humanType(page, 'input[name="email"]', TEST_EMAIL);
    await humanType(page, 'input[name="password"]', TEST_PASSWORD);
    
    // 3. 點擊登入
    await page.click('button[type="submit"]');
    
    // 4. 驗證是否成功進入儀表板
    await page.waitForURL('**/');
    await expect(page.getByText(/Sales Overview|業務概況儀表板|営業概要/i)).toBeVisible();
    await page.waitForTimeout(3000); // 讓儀表板多停留 3 秒展示
  });

  test('3_create_customer', async ({ page }) => {
    // 1. 登入
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
    await page.waitForTimeout(1500);

    // 2. 前往企業客戶列表頁
    await page.click('a[href="/companies"]');
    await page.waitForURL('**/companies');
    await page.waitForTimeout(1500);

    // 3. 點擊新增客戶按鈕
    await page.click('text=+ 新增客戶');
    await expect(page.locator('text=新增企業客戶')).toBeVisible();
    await page.waitForTimeout(1500); // 等待 Modal 動態展開

    // 4. 填寫公司基本資料（人性化輸入）
    await humanType(page, 'label:has-text("公司名稱") + input', COMPANY_NAME);
    await humanType(page, 'label:has-text("網站") + input', 'https://aura-test.grandtechcloud.com');
    
    // 選擇平台類型與負責業務，並增加觀看等待
    await page.selectOption('label:has-text("平台類型") + select', 'AWS');
    await page.waitForTimeout(800);
    await page.selectOption('label:has-text("負責業務") + select', { index: 0 });
    await page.waitForTimeout(800);

    // 5. 填寫主要聯絡人資訊（人性化輸入）
    await humanType(page, 'label:has-text("姓名") + input', CONTACT_A_NAME);
    await humanType(page, 'label:has-text("職稱") + input', '研發處長');
    await humanType(page, 'label:has-text("Email") + input', 'contact_a@aura-test.com');
    await page.waitForTimeout(1000);

    // 6. 送出建立
    await page.click('button:has-text("確認建立")');
    await page.waitForTimeout(3000); // 等待資料儲存與 Modal 關閉
    await page.reload(); // 重新載入獲取最新 Server Component 清單
    await page.waitForTimeout(1500);

    // 7. 驗證客戶是否在列表中出現
    await expect(page.locator(`text=${COMPANY_NAME}`).first()).toBeVisible();
    await page.waitForTimeout(3000); // 讓列表多停留 3 秒
  });

  test('4_create_contact', async ({ page }) => {
    // 1. 登入
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
    await page.waitForTimeout(1500);

    // 2. 前往客戶列表，點選剛才建立的公司
    await page.click('a[href="/companies"]');
    await page.waitForURL('**/companies');
    await page.waitForTimeout(1500);
    await page.click(`text=${COMPANY_NAME}`);

    // 3. 進入詳情頁後點選新增聯絡人
    await page.waitForURL('**/companies/**');
    await page.waitForTimeout(2000); // 讓觀眾看清詳情頁載入
    await page.click('text=+ 新增聯絡人');
    await expect(page.locator('h2:has-text("新增聯絡人")')).toBeVisible();
    await page.waitForTimeout(1500); // 等待 Modal 動態展開

    // 4. 填寫第二位聯絡人資料（人性化輸入）
    await humanType(page, 'input[placeholder="姓名 *"]', CONTACT_B_NAME);
    await humanType(page, 'input[placeholder="職稱"]', '雲端架構師');
    await humanType(page, 'input[placeholder="Email"]', 'contact_b@aura-test.com');
    await humanType(page, 'input[placeholder="電話"]', '0912-345-678');
    await page.waitForTimeout(1000);

    // 5. 點擊送出
    await page.click('button:has-text("儲存聯絡人")');
    await page.waitForTimeout(3000); // 等待寫入完成與 Modal 關閉
    await page.reload(); // 重新整理頁面以獲取最新的 Server Component 聯絡人清單
    await page.waitForTimeout(1500);

    // 6. 驗證第二位聯絡人是否成功顯示
    await expect(page.locator(`text=${CONTACT_B_NAME}`)).toBeVisible();
    await page.waitForTimeout(3000); // 讓詳情頁多停留 3 秒
  });

  test('5_ai_card_scan', async ({ page }) => {
    // 模擬 AI 名片辨識端點，返回預設的結構化辨識資料
    await page.route('**/api/ai/recognize-card', async route => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            companyName: '昕奇雲端智慧科技股份有限公司',
            website: 'https://ai-scan.grandtechcloud.com',
            name: 'AI 名片專員',
            jobTitle: '機器人架構師',
            email: 'ai_card@grandtechcloud.com',
            phone: '02-8797-1234'
          }
        })
      });
    });

    // 1. 登入
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
    await page.waitForTimeout(1500);

    // 2. 前往企業客戶列表頁
    await page.click('a[href="/companies"]');
    await page.waitForURL('**/companies');
    await page.waitForTimeout(1500);

    // 3. 點擊新增客戶按鈕
    await page.click('text=+ 新增客戶');
    await expect(page.locator('text=新增企業客戶')).toBeVisible();
    await page.waitForTimeout(1500);

    // 4. 點擊「📷 拍名片識別」按鈕
    await page.click('text=📷 拍名片識別');
    await expect(page.locator('text=AI 名片識別')).toBeVisible();
    await page.waitForTimeout(2000); // 讓觀眾看清相機模擬預覽載入

    // 5. 點選相機拍照快門按鈕
    const captureBtn = page.locator('button[aria-label="拍照快門"]');
    await captureBtn.click();
    await page.waitForTimeout(3000); // 讓觀眾看到「AI 智能解析中...」的讀條動畫

    // 6. 核對辨識結果
    await expect(page.locator('text=核對辨識結果')).toBeVisible();
    await page.waitForTimeout(2000); // 讓觀眾看清各個被自動填入的 input 欄位

    // 7. 點擊「確認套用至表單」
    await page.click('text=確認套用至表單');
    await expect(page.locator('text=新增企業客戶')).toBeVisible();
    await page.waitForTimeout(2000); // 讓觀眾確認主表單已自動帶入 AI 欄位

    // 8. 點擊「確認建立」
    await page.click('button:has-text("確認建立")');
    await page.waitForTimeout(3000); // 等待寫入與 Modal 關閉
    await page.reload();
    await page.waitForTimeout(1500);

    // 9. 驗證 AI 辨識的新公司已正確建立並出現在清單中
    await expect(page.locator('text=昕奇雲端智慧科技股份有限公司').first()).toBeVisible();
    await page.waitForTimeout(3000);
  });

  test('6_tag_management', async ({ page }) => {
    // 1. 登入
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
    await page.waitForTimeout(1500);

    // 2. 前往企業客戶列表頁，進入剛才 AI 建立的公司詳情頁
    await page.click('a[href="/companies"]');
    await page.waitForURL('**/companies');
    await page.waitForTimeout(1500);
    await page.click('text=昕奇雲端智慧科技股份有限公司');
    await page.waitForURL('**/companies/**');
    await page.waitForTimeout(2000);

    // 3. 在標籤管理中輸入新標籤（模擬人類慢打字）
    await humanType(page, 'input[placeholder*="新增標籤"]', 'AI-Pioneer');
    await page.waitForTimeout(1000);

    // 4. 按下 Enter 鍵新增標籤
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000); // 等待寫入完成
    await page.reload();
    await page.waitForTimeout(2000);

    // 5. 驗證標籤是否已建立並顯示
    await expect(page.locator('text=AI-Pioneer')).toBeVisible();
    await page.waitForTimeout(3000);
  });

  test('7_add_opportunity', async ({ page }) => {
    // 1. 登入
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
    await page.waitForTimeout(1500);

    // 2. 前往新增商機頁面
    await page.goto('/opportunities/add');
    await page.waitForURL('**/opportunities/add');
    await page.waitForTimeout(2000); // 讓觀眾看清精美的商機建立表單

    // 3. 填寫商機資料
    await humanType(page, 'label:has-text("商機名稱") + input', 'AI 智惠名片行銷整合專案');
    await humanType(page, 'label:has-text("預估金額") + div input', '250000');
    
    // 選擇客戶公司為剛剛 AI 建立的「昕奇雲端智慧科技股份有限公司」
    await page.selectOption('label:has-text("客戶公司") + select', { label: '昕奇雲端智慧科技股份有限公司' });
    await page.waitForTimeout(1000);

    // 填寫行銷來源追蹤資訊
    await page.selectOption('label:has-text("商機來源") + select', 'LinkedIn');
    await page.waitForTimeout(800);
    await humanType(page, 'label:has-text("行銷活動代號") + input', '2024_AI_CAMPAIGN');
    await page.waitForTimeout(1500);

    // 4. 點擊「✓ 建立商機」
    await page.click('button:has-text("✓ 建立商機")');
    await page.waitForURL('**/opportunities');
    await page.waitForTimeout(3000); // 等待看板載入

    // 5. 驗證商機看板中是否有此商機
    await expect(page.locator('text=AI 智惠名片行銷整合專案').first()).toBeVisible();
    await page.waitForTimeout(3000);
  });

  test('8_email_broadcast', async ({ page }) => {
    // 1. 登入
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
    await page.waitForTimeout(1500);

    // 2. 前往行銷群發頁面
    await page.click('a[href="/marketing"]');
    await page.waitForTimeout(1000);
    await page.click('a[href="/marketing/broadcaster"]');
    await page.waitForURL('**/marketing/broadcaster');
    await page.waitForTimeout(2000); // 展示精美編輯器

    // 3. 選擇發送分眾（標籤）為 AI-Pioneer
    await page.selectOption('select#broadcaster-tag-select', 'AI-Pioneer');
    await page.waitForTimeout(800);

    // 4. 輸入主旨
    await humanType(page, 'input#broadcaster-subject-input', '昕奇雲端 AI 名片與 CRM 整合限時體驗方案');
    await page.waitForTimeout(1000);

    // 5. 輸入 EDM 內文
    await page.click('div.ProseMirror');
    await page.waitForTimeout(600);
    await page.keyboard.type('親愛的 {{contactName}} 您好，這是一封測試群發電子報！');
    await page.waitForTimeout(1500);

    // 6. 點擊「👁️ 預覽郵件」展示高階預覽彈窗 (WOW 效果)
    await page.click('button:has-text("Preview"), button:has-text("預覽")');
    await expect(page.locator('iframe[title="EDM Preview"]')).toBeVisible();
    await page.waitForTimeout(4000); // 讓觀眾看足預覽樣板與變數渲染結果

    // 7. 關閉預覽
    await page.click('button:has-text("×")');
    await page.waitForTimeout(1500);

    // 8. 點擊「立即群發」
    page.once('dialog', async dialog => {
      await page.waitForTimeout(1500);
      await dialog.accept();
    });
    await page.click('button:has-text("立即開始群發"), button:has-text("Start Broadcast Now")');
    
    // 9. 驗證成功通知
    await expect(page.locator('text=/成功|success|正常/i').first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(3000);
  });

});
