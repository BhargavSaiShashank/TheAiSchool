import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid") || "";
    const originalUrl = searchParams.get("url") || "";

    if (!originalUrl) {
      return NextResponse.json({ error: "Missing target redirect URL" }, { status: 400 });
    }

    if (uid) {
      const [contactId, campaignId] = uid.split("_");

      if (contactId && campaignId) {
        const userAgent = req.headers.get("user-agent") || undefined;
        const ip = req.headers.get("x-forwarded-for") || undefined;

        // Log the "clicked" tracking event inside database EmailEvent table
        await prisma.emailEvent.create({
          data: {
            contact_id: contactId,
            campaign_id: campaignId,
            event_type: "clicked",
            user_agent: userAgent,
            ip: ip,
            metadata: JSON.stringify({ url: originalUrl }),
          },
        });
      }
    }

    // Perform high-speed HTTP 302 redirect to original destination
    return NextResponse.redirect(new URL(originalUrl), 302);
  } catch (err: any) {
    console.error("Tracking click error:", err);
    // Even if tracking fails, safely fallback redirect the recipient to the intended link
    try {
      const { searchParams } = new URL(req.url);
      const fallbackUrl = searchParams.get("url");
      if (fallbackUrl) {
        return NextResponse.redirect(new URL(fallbackUrl), 302);
      }
    } catch {}
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
