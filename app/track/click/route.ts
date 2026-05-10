import { NextResponse } from "next/server";
import { after } from "next/server"; 
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

        // 🔥 OPTIMIZED: Perform DB log AFTER the redirect has been processed for user speed!
        after(async () => {
          try {
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
          } catch (bgErr) {
            console.error("Background click event log failed:", bgErr);
          }
        });
      }
    }

    // Perform high-speed HTTP 302 redirect IMMEDIATELY without waiting for DB insert!
    return NextResponse.redirect(new URL(originalUrl), 302);
  } catch (err: any) {
    console.error("Tracking click error:", err);
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
