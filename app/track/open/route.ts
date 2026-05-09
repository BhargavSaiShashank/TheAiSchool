import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid") || "";

    if (uid) {
      // Parse contactId and campaignId from the uid parameter (e.g. contactId_campaignId)
      const [contactId, campaignId] = uid.split("_");

      if (contactId && campaignId) {
        const userAgent = req.headers.get("user-agent") || undefined;
        const ip = req.headers.get("x-forwarded-for") || undefined;

        // Log the "opened" event inside the database EmailEvent table
        await prisma.emailEvent.create({
          data: {
            contact_id: contactId,
            campaign_id: campaignId,
            event_type: "opened",
            user_agent: userAgent,
            ip: ip,
          },
        });
      }
    }

    // Return a 1x1 transparent GIF tracking pixel base64 buffer
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
    // Silently fall back to standard response to preserve email rendering
    return new NextResponse(null, { status: 200 });
  }
}
