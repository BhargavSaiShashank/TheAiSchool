import { NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Auto-confirm AWS SNS Subscription requests
    if (body.Type === "SubscriptionConfirmation" && body.SubscribeURL) {
      console.log("Received AWS SNS Webhook Subscription Confirmation Request. URL:", body.SubscribeURL);
      await fetch(body.SubscribeURL); 
      return NextResponse.json({ success: true, message: "Subscription confirmed" });
    }

    // 2. Handle SES Notifications
    if (body.Type === "Notification" && body.Message) {
      const message = JSON.parse(body.Message);

      if (message.notificationType) {
        const { notificationType, bounce, complaint, mail } = message;
        const recipients = mail?.destination || [];

        // 🔥 OPTIMIZED: Move heavy sequential db loop out of main thread entirely.
        // Instant response prevents SNS retries and serverless timeout!
        after(async () => {
          try {
            for (const email of recipients) {
              const contact = await prisma.contact.findUnique({
                where: { email },
              });

              if (contact) {
                if (notificationType === "Bounce") {
                  const bounceType = bounce?.bounceType || "Hard";
                  
                  if (bounceType === "Permanent" || bounceType === "Hard") {
                    await prisma.contact.update({
                      where: { id: contact.id },
                      data: { status: "bounced" },
                    });

                    await prisma.suppressionList.upsert({
                      where: { email },
                      update: { reason: "bounced", suppressed_at: new Date() },
                      create: {
                        org_id: contact.org_id,
                        email,
                        reason: "bounced",
                      },
                    });
                  }
                } else if (notificationType === "Complaint") {
                  await prisma.contact.update({
                            where: { id: contact.id },
                    data: { status: "complained" },
                  });

                  await prisma.suppressionList.upsert({
                    where: { email },
                    update: { reason: "complained", suppressed_at: new Date() },
                    create: {
                      org_id: contact.org_id,
                      email,
                      reason: "complained",
                    },
                  });
                }
              }
            }
          } catch (bgErr) {
            console.error("Background SES Webhook processing error:", bgErr);
          }
        });
      }
    }

    // Respond immediately to AWS SNS so they don't think we failed!
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/webhooks/ses error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
