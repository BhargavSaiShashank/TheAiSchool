import { NextResponse } from "next/server";
import { after } from "next/server"; // Next.js runtime background primitive
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid") || "";

    if (uid) {
      const [contactId, campaignId] = uid.split("_");

      if (contactId && campaignId) {
        const userAgent = req.headers.get("user-agent") || undefined;
        const ip = req.headers.get("x-forwarded-for") || undefined;

        // 🔥 OPTIMIZED: Schedule database work to run AFTER the client receives their response!
        after(async () => {
          try {
            await prisma.emailEvent.create({
              data: {
                contact_id: contactId,
                campaign_id: campaignId,
                event_type: "opened",
                user_agent: userAgent,
                ip: ip,
              },
            });
          } catch (bgErr) {
            console.error("Background emailEvent create error:", bgErr);
          }
        });
      }
    }

    // Return a 1x1 transparent GIF tracking pixel base64 buffer IMMEDIATELY
    const trackingPixelBase64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    const pixelBuffer = Buffer.from(trackingPixelBase64, "base64");

    return new NextResponse(pixelBuffer, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (err: any) {
    console.error("Tracking open error:", err);
    return new NextResponse(null, { status: 200 });
  }
}
