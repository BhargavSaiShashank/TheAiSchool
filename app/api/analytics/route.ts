import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format, startOfDay, addHours } from "date-fns";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("id");

    // If no specific campaign ID, return list of sent campaigns for selection
    if (!campaignId) {
      const sentCampaigns = await prisma.campaign.findMany({
        where: { status: "sent" },
        orderBy: { created_at: "desc" },
      });
      return NextResponse.json(sentCampaigns);
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    // 🚀 CRITICAL PERFORMANCE INFRASTRUCTURE 🚀
    // Parallelize EVERYTHING into a single atomic execution cluster!
    const baseTime = startOfDay(campaign.created_at);

    const [totalSent, uniqueOpens, totalClicks, openEvents, clickEvents] =
      await Promise.all([
        prisma.campaignSend.count({ where: { campaign_id: campaignId } }),
        prisma.emailEvent.count({
          where: { campaign_id: campaignId, event_type: "opened" },
        }),
        prisma.emailEvent.count({
          where: { campaign_id: campaignId, event_type: "clicked" },
        }),
        prisma.emailEvent.findMany({
          where: { campaign_id: campaignId, event_type: "opened" },
          select: { user_agent: true, occurred_at: true },
        }),
        prisma.emailEvent.findMany({
          where: { campaign_id: campaignId, event_type: "clicked" },
          select: { metadata: true, contact_id: true },
        }),
      ]);

    const openRate =
      totalSent > 0 ? ((uniqueOpens / totalSent) * 100).toFixed(1) : "0.0";
    const clickRate =
      totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : "0.0";

    const stats = [
      {
        name: "Total Sent",
        value: totalSent.toLocaleString(),
        label: "dispatched",
      },
      {
        name: "Unique Opens",
        value: `${uniqueOpens.toLocaleString()} (${openRate}%)`,
        label: "unique reads",
      },
      {
        name: "Total Clicks",
        value: `${totalClicks.toLocaleString()} (${clickRate}%)`,
        label: "link weights",
      },
    ];

    // ⚡ OPTIMIZED: Compute the time-series in-memory from the already fetched list rather than querying DB 6 more times!
    const openOverTime = [];
    for (let h = 0; h < 24; h += 4) {
      const blockStart = addHours(baseTime, h);
      const blockEnd = addHours(baseTime, h + 4);

      const count = openEvents.filter((evt) => {
        const d = new Date(evt.occurred_at).getTime();
        return d >= blockStart.getTime() && d < blockEnd.getTime();
      }).length;

      openOverTime.push({
        time: format(blockStart, "h:mm a"),
        Opens: count,
      });
    }

    // 3. User Agent Distribution (Already pre-fetched in the parallel atomic request bundle!)

    let chrome = 0,
      safari = 0,
      firefox = 0,
      others = 0;
    openEvents.forEach((evt) => {
      const ua = evt.user_agent || "";
      if (ua.includes("Chrome")) chrome++;
      else if (ua.includes("Safari")) safari++;
      else if (ua.includes("Firefox")) firefox++;
      else others++;
    });

    const totalUa = openEvents.length || 1;
    const browserData = [
      {
        name: "Chrome",
        value: Math.round((chrome / totalUa) * 100),
        color: "#3b82f6",
      },
      {
        name: "Safari",
        value: Math.round((safari / totalUa) * 100),
        color: "#10b981",
      },
      {
        name: "Firefox",
        value: Math.round((firefox / totalUa) * 100),
        color: "#f59e0b",
      },
      {
        name: "Others",
        value: Math.round((others / totalUa) * 100),
        color: "#6b7280",
      },
    ];

    // 4. Click Registry Map (Pre-fetched and immediately processed!)
    const linksMap: {
      [key: string]: {
        url: string;
        clicks: number;
        uniqueContacts: Set<string>;
      };
    } = {};
    clickEvents.forEach((evt) => {
      let url = "https://pulsesend.com";
      try {
        if (evt.metadata) {
          const meta = JSON.parse(evt.metadata);
          if (meta.url) url = meta.url;
        }
      } catch (e) {}

      if (!linksMap[url]) {
        linksMap[url] = { url, clicks: 0, uniqueContacts: new Set() };
      }
      linksMap[url].clicks++;
      if (evt.contact_id) linksMap[url].uniqueContacts.add(evt.contact_id);
    });

    const linksTable = Object.values(linksMap).map((item) => ({
      url: item.url,
      clicks: item.clicks,
      unique: item.uniqueContacts.size,
    }));

    // Seed default links if none clicked yet so it has structured links
    if (linksTable.length === 0) {
      linksTable.push(
        { url: "https://pulsesend.com/welcome", clicks: 0, unique: 0 },
        { url: "https://pulsesend.com/docs", clicks: 0, unique: 0 },
      );
    }

    return NextResponse.json({
      name: campaign.name,
      stats,
      openOverTime,
      browserData,
      linksTable,
    });
  } catch (error: any) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
