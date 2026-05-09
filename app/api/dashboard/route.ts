import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, format } from "date-fns";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId") || req.headers.get("x-org-id");

    let targetOrgId: string | undefined = orgId || undefined;
    if (!targetOrgId) {
      const org = await prisma.organization.findFirst();
      targetOrgId = org?.id || undefined;
    }

    // 1. Get Core aggregates filtered by organization
    const totalAudience = await prisma.contact.count({
      where: { 
        status: "active",
        org_id: targetOrgId,
      },
    });

    const totalDispatched = await prisma.campaignSend.count({
      where: {
        campaign: {
          org_id: targetOrgId,
        },
      },
    });

    const openCount = await prisma.emailEvent.count({
      where: { 
        event_type: "opened",
        campaign: {
          org_id: targetOrgId,
        },
      },
    });

    const clickCount = await prisma.emailEvent.count({
      where: { 
        event_type: "clicked",
        campaign: {
          org_id: targetOrgId,
        },
      },
    });

    const bounceCount = await prisma.campaignSend.count({
      where: { 
        status: "bounced",
        campaign: {
          org_id: targetOrgId,
        },
      },
    });

    const deliveredCount = await prisma.campaignSend.count({
      where: { 
        status: "delivered",
        campaign: {
          org_id: targetOrgId,
        },
      },
    });

    // 2. Compute Rates
    const openRate = totalDispatched > 0 ? (openCount / totalDispatched) * 100 : 0;
    const clickRate = totalDispatched > 0 ? (clickCount / totalDispatched) * 100 : 0;
    const bounceRate = totalDispatched > 0 ? (bounceCount / totalDispatched) * 100 : 0;
    const deliverability = totalDispatched > 0 ? (deliveredCount / totalDispatched) * 100 : 100;

    // 3. Get Recent Live Activity (Last 5 events)
    const recentEvents = await prisma.emailEvent.findMany({
      where: {
        campaign: {
          org_id: targetOrgId,
        },
      },
      take: 5,
      orderBy: { occurred_at: "desc" },
      include: {
        contact: true,
        campaign: true,
      },
    });

    const liveActivities = recentEvents.map((evt) => ({
      id: evt.id,
      type: evt.event_type,
      contact: evt.contact?.email || "unknown@domain.com",
      campaign: evt.campaign?.name || "System Dispatch",
      time: formatDistance(evt.occurred_at),
      country: "IN",
    }));

    // 4. Get Top Campaigns
    const latestCampaigns = await prisma.campaign.findMany({
      where: { 
        status: "sent",
        org_id: targetOrgId,
      },
      take: 3,
      orderBy: { created_at: "desc" },
      include: {
        sends: true,
        email_events: true,
      },
    });

    const topCampaigns = latestCampaigns.map((camp) => {
      const sendsCount = camp.sends.length;
      const opensCount = camp.email_events.filter((e) => e.event_type === "opened").length;
      const clicksCount = camp.email_events.filter((e) => e.event_type === "clicked").length;

      return {
        id: camp.id,
        name: camp.name,
        recipients: sendsCount,
        openRate: sendsCount > 0 ? `${((opensCount / sendsCount) * 100).toFixed(1)}%` : "0.0%",
        clickRate: sendsCount > 0 ? `${((clicksCount / sendsCount) * 100).toFixed(1)}%` : "0.0%",
        status: "Active",
        risk: bounceRate > 2 ? "Moderate" : "Low",
      };
    });

    // 5. Build Sending Performance Chart (Last 7 Days)
    const performanceData = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayDispatched = await prisma.campaignSend.count({
        where: {
          sent_at: {
            gte: dayStart,
            lt: dayEnd,
          },
          campaign: {
            org_id: targetOrgId,
          },
        },
      });

      const dayOpens = await prisma.emailEvent.count({
        where: {
          event_type: "opened",
          occurred_at: {
            gte: dayStart,
            lt: dayEnd,
          },
          campaign: {
            org_id: targetOrgId,
          },
        },
      });

      const dayClicks = await prisma.emailEvent.count({
        where: {
          event_type: "clicked",
          occurred_at: {
            gte: dayStart,
            lt: dayEnd,
          },
          campaign: {
            org_id: targetOrgId,
          },
        },
      });

      performanceData.push({
        name: format(day, "eee"),
        Sent: dayDispatched,
        Opens: dayOpens,
        Clicks: dayClicks,
      });
    }

    return NextResponse.json({
      stats: {
        totalAudience: totalAudience.toLocaleString(),
        totalDispatched: totalDispatched.toLocaleString(),
        openRate: totalDispatched > 0 ? `${openRate.toFixed(1)}%` : "—",
        clickRate: totalDispatched > 0 ? `${clickRate.toFixed(1)}%` : "—",
        deliverability: totalDispatched > 0 ? `${deliverability.toFixed(2)}%` : "—",
        bounceRate: totalDispatched > 0 ? `${bounceRate.toFixed(1)}%` : "—",
      },
      liveActivities,
      topCampaigns,
      performanceData,
    });
  } catch (error: any) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function formatDistance(date: Date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}
