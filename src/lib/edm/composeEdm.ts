export interface EdmSettings {
  // Header
  headerTitle: string;
  headerBgColor: string;
  // Banner
  bannerEnabled: boolean;
  bannerImageUrl: string;
  bannerAltText: string;
  // CTA Button
  ctaEnabled: boolean;
  ctaLabel: string;
  ctaUrl: string;
  ctaBgColor: string;
  // Footer
  footerEnabled: boolean;
  footerText: string;
}

export const defaultEdmSettings: EdmSettings = {
  headerTitle: '',
  headerBgColor: '#4F46E5',
  bannerEnabled: false,
  bannerImageUrl: '',
  bannerAltText: '',
  ctaEnabled: false,
  ctaLabel: '立即了解',
  ctaUrl: '',
  ctaBgColor: '#4F46E5',
  footerEnabled: true,
  footerText: '© 2026 Your Company. All rights reserved.',
};

/**
 * Compose a full email-safe, table-based EDM HTML document.
 * @param bodyContent  HTML from Tiptap (the main body text)
 * @param settings     EdmSettings controlling structural blocks
 */
export function composeEdmHtml(bodyContent: string, settings: EdmSettings): string {
  const header = settings.headerTitle
    ? `
    <tr>
      <td bgcolor="${settings.headerBgColor}" style="padding: 36px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: bold; letter-spacing: 1px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          ${escapeHtml(settings.headerTitle)}
        </h1>
      </td>
    </tr>`
    : '';

  const banner = settings.bannerEnabled && settings.bannerImageUrl
    ? `
    <tr>
      <td style="padding: 0; line-height: 0;">
        <img
          src="${settings.bannerImageUrl}"
          alt="${escapeHtml(settings.bannerAltText || '')}"
          width="600"
          style="width: 100%; max-width: 600px; height: auto; display: block; border: 0;"
        />
      </td>
    </tr>`
    : '';

  const cta = settings.ctaEnabled && settings.ctaLabel && settings.ctaUrl
    ? `
    <tr>
      <td align="center" style="padding: 8px 30px 30px;">
        <table border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" bgcolor="${settings.ctaBgColor}" style="border-radius: 6px;">
              <a
                href="${settings.ctaUrl}"
                target="_blank"
                style="display: inline-block; padding: 14px 36px; font-size: 16px; color: #ffffff; text-decoration: none; font-weight: bold; letter-spacing: 0.5px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;"
              >${escapeHtml(settings.ctaLabel)}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    : '';

  const footer = settings.footerEnabled
    ? `
    <tr>
      <td bgcolor="#F8FAFC" style="padding: 24px 30px; text-align: center; border-top: 1px solid #E2E8F0;">
        <p style="margin: 0; color: #94A3B8; font-size: 12px; line-height: 1.6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          ${settings.footerText || ''}
        </p>
      </td>
    </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
    style="max-width: 600px; background-color: #ffffff; margin: 20px auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.06);">
    ${header}
    ${banner}
    <tr>
      <td style="padding: 36px 30px 24px; color: #1e293b; font-size: 15px; line-height: 1.7;">
        ${bodyContent}
      </td>
    </tr>
    ${cta}
    ${footer}
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
