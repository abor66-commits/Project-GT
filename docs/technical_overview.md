# GCS CRM 系統技術文件
### 預覽版發佈 — 技術簡報文件
> 版本：Preview v0.1 ｜ 更新日期：2026-05-27

---

## 一、系統概覽

GCS CRM 是一套針對企業業務與行銷需求設計的**全端雲端客戶關係管理系統**，採用 Server-Side Rendering 架構，支援多語系、多角色、SMTP 可自訂寄信，並整合 AI 名片辨識與 API-based Web-to-Lead 表單。

```
用戶瀏覽器
    │
    ▼
Next.js App (Railway)
    ├── Server Components（資料讀取、權限檢查）
    ├── Server Actions（資料寫入、業務邏輯）
    ├── API Routes（第三方 Webhook、AI、全域搜尋）
    │
    ├── Prisma ORM ──► SQLite (better-sqlite3)
    │
    ├── Nodemailer ──► 任意 SMTP 伺服器
    └── Resend SDK ──► Resend Email API（備援）
```

---

## 二、技術堆疊（Tech Stack）

### 核心框架

| 層級 | 技術 | 版本 | 選用原因 |
|------|------|------|---------|
| Web Framework | **Next.js** | 16.2.4 | App Router、Server Actions、SSR/SSG 一體整合 |
| UI Runtime | **React** | 19.2.4 | 最新穩定版，支援 `useTransition` 和 Server Components |
| 語言 | **TypeScript** | ^5 | 全端型別安全 |
| 樣式 | **Vanilla CSS** | — | 零外部依賴，使用 CSS 變數實作深色模式 |
| ORM | **Prisma** | 7.8.0 | 型別安全 Query，自動 Migration，支援多種 DB 引擎 |
| 資料庫 | **SQLite** (better-sqlite3) | 12.9.0 | 單檔部署，Railway persistent volume 掛載 |
| 部署平台 | **Railway** | — | 容器化部署，自動 CI/CD，Persistent Volume |

### 前端套件

| 套件 | 版本 | 用途 |
|------|------|------|
| **Recharts** | ^3.8.1 | 決策報表圖表（環狀圖、長條圖、折線圖） |
| **Tiptap** (套件群) | ^3.23.6 | 郵件群發 WYSIWYG 富文字編輯器 |
| `@tiptap/react` | — | React 整合 |
| `@tiptap/starter-kit` | — | 基礎格式（粗體、斜體、標題、清單等） |
| `@tiptap/extension-*` | — | Color、TextStyle、Link、TextAlign、Underline、Image |

---

## 三、第三方服務整合

### 3.1 電子郵件發送

系統實作**雙模式備援**郵件架構，優先使用 API 模式，不可用時自動降級為 SMTP：

```
sendEmail() 呼叫
    │
    ├── 有 MAIL_API_KEY？
    │       ▼ Yes
    │   Resend SDK（HTTP API）
    │       └── 設定來自 DB 或 ENV
    │
    └── No → SMTP via Nodemailer
            └── 設定優先順序：DB > ENV
```

| 服務 | 套件 | 環境變數 | 用途 |
|------|------|----------|------|
| **Resend** | `resend ^6.12.3` | `MAIL_API_KEY` / `RESEND_API_KEY` | API-based 寄信（首選） |
| **任意 SMTP** | `nodemailer ^8.0.7` | `SMTP_HOST/PORT/USER/PASS/FROM` | 傳統 SMTP（可在後台設定） |

> SMTP 設定優先從 DB `SystemSetting` 表讀取（可由管理員後台修改），DB 無設定才讀取 ENV 變數。

#### Resend 費用方案（Transactional Email，2026-05-27）

| 方案 | 月費 | 包含發送量 | 超量費率（每 1,000 封） | 每日上限 |
|------|------|----------|----------------------|---------|
| **Free** | $0 | 3,000 封/月 | — | 100 封/日 |
| **Pro** | $20 | 50,000 封/月 | $0.90 | 無上限 |
| **Pro** | $35 | 100,000 封/月 | $0.90 | 無上限 |
| **Scale** | $90 | 100,000 封/月 | $0.90 | 無上限 |
| **Scale** | $350 | 500,000 封/月 | $0.70 | 無上限 |
| **Scale** | $650 | 1,000,000 封/月 | $0.65 | 無上限 |
| **Enterprise** | 客製 | 客製（3M+ 封/月） | 客製 | 無上限 |

> [!NOTE]
> **目前使用場景評估：**
> - CRM 群發郵件（行銷通知、自動化歡迎信）屬於 Transactional Email
> - **Free 方案**（每日上限 100 封）適合初期預覽版內部測試
> - **Pro $20/月**（5 萬封/月）可支援至約 **1,667 次群發 × 30 人**的規模，足夠一般中小企業使用
> - 超量部分按 $0.90/千封計費，可彈性擴充無需換方案

---

### 3.2 AI 名片辨識

| 項目 | 說明 |
|------|------|
| **服務** | Google Gemini AI（`@google/generative-ai ^0.24.1`） |
| **模型** | `gemini-2.0-flash`（Multimodal） |
| **環境變數** | `GEMINI_API_KEY` |
| **API Route** | `POST /api/ai/recognize-card` |
| **流程** | 前端拍攝/上傳名片 → Base64 → Gemini Vision → 結構化 JSON（姓名/職稱/電話/Email/公司） → 自動填入表單 |
| **備援** | OpenAI SDK 也已安裝（`openai ^6.39.0`，`OPENAI_API_KEY`），可切換 |

---

### 3.3 Web-to-Lead 表單整合 API

```
外部表單 POST /api/marketing/lead
    Headers: { x-api-key: <Marketing API Key> }
    Body: { companyName, contactName, email, phone, source, tags[] }
         ▼
    驗證 API Key（DB SystemSetting）
         ▼
    自動建立 Company + Contact + Tag 關聯
         ▼
    觸發 AutomationRule（如有匹配標籤）
```

| 項目 | 說明 |
|------|------|
| 路由 | `POST /api/marketing/lead` |
| 認證 | Header `x-api-key`（後台產生，支援重置） |
| 自動化 | 新增名單後觸發 AutomationRule → 自動寄送歡迎信 |

---

### 3.4 全域搜尋 API

| 項目 | 說明 |
|------|------|
| 路由 | `GET /api/search?q={query}` |
| 搜尋範圍 | 公司名稱、聯絡人姓名/Email、商機名稱、行銷標籤 |
| 架構決策 | 使用 **REST API Route** 而非 Server Action，避免 Next.js chunk hash 失效導致 `failed-to-find-server-action` 錯誤 |

---

## 四、資料庫設計

### 4.1 資料模型（Schema）

```
User ──────── Company (1:N, owner)
              │
              ├── Contact (1:N)
              ├── Opportunity (1:N)
              └── Tag (M:N)
                  │
                  └── Contact (M:N, ContactTags)

AutomationRule        →  triggerVal = Tag name
MarketingLog          →  記錄每次群發/觸發事件
EmailTemplate         →  使用者自訂郵件模板（可設定共用）
SystemSetting         →  SMTP/SSO/Logo 等動態設定
AuditLog              →  ISO 27001 安全稽核日誌
VerificationCode      →  2FA 驗證碼（時效性）
```

### 4.2 Migration 歷程

| 版本 | 日期 | 內容 |
|------|------|------|
| `init_new_structure` | 2026-05-06 | 初始化 User/Company/Contact/Opportunity/Activity |
| `structural_redesign_v2` | 2026-05-06 | 結構重設計，加入 SystemSetting、AuditLog、VerificationCode |
| `add_marketing_tags` | 2026-05-14 | Tag 模型，Company↔Tag M:N，Contact↔Tag M:N |
| `add_automation_rules_v2` | 2026-05-14 | AutomationRule（TAG_ADDED → SEND_EMAIL） |
| `add_marketing_log` | 2026-05-14 | MarketingLog 發送紀錄 |
| `add_contact_created_by` | 2026-05-26 | Contact.createdById（權限管控刪改） |
| `add_email_template` | 2026-05-27 | EmailTemplate（自訂模板，isShared 共用） |

---

## 五、系統功能模組

### 5.1 頁面路由地圖

```
/                          儀表板（KPI卡片、銷售漏斗、最新動態）
/companies                 客戶列表（標籤篩選、全文搜尋、排序）
/companies/[id]            客戶詳情（聯絡人卡片、商機、活動記錄）
/opportunities             商機管理
/reports                   決策報表（圖表 × 6、PDF 匯出）
/marketing                 行銷控制台
/marketing/broadcaster     郵件群發（WYSIWYG 編輯器 + 模板系統）
/marketing/automation      自動化培育規則
/marketing/integration     Web-to-Lead 表單整合
/marketing/history         群發紀錄
/users                     團隊管理
/settings/general          系統參數（Logo、公司名）
/settings/smtp             SMTP 設定
/settings/sso              SSO 配置
/settings/logs             ISO 安全稽核日誌
/profile                   個人設定
```

### 5.2 Server Actions（業務邏輯層）

| 檔案 | 功能 |
|------|------|
| `actions/auth.ts` | 登入、2FA 驗證、密碼重置 |
| `actions/companies.ts` | 公司 CRUD、AI 名片匯入 |
| `actions/contacts.ts` | 聯絡人 CRUD（權限：自己建立的可自行刪改） |
| `actions/marketing.ts` | 郵件群發、自動化規則、API Key 管理 |
| `actions/emailTemplates.ts` | 郵件模板 CRUD（isShared 共用權限） |
| `actions/opportunities.ts` | 商機 CRUD |
| `actions/settings.ts` | SMTP/Logo/SSO 設定（含 Logo 圖片壓縮） |
| `actions/users.ts` | 用戶邀請、角色/狀態管理、2FA 重設 |
| `actions/search.ts` | 內部搜尋邏輯（由 API Route 調用） |

---

## 六、安全架構

| 機制 | 實作方式 |
|------|---------|
| **認證** | Cookie-based Session（`user_email` cookie） |
| **2FA** | 郵件 OTP 驗證碼（`VerificationCode` 表，5 分鐘時效） |
| **角色權限** | `ADMIN / MANAGER / SALES / MARKETING / ASSISTANT / SSO` 六個角色 |
| **SSO 支援** | `SSO` 角色配合外部 IdP 配置 |
| **稽核日誌** | 每次敏感操作寫入 `AuditLog`（ISO 27001 規範） |
| **API Key 認證** | Web-to-Lead 端點需 Header `x-api-key`，支援後台重置 |

---

## 七、國際化（i18n）

| 項目 | 說明 |
|------|------|
| 支援語系 | 繁體中文 `zh-TW`、英文 `en`、日文 `ja` |
| 實作 | 自訂 `LanguageContext`（React Context + Cookie 持久化） |
| 語系偵測 | 首次進入自動讀取 `navigator.language` → 寫入 Cookie |
| 翻譯覆蓋率 | 全系統 UI 字串 161 個 key，三語系 100% 覆蓋 |
| 翻譯檔 | `src/lib/i18n/translations.ts` |

---

## 八、環境變數清單

| 變數名稱 | 必填 | 說明 |
|---------|------|------|
| `DATABASE_URL` | ✅ | SQLite 資料庫路徑 |
| `GEMINI_API_KEY` | ✅ | Google Gemini AI（名片辨識） |
| `MAIL_API_KEY` / `RESEND_API_KEY` | 擇一 | Resend API Key |
| `SMTP_HOST` | 擇一 | SMTP 主機（可於後台設定覆蓋） |
| `SMTP_PORT` | — | 預設 587 |
| `SMTP_USER` | — | SMTP 帳號 |
| `SMTP_PASS` | — | SMTP 密碼 |
| `SMTP_FROM` / `MAIL_FROM_ADDRESS` | — | 發件人地址 |
| `OPENAI_API_KEY` | — | 備援 AI（預留） |
| `NEXT_PUBLIC_APP_URL` | — | 系統公開 URL（用於邀請信連結） |

---

## 九、關鍵設計決策

| 決策 | 理由 |
|------|------|
| Next.js Server Actions 用於寫入，API Route 用於查詢 | 避免 client 來回導航後 Server Action ID hash 失效（`failed-to-find-server-action`） |
| SQLite + Railway Persistent Volume | 簡化部署、零額外費用，不需要外部 DB 服務 |
| Tiptap 取代 `<textarea>` HTML 編輯 | 非工程師行銷人員可直接使用 WYSIWYG，且 output 仍為 HTML string，上游邏輯零改動 |
| Logo 上傳 Canvas 壓縮 | 防止 Base64 圖片過大導致 SQLite row size 超限寫入失敗 |
| 聯絡人權限：createdById | 業務/行銷自行新增的聯絡人可自行刪改，不影響他人資料 |
| 郵件群發 per-recipient 變數替換 | `{{contactName}}`、`{{companyName}}` 在發送時對每位收件人個別替換 |

---

## 十、程式碼統計

| 類別 | 數量 |
|------|------|
| React 元件 | 37 個 |
| 頁面路由（Next.js） | 43 個 |
| Server Actions 函式 | ~60 個 |
| API Routes | 4 個 |
| 資料庫 Migration | 7 次 |
| 翻譯 Key | 161 個 × 3 語系 |
| 總程式碼行數（src/） | ~31,000 行 |

---

## 十一、部署平台限制與 Scale-up 路線圖

### 11.1 現況：Railway Hobby Plan

目前系統部署於 **Railway Hobby Plan**，以下是實際資源限制：

| 資源項目 | Hobby 方案限制 | 說明 |
|---------|--------------|------|
| **費用** | $5/月（含 $5 使用額度） | 超出後按實際用量計費 |
| **運算** | 最高 48 vCPU / 48 GB RAM | 單一 Service 上限 |
| **Replica（水平擴展）** | 最多 5 個，每個 8 vCPU / 8 GB RAM | |
| **儲存空間（SQLite）** | 最高 5 GB Persistent Volume | SQLite 資料庫掛載於此 |
| **SLA 可用性** | 99.9% Availability Target | |
| **Log 保存期** | 7 天 | |
| **工作區成員** | 單一開發者（Single developer workspace） | |
| **支援** | 社群支援（Discord）| 無專屬客服 |

> [!WARNING]
> **關鍵限制：SQLite 單寫入點**
> SQLite 只支援**單一寫入者**，不支援多副本（Replica）同時寫入。
> 即使 Railway Hobby 允許最多 5 個 Replica，開啟多副本後資料庫寫入會產生衝突，**目前不建議開啟多 Replica**。

---

### 11.2 並發用戶承載估算

| 使用情境 | 安全並發用戶數 | 瓶頸點 |
|---------|-------------|-------|
| 一般 CRM 操作（讀多寫少） | **50–100 人** | SQLite write lock |
| 大量群發觸發（Automation） | **< 20 人同時操作** | SMTP 佇列 + SQLite |
| AI 名片辨識同時使用 | **< 10 人同時上傳** | Gemini API 速率限制 |

> CRM 系統本質上屬於**內部工具、低並發**場景，Hobby Plan 對於 **20–50 名業務/行銷人員日常使用**已足夠。

---

### 11.3 Scale-up 路線圖

#### 階段一：短期 — Hobby → Pro（最快路徑）

| 升級項目 | Hobby（現況） | Pro | 效益 |
|---------|------------|-----|------|
| 費用 | $5/月 | **$20/月** | 含 $20 使用額度 |
| 最大運算 | 48 vCPU / 48 GB | **1,000 vCPU / 1 TB RAM** | 近乎無上限 |
| Replica 數 | 5 個（每個 8 vCPU / 8 GB） | **42 個**（每個 24 vCPU / 24 GB） | 真正水平擴展 |
| 儲存空間 | 5 GB | **1 TB** | 長期資料無憂 |
| SLA | 99.9% | **99.99%** | 企業級可用性 |
| Log 保存 | 7 天 | **30 天** | 稽核合規需求 |
| 工作區成員 | 單人 | **無限制** | 團隊協作 |
| 支援 | 社群 | **Railway 專屬支援** | 問題快速處理 |

**建議升級時機**：同時在線用戶穩定達到 30 人，或有正式 SLA 需求時。

---

#### 階段二：中期 — 資料庫遷移（SQLite → PostgreSQL）

當用戶數持續增長，SQLite 的單寫入限制將成為系統瓶頸，需遷移至支援並發寫入的資料庫：

```
現況                              遷移後
SQLite (Railway Volume 本地檔案)  →  PostgreSQL (Railway DB 或 Supabase)
  單寫入者                              多並發寫入
  5 GB 上限                             幾乎無上限
  Replica 無法水平擴展                   可搭配多 Replica 真正水平擴展
  免費（含在 Volume 費用）               ~$5–25 USD/月（依用量）
```

**遷移工作量評估：**

| 項目 | 工作量 | 說明 |
|------|--------|------|
| Prisma schema 改寫 | 小（1–2 小時） | 僅修改 `datasource db` 區塊 |
| SQLite 特定語法修正 | 小（1–2 小時） | `contains` 改 `mode: 'insensitive'` 等 |
| 資料遷移腳本 | 中（半天） | 匯出 SQLite → 匯入 PostgreSQL |
| 測試驗證 | 中（半天） | 重跑所有 CRUD 場景 |
| **總計** | **約 1–2 天** | Prisma 抽象化後大部分業務邏輯不需修改 |

---

#### 階段三：長期 — Enterprise 或混合雲

| 選項 | 說明 | 適用情境 |
|------|------|---------|
| **Railway Enterprise** | 客製化定價、SLA 合約、SOC 2 合規 | 需要正式 SLA 合約的大型客戶 |
| **AWS / GCP / Azure** | 遷移至雲端主流平台，彈性最大 | 需要更細緻資源控制、多區域部署 |
| **自托管（On-Premise）** | 部署在客戶自有伺服器 | 資料主權、法規合規（如 GDPR、台灣個資法） |

---

### 11.4 成本估算總覽

| 方案 | 月費（USD） | 適用規模 | 主要限制 |
|------|-----------|---------|---------|
| **Hobby（現況）** | ~$5–15 | 1–30 人，內部試用 | SQLite 單寫、5 GB 儲存 |
| **Pro** | ~$20–50 | 30–200 人，正式上線 | SQLite 仍單寫 |
| **Pro + Railway PostgreSQL** | ~$40–80 | 200+ 人，高可用需求 | 無明顯技術瓶頸 |
| **Enterprise** | 洽談定制 | 大型企業、合規需求 | — |

> [!NOTE]
> Railway 採**按秒計費**，空閒時段（例如夜間）自動降低費用。台灣時區工作日尖峰約 8–18 時，實際月費通常低於上限估算。

---

*文件由 Antigravity AI 自動生成，基於實際 source code、git history 與 Railway 官方定價頁面（2026-05-27）分析。*
