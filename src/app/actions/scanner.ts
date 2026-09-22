'use server';

import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

const MOCK_CARDS = [
  {
    name: 'Julianne Kai',
    email: 'julianne.kai@quantum.com',
    company: 'Quantum Analytics Inc.',
    jobTitle: 'Senior Director',
    phone: '+1 (512) 555-0199'
  },
  {
    name: 'Robert Chen',
    email: 'robert.chen@quantum.com',
    company: 'Quantum Analytics',
    jobTitle: 'VP of Sales',
    phone: '+1 (512) 555-0200'
  },
  {
    name: 'Alice Wang',
    email: 'alice.wang@gmail.com',
    company: 'Alice Studio',
    jobTitle: 'Founder',
    phone: '+886 912345678'
  }
];

// Mock function for AI Parsing (simulates a vision API call)
export async function parseBusinessCardWithAI(formData?: FormData) {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return random card for demo purposes
  const card = MOCK_CARDS[Math.floor(Math.random() * MOCK_CARDS.length)];
  return card;
}

const FREE_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];

export async function checkDomainMatch(email: string) {
  if (!email || !email.includes('@')) return null;
  const domain = email.split('@')[1].toLowerCase();
  
  if (FREE_EMAIL_DOMAINS.includes(domain)) {
    return { id: null, domain: null, name: null }; // Do not match on free email domains
  }
  
  const existingCompany = await prisma.company.findFirst({
    where: { domain }
  });
  
  if (existingCompany) {
    return {
      id: existingCompany.id,
      name: existingCompany.name,
      domain
    };
  }
  
  return { id: null, domain, name: null };
}

export async function saveScannedCard(data: {
  companyId?: string | null;
  companyName: string;
  domain: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactTitle: string;
}) {
  const user = await getSession();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const result = await prisma.$transaction(async (tx) => {
      let companyId = data.companyId;

      // 1. Create company if not exists
      if (!companyId) {
        const newCompany = await tx.company.create({
          data: {
            name: data.companyName,
            domain: data.domain,
            ownerId: user.id,
            status: 'POTENTIAL',
            industry: 'Technology', // Default for demo
            sizeScale: 'SMB',       // Default for demo
          }
        });
        companyId = newCompany.id;
        await logAction('CREATE_COMPANY', 'CRM', `Created company via AI Scan: ${data.companyName}`);
      }

      // 2. Create contact
      await tx.contact.create({
        data: {
          name: data.contactName,
          email: data.contactEmail,
          phone: data.contactPhone,
          jobTitle: data.contactTitle,
          companyId: companyId,
          isPrimary: false,
          createdById: user.id
        }
      });

      return companyId;
    });

    revalidatePath('/companies');
    revalidatePath(`/companies/${result}`);
    return { success: true, companyId: result };
  } catch (error) {
    console.error('Save scanned card error:', error);
    return { success: false, error: 'Failed to save scanned card' };
  }
}
