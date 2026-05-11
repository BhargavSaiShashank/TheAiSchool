import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, format } from "date-fns";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const campaignId = params.id;

  try {
    // 1. Fetch campaign details to confirm existence and ownership
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    // 2. Perform High-Performance Parallel Aggregation for this campaign
    const [
      totalSends,
      deliveries,
      opens,
      clicks,
      bounces,
      complaints,
      allEvents,
    ] = await Promise.all([
      prisma.campaignSend.count({ where: { campaign_id: campaignId } }),
      prisma.campaignSend.count({
        where: { campaign_id: campaignId, status: "delivered" },
      }),
      prisma.emailEvent.count({
        where: { campaign_id: campaignId, event_type: "opened" },
      }),
      prisma.emailEvent.count({
        where: { campaign_id: campaignId, event_type: "clicked" },
      }),
      prisma.campaignSend.count({
        where: { campaign_id: campaignId, status: "bounced" },
      }),
      prisma.emailEvent.count({
        where: { campaign_id: campaignId, event_type: "complained" },
      }),
      prisma.emailEvent.findMany({
        where: { campaign_id: campaignId },
        orderBy: { occurred_at: "asc" },
        include: { contact: { select: { email: true } } },
      }),
    ]);

    // 3. Construct the 48-hour forensic timeline chart
    const hourlyMap = new Map();
    allEvents.forEach((ev) => {
      const date = new Date(ev.occurred_at);
      const hourKey = format(date, "MMM dd, HH:00");
      if (!hourlyMap.has(hourKey)) {
        hourlyMap.set(hourKey, { time: hourKey, opens: 0, clicks: 0 });
      }
      if (ev.event_type === "opened") hourlyMap.get(hourKey).opens++;
      if (ev.event_type === "clicked") hourlyMap.get(hourKey).clicks++;
    });

    const timelineData = Array.from(hourlyMap.values()).slice(-48);

    // 4. Detect device split from user-agent signals (Simple parsing)
    let desktop = 0,
      mobile = 0;
    allEvents.forEach((ev) => {
      if (ev.user_agent) {
        const ua = ev.user_agent.toLowerCase();
        if (
          ua.includes("mobile") ||
          ua.includes("android") ||
          ua.includes("iphone")
        ) {
          mobile++;
        } else {
          desktop++;
        }
      }
    });

    // 5. Collate individual Link Click distribution from metadata blob
    const linkMap: Record<string, number> = {};
    allEvents
      .filter((e) => e.event_type === "clicked" && e.metadata)
      .forEach((ev) => {
        try {
          const meta = JSON.parse(ev.metadata || "{}");
          const url = meta.url || "General Redirect";
          linkMap[url] = (linkMap[url] || 0) + 1;
        } catch (e) {}
      });
    const linksClicked = Object.entries(linkMap).map(([url, clicks]) => ({
      url,
      clicks,
    }));

    // Combine finalized dataset
    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        status: campaign.status,
        sent_at: campaign.created_at, // Simplified timestamp
      },
      metrics: {
        sent: totalSends,
        delivered: deliveries,
        opens,
        clicks,
        bounces,
        complaints,
        openRate: totalSends > 0 ? ((opens / totalSends) * 100).toFixed(1) : 0,
        clickRate:
          totalSends > 0 ? ((clicks / totalSends) * 100).toFixed(1) : 0,
      },
      charts: {
        timeline: timelineData,
        devices: [
          { name: "Desktop", value: desktop || 1 }, // Fallbacks for visuals
          { name: "Mobile", value: mobile || 0 },
        ],
        links: linksClicked.sort((a, b) => b.clicks - a.clicks),
      },
      recentActivity: allEvents.slice(-10).reverse(),
    });
  } catch (error: any) {
    console.error(`[ReportAPI] Forensic error:`, error);
    return NextResponse.json(
      { error: "Internal audit failure" },
      { status: 500 },
    );
  }
}
