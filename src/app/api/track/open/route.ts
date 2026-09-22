import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 1x1 transparent GIF buffer (43 bytes)
const TRANSPARENT_GIF_BUFFER = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('t');

  if (token) {
    try {
      const recipient = await prisma.broadcastRecipient.findUnique({
        where: { trackingToken: token },
        select: {
          id: true,
          campaignId: true,
          openedAt: true,
          openCount: true,
        }
      });

      if (recipient) {
        const now = new Date();
        const isFirstOpen = !recipient.openedAt;

        await prisma.$transaction([
          prisma.broadcastRecipient.update({
            where: { id: recipient.id },
            data: {
              openedAt: isFirstOpen ? now : undefined,
              lastOpenedAt: now,
              openCount: { increment: 1 }
            }
          }),
          prisma.broadcastCampaign.update({
            where: { id: recipient.campaignId },
            data: {
              openCount: { increment: 1 },
              ...(isFirstOpen ? { uniqueOpenCount: { increment: 1 } } : {})
            }
          })
        ]);
      }
    } catch (err) {
      console.error('[Track Open] Error recording open:', err);
    }
  }

  return new NextResponse(TRANSPARENT_GIF_BUFFER, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(TRANSPARENT_GIF_BUFFER.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });
}
