import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const queryOrgId = searchParams.get("orgId");
    const headerOrgId = req.headers.get("x-org-id");
    const targetOrgId = queryOrgId || headerOrgId;
    
    // 1. Find org context (either explicit or fallback)
    let org = null;
    if (targetOrgId) {
       org = await prisma.organization.findUnique({ where: { id: targetOrgId } });
    }
    
    if (!org) {
       org = await prisma.organization.findFirst();
    }

    // 🔥 ABSOLUTE FAILSAFE MODE: Auto-provision organization row if DB is empty or record missing!
    if (!org) {
       org = await prisma.organization.create({
         data: {
           id: targetOrgId || undefined,
           name: "Demonstration Workspace"
         }
       });
    }

    let campaign = await prisma.campaign.findFirst({ where: { org_id: org.id } });
    if (!campaign) {
      // Create dummy campaign for demo
      campaign = await prisma.campaign.create({
        data: {
          org_id: org.id,
          name: "Live Demonstration Campaign",
          subject: "Real-Time Performance Matrix",
          from_name: "Demo Sender",
          from_email: "demo@pulsesend.com",
          status: "sent"
        }
      });
    }

    let contact = await prisma.contact.findFirst({ where: { org_id: org.id } });
    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          org_id: org.id,
          email: "demo-listener@example.com",
          status: "active"
        }
      });
    }

    const campId = campaign.id;
    const orgId = org.id;
    const contId = contact.id;

    // Use after() to run high-fidelity background simulation loop asynchronously!
    after(async () => {
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      const emails = [
        "steve.jobs@apple.com", "bill.gates@microsoft.com", "elon.musk@tesla.com",
        "satya.nadella@msft.com", "sundar.pichai@google.com", "sam.altman@openai.com",
        "jensen.huang@nvidia.com", "jeff.bezos@amazon.com", "mark.zuck@meta.com"
      ];
      const eventTypes = ["opened", "clicked", "delivered", "sent"];

      // Run for 12 iterations, spaced 1.5 seconds apart to feel super organic!
      for (let i = 0; i < 12; i++) {
        try {
          const randomEmail = emails[Math.floor(Math.random() * emails.length)];
          // 🔥 Deterministic Round-Robin to guarantee perfect 25% distributions of all event types including 'clicked'!
          const eventType = eventTypes[i % eventTypes.length];
          
          // 1. Insert simulated Contact for raw email feed visibility
          const simContact = await prisma.contact.create({
            data: {
              org_id: orgId,
              email: `${Math.random().toString(36).substring(7)}@demo.org`,
              first_name: "Demo",
              last_name: `Node-${i}`,
              status: "active"
            }
          });

          // 2. Insert CampaignSend
          await prisma.campaignSend.create({
            data: {
              campaign_id: campId,
              contact_id: simContact.id,
              status: eventType === "bounced" ? "bounced" : "delivered",
              sent_at: new Date()
            }
          });

          // 3. Insert EmailEvent
          await prisma.emailEvent.create({
            data: {
              campaign_id: campId,
              contact_id: simContact.id,
              event_type: eventType,
              occurred_at: new Date()
            }
          });

        } catch (err) {
          console.error("Simulation tick failure:", err);
        }
        await sleep(1500);
      }
    });

    return NextResponse.json({ success: true, message: "Live dispatch simulation running in background." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
