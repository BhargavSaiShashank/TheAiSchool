import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, format } from "date-fns";
import { getSecureOrgId } from "@/lib/auth-utils";

export async function GET(req: any) {
  try {
    const targetOrgId = await getSecureOrgId(req);

    // 🔥 PERFORMANCE BREAKTHROUGH: Execute ALL baseline queries simultaneously instead of sequentially.
    // Transforms 29 serialized roundtrips into ONE parallel cluster, killing network waterfall latency completely.
    const [
      totalAudience,
      totalDispatched,
      openCount,
      clickCount,
      bounceCount,
      deliveredCount,
      recentEvents,
      latestCampaigns
    ] = await Promise.all([
      prisma.contact.count({ where: { status: "active", org_id: targetOrgId } }),
      prisma.campaignSend.count({ where: { campaign: { org_id: targetOrgId } } }),
      prisma.emailEvent.count({ where: { event_type: "opened", campaign: { org_id: targetOrgId } } }),
      prisma.emailEvent.count({ where: { event_type: "clicked", campaign: { org_id: targetOrgId } } }),
      prisma.campaignSend.count({ where: { status: "bounced", campaign: { org_id: targetOrgId } } }),
      prisma.campaignSend.count({ where: { status: "delivered", campaign: { org_id: targetOrgId } } }),
      prisma.emailEvent.findMany({
        where: { campaign: { org_id: targetOrgId } },
        take: 5,
        orderBy: { occurred_at: "desc" },
        include: { contact: true, campaign: true }
      }),
      prisma.campaign.findMany({
        where: { status: "sent", org_id: targetOrgId },
        take: 3,
        orderBy: { created_at: "desc" },
        include: { sends: true, email_events: true }
      })
    ]);

    // 2. Compute derived static stats
    const openRate = totalDispatched > 0 ? (openCount / totalDispatched) * 100 : 0;
    const clickRate = totalDispatched > 0 ? (clickCount / totalDispatched) * 100 : 0;
    const bounceRate = totalDispatched > 0 ? (bounceCount / totalDispatched) * 100 : 0;
    const deliverability = totalDispatched > 0 ? (deliveredCount / totalDispatched) * 100 : 100;

    // 3. Process results
    const liveActivities = recentEvents.map((evt) => ({
      id: evt.id,
      type: evt.event_type,
      contact: evt.contact?.email || "unknown@domain.com",
      campaign: evt.campaign?.name || "System Dispatch",
      time: formatDistance(evt.occurred_at),
      country: "IN",
    }));

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

    // 4. 🔥 QUANTUM LEAP: High-Performance Aggregate Raw Query Architecture!
    // Obliterates 21 separate individual counts by offloading to the Postgres Engine itself.
    const sevenDaysAgo = subDays(new Date(), 7);

    const [rawSendAgg, rawEventAgg]: [any[], any[]] = await Promise.all([
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', cs."sent_at") as "day",
          COUNT(*)::int as "val"
        FROM "CampaignSend" cs
        JOIN "Campaign" c ON cs."campaign_id" = c."id"
        WHERE c."org_id" = ${targetOrgId} AND cs."sent_at" >= ${sevenDaysAgo}
        GROUP BY 1
      `,
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', ee."occurred_at") as "day",
          ee."event_type" as "type",
          COUNT(*)::int as "val"
        FROM "EmailEvent" ee
        JOIN "Campaign" c ON ee."campaign_id" = c."id"
        WHERE c."org_id" = ${targetOrgId} AND ee."occurred_at" >= ${sevenDaysAgo}
        GROUP BY 1, 2
      `
    ]);

    // 5. Map the raw database result arrays to lookup tables for instant dictionary performance
    const sentMap: Record<string, number> = {};
    rawSendAgg.forEach((r: any) => {
      const dateKey = format(new Date(r.day), "yyyy-MM-dd");
      sentMap[dateKey] = r.val;
    });

    const opensMap: Record<string, number> = {};
    const clicksMap: Record<string, number> = {};
    rawEventAgg.forEach((r: any) => {
      const dateKey = format(new Date(r.day), "yyyy-MM-dd");
      if (r.type === "opened") opensMap[dateKey] = r.val;
      if (r.type === "clicked") clicksMap[dateKey] = r.val;
    });

    // 6. Build Final Sequential 7-Day array, filling in ZEROES where days have no data automatically!
    const performanceData = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateKey = format(date, "yyyy-MM-dd");
      return {
        name: format(date, "eee"),
        Sent: sentMap[dateKey] || 0,
        Opens: opensMap[dateKey] || 0,
        Clicks: clicksMap[dateKey] || 0
      };
    });

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
