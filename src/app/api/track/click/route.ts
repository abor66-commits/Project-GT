import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('t');
  const targetUrl = searchParams.get('url');

  const fallbackUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
  let destination = fallbackUrl;

  if (targetUrl) {
    try {
      destination = decodeURIComponent(targetUrl);
    } catch {
      destination = targetUrl;
    }
  }

  // Ensure destination has a protocol or is safe
  if (!destination.startsWith('http://') && !destination.startsWith('https://')) {
    destination = fallbackUrl;
  }

  if (token) {
    try {
      const recipient = await prisma.broadcastRecipient.findUnique({
        where: { trackingToken: token },
        select: {
          id: true,
          campaignId: true,
          clickedAt: true,
          clickCount: true,
        }
      });

      if (recipient) {
        const now = new Date();
        const isFirstClick = !recipient.clickedAt;

        await prisma.$transaction([
          prisma.broadcastRecipient.update({
            where: { id: recipient.id },
            data: {
              clickedAt: isFirstClick ? now : undefined,
              lastClickedAt: now,
              clickCount: { increment: 1 },
              lastClickedUrl: destination,
            }
          }),
          prisma.broadcastCampaign.update({
            where: { id: recipient.campaignId },
            data: {
              clickCount: { increment: 1 },
              ...(isFirstClick ? { uniqueClickCount: { increment: 1 } } : {})
            }
          })
        ]);
      }
    } catch (err) {
      console.error('[Track Click] Error recording click:', err);
    }
  }

  return NextResponse.redirect(destination, {
    status: 302,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  });
}
