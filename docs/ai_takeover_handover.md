# GCS CRM - AI 智能商情增益與 ROI 看板開發交接文件
# Developer Handover & Takeover Guide: AI Lead Enrichment & ROI Dashboard
# 開発引き継ぎガイド：AIリードエンリッチメントとROIダッシュボード

---

## 🇹🇼 繁體中文 (Traditional Chinese)

### 1. 專案背景與目標
本文件旨在引導後續接續開發的 AI 代理人或開發人員，理解並繼續實作「GCS CRM 雲端商情整合與銷售 ROI 追蹤模組」。此功能將取代昂貴的 Intricately 商業資料庫，利用內建 AI 與 CRM 的業務數據（商機漏斗及成交金額）結合，向管理層展示商情數據的實際業績貢獻。

### 2. 資料庫與 Schema 修改 (Database Specs)
請在 [schema.prisma](file:///Users/jacobchou/.gemini/antigravity/Project/prisma/schema.prisma) 的 `Company` 模型中，新增以下欄位：
```prisma
model Company {
  // ... 既有欄位
  cloudSpendEst     Float?    @map("cloud_spend_est")     // 預估月雲端支出金額 (USD)
  cloudRenewalDate  DateTime? @map("cloud_renewal_date")   // 合約續約或到期時間
  technographics    String?                                // 技術堆疊，例如 "AWS, Kubernetes, Datadog" (逗號分隔)
  priorityScore     String?   @map("priority_score")      // 優先級評分 (HIGH, MEDIUM, LOW)
}
```
**執行指令**：
```bash
npx prisma db push
npx prisma generate
```

### 3. 後端 Server Action 與 API 實作
- **檔案**：`src/app/actions/companies.ts`
- **任務**：實作 `enrichCompanyWithAI(companyId: string, websiteUrl: string)`。
  1. 使用 `fetch` 抓取網頁公開內容或透過搜尋引擎取得該公司公開資訊（可利用 Gemini 的內建搜尋能力）。
  2. 呼叫 Gemini AI (`gemini-2.5-flash`)，提示詞（Prompt）要求解析該公司的雲端服務商、預估雲端支出（以級距表示，如 `$5000-$10000`）、技術堆疊、近期可能的合約續約時間等。
  3. 將結果解析為結構化 JSON 並儲存回 `Company` 資料表。

### 4. 前端 UI 元件修改
- **客戶列表與詳情** (`src/app/(dashboard)/companies/page.tsx`)：
  - 新增「預估雲端支出」與「技術棧」的篩選器與欄位展示。
  - 在編輯客戶的 Modal 中，加入一鍵 **「AI 商情增益」** 按鈕，點擊後觸發 `enrichCompanyWithAI`，並顯示載入中動畫（Loder）。
- **PWA 行動版優化**：
  - 確保上述新增欄位在 PWA 手機端檢視時以卡片（Card）化緊湊排版呈現，方便業務外出時隨時查閱。

### 5. 雲端商情 ROI 看板實作
- **檔案路徑**：`src/app/(dashboard)/reports/cloud-roi/page.tsx`
- **功能設計**：
  1. 使用 `recharts` 繪製圖表。
  2. **圖表一（柱狀圖）**：不同雲端支出級距的客戶，在 `Opportunity` 中所創造的總 Pipeline 價值。
  3. **圖表二（圓餅圖）**：帶有不同雲端技術標籤（如 `AWS-Target`、`Azure-Target`）之客戶已結案（Closed-Won）的實際收益比例。
  4. 展示商情資料工具的使用成本與實際商機收益的 ROI 比例。

---

## 🇺🇸 English (English)

### 1. Project Context & Objectives
This guide instructs subsequent AI agents or developers on how to implement the "GCS CRM Cloud Spend & Technographic Intelligence Integration" module. It replaces expensive databases like Intricately by combining localized AI data collection with GCS CRM's opportunity funnel to demonstrate direct revenue contributions (ROI) to management.

### 2. Database Schema Modifications
Modify the `Company` model in [schema.prisma](file:///Users/jacobchou/.gemini/antigravity/Project/prisma/schema.prisma):
```prisma
model Company {
  // ... existing fields
  cloudSpendEst     Float?    @map("cloud_spend_est")     // Estimated monthly cloud spend (USD)
  cloudRenewalDate  DateTime? @map("cloud_renewal_date")   // Contract renewal or expiration date
  technographics    String?                                // Technographics, e.g. "AWS, Kubernetes, Datadog" (comma separated)
  priorityScore     String?   @map("priority_score")      // Priority score (HIGH, MEDIUM, LOW)
}
```
**Database Setup Commands**:
```bash
npx prisma db push
npx prisma generate
```

### 3. Backend Server Actions & API Design
- **Target File**: `src/app/actions/companies.ts`
- **Task**: Implement `enrichCompanyWithAI(companyId: string, websiteUrl: string)`.
  1. Crawl or search public data/job postings for the company using Gemini.
  2. Construct a prompt for Gemini AI (`gemini-2.5-flash`) to parse technographics, cloud providers, estimated spend bands (e.g. $5k-$10k), and renewal timelines.
  3. Save the structured JSON output back to the `Company` record.

### 4. UI/UX Implementations
- **Company Pages** (`src/app/(dashboard)/companies/page.tsx`):
  - Add filters for "Cloud Spend" and "Technographics".
  - Add an **"AI Enrich"** button in the company edit modal, triggering `enrichCompanyWithAI` with a loading state.
- **PWA Mobile View**:
  - Optimize the layout of these new cloud footprint details for tight mobile screens.

### 5. ROI Dashboard
- **File Path**: `src/app/(dashboard)/reports/cloud-roi/page.tsx`
- **Visualizations (using recharts)**:
  - **Chart 1 (Bar)**: Pipeline values generated from different cloud spend tiers.
  - **Chart 2 (Pie)**: Closed-Won revenue contributions categorized by cloud tags (e.g., `AWS-Target`, `Azure-Target`).

---

## 🇯🇵 日本語 (Japanese)

### 1. プロジェクトの背景と目的
本書は、後続のAIエージェントまたは開発者が「GCS CRM クラウド商情統合および販売ROI追跡モジュール」の実装を引き継ぐための開発ガイドです。高額なIntricatelyの代わりに、内蔵AIによる技術情報の自動収集と、CRMの商談情報・成約金額を紐づけることで、営業商情データの実際の売上貢献度（ROI）を経営陣に証明します。

### 2. データベーススキーマの変更 (Prisma)
[schema.prisma](file:///Users/jacobchou/.gemini/antigravity/Project/prisma/schema.prisma)の `Company` モデルに以下のフィールドを追加します。
```prisma
model Company {
  // ... 既存フィールド
  cloudSpendEst     Float?    @map("cloud_spend_est")     // 予想月間クラウド支出 (USD)
  cloudRenewalDate  DateTime? @map("cloud_renewal_date")   // 契約更新または満了日
  technographics    String?                                // 技術スタック、例: "AWS, Kubernetes, Datadog" (カンマ区切り)
  priorityScore     String?   @map("priority_score")      // 優先度スコア (HIGH, MEDIUM, LOW)
}
```
**実行コマンド**：
```bash
npx prisma db push
npx prisma generate
```

### 3. バックエンド Server Action と API 実作
- **対象ファイル**：`src/app/actions/companies.ts`
- **タスク**：`enrichCompanyWithAI(companyId: string, websiteUrl: string)` の実装。
  1. 対象企業の公式Webサイトや公開情報（求人情報など）をクローリング、またはGeminiの検索能力を利用して取得。
  2. Gemini AI (`gemini-2.5-flash`) を呼び出し、技術スタック、利用クラウドサービス、予想支出レベル（例: $5,000〜$10,000）、更新予定日等を構造化JSONとして抽出。
  3. 解析されたデータを `Company` テーブルに保存。

### 4. フロントエンド UI の修正
- **顧客管理画面** (`src/app/(dashboard)/companies/page.tsx`)：
  - 「クラウド支出額」と「技術スタック」のフィルタおよび項目表示を追加。
  - 顧客編集モーダルに **「AI商情増益」** ボタンを追加し、クリック時に `enrichCompanyWithAI` を実行（ローディング表示付き）。
- **PWA モバイル対応**：
  - スマホのPWA環境で表示した際、これらの新項目がカード形式でコンパクトに配置され、外出先でも素早く閲覧できるように最適化。

### 5. クラウド商情 ROI ダッシュボードの実装
- **ファイルパス**：`src/app/(dashboard)/reports/cloud-roi/page.tsx`
- **設計仕様 (recharts 使用)**：
  - **グラフ1（棒グラフ）**：異なるクラウド支出帯の顧客が作成した商談（Opportunity）の総パイプライン価値。
  - **グラフ2（パイ型グラフ）**：特定のターゲットタグ（`AWS-Target`、`Azure-Target`など）を持つ顧客の成約（Closed-Won）売上シェア。
