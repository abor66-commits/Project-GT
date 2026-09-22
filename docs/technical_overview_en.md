# GCS CRM System Technical Documentation
### Preview Release — Technical Briefing Document
> Version: Preview v0.1 | Updated: 2026-05-27

---

## I. System Overview

GCS CRM is a **full-stack cloud-based Customer Relationship Management system** designed for enterprise sales and marketing needs. It adopts a Server-Side Rendering architecture, supports multi-language, multi-role, customizable SMTP email sending, and integrates AI business card recognition and API-based Web-to-Lead forms.

```
User Browser
    │
    ▼
Next.js App (Railway)
    ├── Server Components (Data reading, Permission checks)
    ├── Server Actions (Data writing, Business logic)
    ├── API Routes (Third-party Webhooks, AI, Global search)
    │
    ├── Prisma ORM ──► SQLite (better-sqlite3)
    │
    ├── Nodemailer ──► Any SMTP Server
    └── Resend SDK ──► Resend Email API (Fallback)
```

---

## II. Tech Stack

### Core Framework

| Layer | Technology | Version | Reason for Selection |
|------|------|------|---------|
| Web Framework | **Next.js** | 16.2.4 | App Router, Server Actions, unified SSR/SSG integration |
| UI Runtime | **React** | 19.2.4 | Latest stable version, supports `useTransition` and Server Components |
| Language | **TypeScript** | ^5 | Full-stack type safety |
| Styling | **Vanilla CSS** | — | Zero external dependencies, implements dark mode using CSS variables |
| ORM | **Prisma** | 7.8.0 | Type-safe Queries, automatic Migrations, supports multiple DB engines |
| Database | **SQLite** (better-sqlite3) | 12.9.0 | Single-file deployment, mounted on Railway persistent volume |
| Deployment Platform | **Railway** | — | Containerized deployment, automatic CI/CD, Persistent Volume |

### Frontend Packages

| Package | Version | Purpose |
|------|------|------|
| **Recharts** | ^3.8.1 | Decision reporting charts (Donut, Bar, Line charts) |
| **Tiptap** (Suite) | ^3.23.6 | WYSIWYG rich text editor for mass emailing |
| `@tiptap/react` | — | React integration |
| `@tiptap/starter-kit` | — | Basic formatting (Bold, Italic, Headings, Lists, etc.) |
| `@tiptap/extension-*` | — | Color, TextStyle, Link, TextAlign, Underline, Image |

---

## III. Third-Party Service Integration

### 3.1 Email Sending

The system implements a **dual-mode fallback** email architecture, prioritizing the API mode and automatically degrading to SMTP when unavailable:

```
Call sendEmail()
    │
    ├── Has MAIL_API_KEY?
    │       ▼ Yes
    │   Resend SDK (HTTP API)
    │       └── Settings from DB or ENV
    │
    └── No → SMTP via Nodemailer
            └── Setting priority: DB > ENV
```

| Service | Package | Environment Variable | Purpose |
|------|------|----------|------|
| **Resend** | `resend ^6.12.3` | `MAIL_API_KEY` / `RESEND_API_KEY` | API-based email sending (Preferred) |
| **Any SMTP** | `nodemailer ^8.0.7` | `SMTP_HOST/PORT/USER/PASS/FROM` | Traditional SMTP (Configurable in admin panel) |

> SMTP settings are prioritized to be read from the DB `SystemSetting` table (modifiable via admin panel). If not set in the DB, ENV variables are read.

#### Resend Pricing Plans (Transactional Email, as of 2026-05-27)

| Plan | Monthly Fee | Included Volume | Overage Rate (Per 1,000 emails) | Daily Limit |
|------|------|----------|----------------------|---------|
| **Free** | $0 | 3,000 emails/month | — | 100 emails/day |
| **Pro** | $20 | 50,000 emails/month | $0.90 | No limit |
| **Pro** | $35 | 100,000 emails/month | $0.90 | No limit |
| **Scale** | $90 | 100,000 emails/month | $0.90 | No limit |
| **Scale** | $350 | 500,000 emails/month | $0.70 | No limit |
| **Scale** | $650 | 1,000,000 emails/month | $0.65 | No limit |
| **Enterprise**| Custom | Custom (3M+ emails/month) | Custom | No limit |

> [!NOTE]
> **Current Scenario Assessment:**
> - CRM mass emails (marketing notifications, automated welcome emails) are considered Transactional Emails.
> - **Free Plan** (daily limit of 100 emails) is suitable for internal testing of the initial preview version.
> - **Pro $20/month** (50,000 emails/month) can support approximately **1,667 mass campaigns × 30 recipients**, sufficient for general SMEs.
> - Overages are billed at $0.90/thousand emails, allowing flexible expansion without changing plans.

---

### 3.2 AI Business Card Recognition

| Item | Description |
|------|------|
| **Service** | Google Gemini AI (`@google/generative-ai ^0.24.1`) |
| **Model** | `gemini-2.0-flash` (Multimodal) |
| **Environment Variables** | `GEMINI_API_KEY` |
| **API Route** | `POST /api/ai/recognize-card` |
| **Flow** | Frontend captures/uploads card → Base64 → Gemini Vision → Structured JSON (Name/Title/Phone/Email/Company) → Auto-fill form |
| **Fallback** | OpenAI SDK is also installed (`openai ^6.39.0`, `OPENAI_API_KEY`) and can be switched |

---

### 3.3 Web-to-Lead Form Integration API

```
External Form POST /api/marketing/lead
    Headers: { x-api-key: <Marketing API Key> }
    Body: { companyName, contactName, email, phone, source, tags[] }
         ▼
    Validate API Key (DB SystemSetting)
         ▼
    Auto-create Company + Contact + Tag associations
         ▼
    Trigger AutomationRule (If matching tags exist)
```

| Item | Description |
|------|------|
| Route | `POST /api/marketing/lead` |
| Auth | Header `x-api-key` (Generated in admin panel, supports reset) |
| Automation | Triggers AutomationRule after adding lead → Automatically sends welcome email |

---

### 3.4 Global Search API

| Item | Description |
|------|------|
| Route | `GET /api/search?q={query}` |
| Search Scope| Company Name, Contact Name/Email, Opportunity Name, Marketing Tags |
| Architecture Decision | Uses **REST API Route** instead of Server Action to prevent `failed-to-find-server-action` errors caused by Next.js chunk hash invalidation |

---

## IV. Database Design

### 4.1 Data Model (Schema)

```
User ──────── Company (1:N, owner)
              │
              ├── Contact (1:N)
              ├── Opportunity (1:N)
              └── Tag (M:N)
                  │
                  └── Contact (M:N, ContactTags)

AutomationRule        →  triggerVal = Tag name
MarketingLog          →  Records each mass send/trigger event
EmailTemplate         →  User-defined email templates (can be set as shared)
SystemSetting         →  Dynamic settings like SMTP/SSO/Logo
AuditLog              →  ISO 27001 security audit logs
VerificationCode      →  2FA verification codes (time-sensitive)
```

### 4.2 Migration History

| Version | Date | Content |
|------|------|------|
| `init_new_structure` | 2026-05-06 | Initialize User/Company/Contact/Opportunity/Activity |
| `structural_redesign_v2` | 2026-05-06 | Structural redesign, adding SystemSetting, AuditLog, VerificationCode |
| `add_marketing_tags` | 2026-05-14 | Tag model, Company↔Tag M:N, Contact↔Tag M:N |
| `add_automation_rules_v2` | 2026-05-14 | AutomationRule (TAG_ADDED → SEND_EMAIL) |
| `add_marketing_log` | 2026-05-14 | MarketingLog sending records |
| `add_contact_created_by` | 2026-05-26 | Contact.createdById (Permission control for delete/modify) |
| `add_email_template` | 2026-05-27 | EmailTemplate (Custom templates, isShared sharing permission) |

---

## V. System Functional Modules

### 5.1 Page Routing Map

```
/                          Dashboard (KPI cards, Sales funnel, Latest updates)
/companies                 Client List (Tag filtering, Full-text search, Sorting)
/companies/[id]            Client Details (Contact cards, Opportunities, Activity logs)
/opportunities             Opportunity Management
/reports                   Decision Reports (6 Charts, PDF export)
/marketing                 Marketing Console
/marketing/broadcaster     Mass Emailing (WYSIWYG editor + Template system)
/marketing/automation      Automated Nurturing Rules
/marketing/integration     Web-to-Lead Form Integration
/marketing/history         Mass Emailing History
/users                     Team Management
/settings/general          System Parameters (Logo, Company Name)
/settings/smtp             SMTP Settings
/settings/sso              SSO Configuration
/settings/logs             ISO Security Audit Logs
/profile                   Personal Settings
```

### 5.2 Server Actions (Business Logic Layer)

| File | Function |
|------|------|
| `actions/auth.ts` | Login, 2FA verification, Password reset |
| `actions/companies.ts` | Company CRUD, AI business card import |
| `actions/contacts.ts` | Contact CRUD (Permission: Can self-delete/modify created ones) |
| `actions/marketing.ts` | Mass emailing, Automation rules, API Key management |
| `actions/emailTemplates.ts` | Email template CRUD (isShared sharing permission) |
| `actions/opportunities.ts` | Opportunity CRUD |
| `actions/settings.ts` | SMTP/Logo/SSO settings (including Logo image compression) |
| `actions/users.ts` | User invitation, Role/Status management, 2FA reset |
| `actions/search.ts` | Internal search logic (Invoked by API Route) |

---

## VI. Security Architecture

| Mechanism | Implementation |
|------|---------|
| **Authentication** | Cookie-based Session (`user_email` cookie) |
| **2FA** | Email OTP verification code (`VerificationCode` table, 5-minute expiry) |
| **Role Permissions**| Six roles: `ADMIN / MANAGER / SALES / MARKETING / ASSISTANT / SSO` |
| **SSO Support** | `SSO` role in conjunction with external IdP configuration |
| **Audit Logs** | Every sensitive operation is written to `AuditLog` (ISO 27001 standard) |
| **API Key Auth** | Web-to-Lead endpoint requires Header `x-api-key`, supports admin reset |

---

## VII. Internationalization (i18n)

| Item | Description |
|------|------|
| Supported Languages | Traditional Chinese `zh-TW`, English `en`, Japanese `ja` |
| Implementation | Custom `LanguageContext` (React Context + Cookie persistence) |
| Language Detection| Reads `navigator.language` on first visit → Writes to Cookie |
| Translation Coverage| 161 keys for all system UI strings, 100% coverage across 3 languages |
| Translation File | `src/lib/i18n/translations.ts` |

---

## VIII. Environment Variables List

| Variable Name | Required | Description |
|---------|------|------|
| `DATABASE_URL` | ✅ | SQLite database path |
| `GEMINI_API_KEY` | ✅ | Google Gemini AI (Business card recognition) |
| `MAIL_API_KEY` / `RESEND_API_KEY` | One of two | Resend API Key |
| `SMTP_HOST` | One of two | SMTP host (Can be overridden in admin settings) |
| `SMTP_PORT` | — | Default 587 |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password |
| `SMTP_FROM` / `MAIL_FROM_ADDRESS` | — | Sender address |
| `OPENAI_API_KEY` | — | Fallback AI (Reserved) |
| `NEXT_PUBLIC_APP_URL` | — | System public URL (Used for invitation email links) |

---

## IX. Key Design Decisions

| Decision | Reason |
|------|------|
| Next.js Server Actions for writing, API Routes for querying | Prevents Server Action ID hash invalidation (`failed-to-find-server-action`) after client back-and-forth navigation |
| SQLite + Railway Persistent Volume | Simplifies deployment, zero extra costs, no external DB service required |
| Tiptap replaces `<textarea>` HTML editing | Non-engineer marketing staff can directly use WYSIWYG, and output remains an HTML string with zero upstream logic changes |
| Logo upload Canvas compression | Prevents overly large Base64 images from exceeding SQLite row size limits and causing write failures |
| Contact permissions: createdById | Contacts added by sales/marketing can be deleted/modified by themselves without affecting others' data |
| Mass email per-recipient variable replacement | `{{contactName}}`, `{{companyName}}` are individually replaced for each recipient during sending |

---

## X. Code Statistics

| Category | Count |
|------|------|
| React Components | 37 |
| Page Routes (Next.js) | 43 |
| Server Actions Functions | ~60 |
| API Routes | 4 |
| Database Migrations | 7 |
| Translation Keys | 161 × 3 languages |
| Total Lines of Code (src/) | ~31,000 lines |

---

## XI. Deployment Platform Constraints & Scale-up Roadmap

### 11.1 Current Status: Railway Hobby Plan

The system is currently deployed on the **Railway Hobby Plan**. Below are the actual resource constraints:

| Resource Item | Hobby Plan Constraints | Description |
|---------|--------------|------|
| **Cost** | $5/month (Includes $5 usage credit) | Billed according to actual usage if exceeded |
| **Compute** | Up to 48 vCPU / 48 GB RAM | Per Service limit |
| **Replicas (Horizontal Scaling)** | Up to 5, each with 8 vCPU / 8 GB RAM | |
| **Storage (SQLite)** | Up to 5 GB Persistent Volume | SQLite database mounted here |
| **SLA Availability** | 99.9% Availability Target | |
| **Log Retention** | 7 Days | |
| **Workspace Members** | Single developer workspace | |
| **Support** | Community support (Discord) | No dedicated support |

> [!WARNING]
> **Key Constraint: SQLite Single Writer**
> SQLite only supports a **single writer** and does not support concurrent writing by multiple replicas.
> Even though Railway Hobby allows up to 5 replicas, enabling multiple replicas will cause write conflicts in the database. **Enabling multiple replicas is currently not recommended.**

---

### 11.2 Concurrent User Load Estimation

| Usage Scenario | Safe Concurrent Users | Bottleneck |
|---------|-------------|-------|
| General CRM Operations (Read-heavy, write-light) | **50–100 users** | SQLite write lock |
| Large volume mass email triggers (Automation) | **< 20 simultaneous users** | SMTP queue + SQLite |
| Simultaneous AI business card recognition usage | **< 10 simultaneous uploads** | Gemini API rate limits |

> CRM systems inherently belong to **internal tools, low-concurrency** scenarios. The Hobby Plan is sufficient for **daily use by 20–50 sales/marketing personnel**.

---

### 11.3 Scale-up Roadmap

#### Phase 1: Short-term — Hobby → Pro (Fastest path)

| Upgrade Item | Hobby (Current) | Pro | Benefit |
|---------|------------|-----|------|
| Cost | $5/month | **$20/month** | Includes $20 usage credit |
| Max Compute | 48 vCPU / 48 GB | **1,000 vCPU / 1 TB RAM** | Nearly limitless |
| Replicas | 5 (each 8 vCPU / 8 GB) | **42** (each 24 vCPU / 24 GB) | True horizontal scaling |
| Storage | 5 GB | **1 TB** | Long-term data peace of mind |
| SLA | 99.9% | **99.99%** | Enterprise-grade availability |
| Log Retention | 7 Days | **30 Days** | Audit compliance requirements |
| Workspace Members | Single user | **Unlimited** | Team collaboration |
| Support | Community | **Railway Dedicated Support** | Fast issue resolution |

**Recommended Upgrade Timing**: When concurrent online users consistently reach 30, or when formal SLA is required.

---

#### Phase 2: Mid-term — Database Migration (SQLite → PostgreSQL)

As user numbers continue to grow, SQLite's single-write limit will become a system bottleneck, necessitating a migration to a database supporting concurrent writes:

```
Current Status                              After Migration
SQLite (Railway Volume Local File)  →  PostgreSQL (Railway DB or Supabase)
  Single writer                              Multiple concurrent writers
  5 GB limit                                 Virtually limitless
  Replicas cannot scale horizontally         Can use multiple replicas for true horizontal scaling
  Free (Included in Volume cost)             ~$5–25 USD/month (Depending on usage)
```

**Migration Workload Assessment:**

| Item | Workload | Description |
|------|--------|------|
| Prisma schema rewrite | Small (1–2 hours) | Only modify `datasource db` block |
| SQLite specific syntax fixes | Small (1–2 hours) | Change `contains` to `mode: 'insensitive'`, etc. |
| Data migration script | Medium (Half day) | Export SQLite → Import PostgreSQL |
| Testing validation | Medium (Half day) | Re-run all CRUD scenarios |
| **Total** | **Approx. 1–2 days** | Most business logic remains unchanged after Prisma abstraction |

---

#### Phase 3: Long-term — Enterprise or Hybrid Cloud

| Option | Description | Applicable Scenarios |
|------|------|---------|
| **Railway Enterprise** | Custom pricing, SLA contracts, SOC 2 compliance | Large clients requiring formal SLA contracts |
| **AWS / GCP / Azure** | Migrate to mainstream cloud platforms, maximum flexibility | Requires granular resource control, multi-region deployment |
| **Self-hosted (On-Premise)** | Deployed on client's own servers | Data sovereignty, regulatory compliance (e.g., GDPR, Taiwan PDPA) |

---

### 11.4 Cost Estimation Overview

| Plan | Monthly Fee (USD) | Applicable Scale | Major Constraints |
|------|-----------|---------|---------|
| **Hobby (Current)** | ~$5–15 | 1–30 users, Internal trial | SQLite single write, 5 GB storage |
| **Pro** | ~$20–50 | 30–200 users, Official launch | SQLite still single write |
| **Pro + Railway PostgreSQL** | ~$40–80 | 200+ users, High availability needs | No obvious technical bottlenecks |
| **Enterprise** | Custom negotiation | Large enterprises, compliance needs | — |

> [!NOTE]
> Railway bills **per second** and automatically reduces costs during idle periods (e.g., at night). Peak working hours in Taiwan time are around 08:00–18:00, and actual monthly costs are typically lower than the maximum estimate.

---

*Document automatically generated by Antigravity AI, based on actual source code, git history, and Railway official pricing page (2026-05-27) analysis.*
