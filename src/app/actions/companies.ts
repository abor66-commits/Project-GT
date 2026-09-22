'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { logAction } from '@/lib/audit';
import { getSession } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function createCompany(data: {
  name: string;
  website: string;
  industry: string;
  region: string;
  platform: string;
  sizeScale: string;
  ownerId: string;
  // Optional contact info from OCR
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactTitle?: string;
}) {
  try {
    const { contactName, contactEmail, contactPhone, contactTitle, ...companyData } = data;

    // Create Company and Contact in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          ...companyData,
          status: 'POTENTIAL',
        }
      });

      // If contact info is provided, create a primary contact
      if (contactName) {
        await tx.contact.create({
          data: {
            name: contactName,
            email: contactEmail || '',
            phone: contactPhone || '',
            jobTitle: contactTitle || '聯絡窗口',
            companyId: company.id,
            isPrimary: true
          }
        });
      }

      return company;
    });

    await logAction('CREATE_COMPANY', 'CRM', `Created company: ${result.name}`);
    revalidatePath('/companies');
    return { success: true, id: result.id };
  } catch (error) {
    console.error('Failed to create company and contact:', error);
    return { success: false, error: '建立客戶與聯絡人失敗。' };
  }
}
export async function updateCompany(id: string, data: any) {
  try {
    const company = await prisma.company.update({
      where: { id },
      data
    });
    await logAction('UPDATE_COMPANY', 'CRM', `Updated company: ${company.name}`);
    revalidatePath('/companies');
    revalidatePath(`/companies/${id}`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: '更新客戶失敗' };
  }
}

export async function deleteCompany(id: string) {
  try {
    // 1. 取得目前登入的使用者 Session
    const user = await getSession();
    if (!user) {
      return { success: false, error: '未授權的操作，請先登入。' };
    }

    // 2. 獲取客戶資料以確認擁有者與日誌紀錄
    const company = await prisma.company.findUnique({
      where: { id },
      select: { name: true, ownerId: true }
    });

    if (!company) {
      return { success: false, error: '找不到該客戶資料。' };
    }

    // 3. 權限檢查：只有管理員（ADMIN）、經理（MANAGER）或該客戶的建立者（Owner）可以刪除
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER' && company.ownerId !== user.id) {
      return { success: false, error: '您沒有權限刪除其他人的客戶資料。' };
    }

    // 4. 獲取該客戶的所有聯絡人，以便清理聯絡人相關的動態紀錄
    const contacts = await prisma.contact.findMany({
      where: { companyId: id },
      select: { id: true }
    });
    const contactIds = contacts.map(c => c.id);

    // 5. 在資料庫事務中執行關聯刪除，確保原子性與資料一致性
    await prisma.$transaction([
      // A. 刪除與該客戶直接關聯的動態活動紀錄
      prisma.activity.deleteMany({
        where: {
          relatedType: 'COMPANY',
          relatedId: id
        }
      }),
      // B. 刪除與該客戶聯絡人關聯的動態活動紀錄
      prisma.activity.deleteMany({
        where: {
          relatedType: 'CONTACT',
          relatedId: { in: contactIds }
        }
      }),
      // C. 刪除所有屬於該客戶的聯絡人
      prisma.contact.deleteMany({
        where: { companyId: id }
      }),
      // D. 刪除所有與該客戶關聯的商機 (Opportunities)
      prisma.opportunity.deleteMany({
        where: { companyId: id }
      }),
      // E. 最後，刪除客戶主體資料
      prisma.company.delete({
        where: { id }
      })
    ]);

    await logAction('DELETE_COMPANY', 'CRM', `Deleted company: ${company.name}`);
    revalidatePath('/companies');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete company and relations:', error);
    return { success: false, error: '刪除客戶失敗' };
  }
}

export async function bulkUpsertCompanies(companies: any[]) {
  try {
    const results = [];
    for (const c of companies) {
      const existing = await prisma.company.findFirst({
        where: { name: c.name }
      });

      if (existing) {
        const updated = await prisma.company.update({
          where: { id: existing.id },
          data: { ...c }
        });
        results.push(updated);
      } else {
        const created = await prisma.company.create({
          data: { ...c }
        });
        results.push(created);
      }
    }
    await logAction('BULK_IMPORT', 'CRM', `Imported ${results.length} companies`);
    revalidatePath('/companies');
    return { success: true, count: results.length };
  } catch (error) {
    console.error(error);
    return { success: false, error: '批次匯入失敗' };
  }
}

export async function getAllCompaniesForExport() {
  const session = await getSession();
  if (!session) return [];

  const isRestricted = session.role === 'SALES' && session.exclusiveMode === true;
  const exclusiveFilter = isRestricted ? {
    OR: [
      { ownerId: session.id },
      { salesDeputy: session.id }
    ]
  } : {};

  return await prisma.company.findMany({
    where: exclusiveFilter,
    include: {
      owner: { select: { name: true } },
      contacts: { where: { isPrimary: true }, take: 1 }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function enrichCompanyWithAI(id: string, websiteUrl: string) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: '未授權的操作，請先登入。' };
    }

    const company = await prisma.company.findUnique({
      where: { id }
    });

    if (!company) {
      return { success: false, error: '找不到該客戶資料。' };
    }

    let homepageText = '';
    if (websiteUrl) {
      try {
        let targetUrl = websiteUrl.trim();
        if (!/^https?:\/\//i.test(targetUrl)) {
          targetUrl = `https://${targetUrl}`;
        }
        const res = await fetch(targetUrl, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const html = await res.text();
          // Extract title and meta description
          const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
          const metaMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
          homepageText = `Title: ${titleMatch ? titleMatch[1] : ''}. Description: ${metaMatch ? metaMatch[1] : ''}`;
        }
      } catch (fetchErr) {
        console.warn('Failed to fetch website snippet:', fetchErr);
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, error: '系統未設定 GEMINI_API_KEY 環境變數。' };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
Analyze the company: "${company.name}"
Website: "${websiteUrl || company.website || ''}"
Industry: "${company.industry || ''}"
Homepage Snippet: "${homepageText}"

Please estimate their cloud intelligence profile and return it STRICTLY as a JSON object.
Required JSON format:
{
  "cloudSpendEst": number (estimated monthly cloud spend in USD, e.g. 5000, 15000, or 0 if none),
  "cloudRenewalDate": "string (estimated next renewal/contract end date in YYYY-MM-DD format, or leave empty if unknown)",
  "technographics": "string (comma-separated list of cloud technologies and tools they likely use, e.g. 'AWS, Kubernetes, Terraform, PostgreSQL')",
  "priorityScore": "string (HIGH, MEDIUM, or LOW based on sales potential for a Cloud MSP)",
  "platform": "string (the main cloud provider they use: AWS, Azure, GCP, or Multi-Cloud)"
}
Do NOT wrap the output in markdown code blocks or add any extra text. Just output the raw JSON object.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().replace(/```json/gi, '').replace(/```/g, '').trim();

    const parsedData = JSON.parse(text);

    // Save back to DB
    const updatedCompany = await prisma.company.update({
      where: { id },
      data: {
        cloudSpendEst: parsedData.cloudSpendEst ? parseFloat(parsedData.cloudSpendEst) : null,
        cloudRenewalDate: parsedData.cloudRenewalDate ? new Date(parsedData.cloudRenewalDate) : null,
        technographics: parsedData.technographics || null,
        priorityScore: parsedData.priorityScore || null,
        platform: parsedData.platform || company.platform,
      }
    });

    await logAction('ENRICH_COMPANY', 'CRM', `Enriched company ${company.name} with AI`);
    revalidatePath('/companies');
    revalidatePath(`/companies/${id}`);

    return { success: true, data: updatedCompany };
  } catch (error: any) {
    console.error('Failed to enrich company with AI:', error);
    return { success: false, error: error.message || 'AI 增益分析失敗。' };
  }
}

