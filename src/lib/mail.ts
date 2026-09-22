import nodemailer from 'nodemailer';
import { prisma } from './db';

export async function getTransporter() {
  // Try to get from a single JSON key first
  const jsonSetting = await prisma.systemSetting.findUnique({ where: { key: 'SMTP_CONFIG' } });
  let config: Record<string, string> = {};

  if (jsonSetting?.value) {
    try {
      const parsed = JSON.parse(jsonSetting.value);
      config = {
        SMTP_HOST: (parsed.host || '').trim(),
        SMTP_PORT: (parsed.port || '').toString().trim(),
        SMTP_USER: (parsed.user || '').trim(),
        SMTP_PASS: (parsed.pass || '').trim(),
        SMTP_FROM: (parsed.from || '').trim()
      };
    } catch (e) {
      console.error('[Mail] Failed to parse SMTP_CONFIG JSON');
    }
  } else {
    // Fallback to individual keys from DB
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']
        }
      }
    });
    settings.forEach(s => { config[s.key] = s.value; });
  }

  // Fallback to environment variables if still not fully configured
  config.SMTP_HOST = config.SMTP_HOST || process.env.SMTP_HOST || '';
  config.SMTP_PORT = config.SMTP_PORT || process.env.SMTP_PORT || '587';
  config.SMTP_USER = config.SMTP_USER || process.env.SMTP_USER || '';
  config.SMTP_PASS = config.SMTP_PASS || process.env.SMTP_PASS || '';
  config.SMTP_FROM = config.SMTP_FROM || process.env.SMTP_FROM || process.env.MAIL_FROM_ADDRESS || '';

  if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
    console.warn('[Mail] SMTP not fully configured in DB or ENV variables.');
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: parseInt(config.SMTP_PORT || '587'),
    secure: config.SMTP_PORT === '465',
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
  });

  return { transporter, from: config.SMTP_FROM };
}

import { Resend } from 'resend';

export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text?: string }) {
  // Check if there is an API-based mail configuration (MAIL_API_KEY) in DB or ENV
  const apiKeySetting = await prisma.systemSetting.findUnique({ where: { key: 'MAIL_API_KEY' } });
  const apiKey = apiKeySetting?.value || process.env.MAIL_API_KEY || process.env.RESEND_API_KEY;

  if (apiKey) {
    console.log('[Mail] Using Resend SDK mode');
    const resend = new Resend(apiKey);
    
    const mailSetup = await getTransporter();
    const fallbackFrom = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_FROM || 'GCS CRM <Jacobchou@grandtechcloud.com>';
    const fromAddress = mailSetup?.from || fallbackFrom;

    try {
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: to.includes(',') ? to.split(',').map(e => e.trim()) : [to],
        subject,
        html,
        text: text || html.replace(/<[^>]*>?/gm, ''),
      });

      if (error) {
        console.error('[Resend SDK Error]', error);
        throw new Error(error.message);
      }

      console.log(`[Mail API Success] Email sent to ${to}, ID: ${data?.id}`);
      return { success: true };
    } catch (e) {
      console.error('[Mail API Error]', e);
      return { success: false, error: (e as Error).message };
    }
  }

  // Fallback to traditional SMTP
  const mailSetup = await getTransporter();

  if (!mailSetup) {
    console.log(`[Mail Mock] To: ${to} | Subject: ${subject} | Body: ${text || html}`);
    return { success: false, message: 'SMTP not configured' };
  }

  const { transporter, from } = mailSetup;
  const fromAddress = from || 'GCS CRM <Jacobchou@grandtechcloud.com>';

  try {
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ''),
      html,
    });
    console.log(`[Mail Success] Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('[Mail Error]', error);
    return { success: false, error: (error as Error).message };
  }
}
