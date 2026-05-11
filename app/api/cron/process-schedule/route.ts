import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushToCampaignQueue } from "@/lib/sqs";

/**
 * CRON WORKER: Scans for scheduled campaigns that are ready to send.
 * Triggered via Vercel Cron or external monitoring agents.
 */
export async function GET(req: Request) {
  try {
    // 1. Security Guard: Protect against raw public browser execution
    const authHeader = req.headers.get("Authorization");

    // In Vercel, CRON_SECRET is injected automatically by Vercel Cron
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Find campaigns stuck in "scheduled" whose time has arrived!
    const now = new Date();
    const pendingCampaigns = await prisma.campaign.findMany({
      where: {
        status: "scheduled",
        scheduled_at: {
          lte: now,
        },
      },
    });

    if (pendingCampaigns.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No campaigns scheduled for current window.",
      });
    }

    let activatedCount = 0;

    // 3. Convert them to "sending" and push to execution infrastructure
    for (const camp of pendingCampaigns) {
      try {
        // Atomically lock campaign so dual-invocations don't double-send
        await prisma.campaign.update({
          where: { id: camp.id },
          data: { status: "sending" },
        });

        // Push dispatcher message to AWS SQS queue
        await pushToCampaignQueue(camp.id);

        activatedCount++;
      } catch (err: any) {
        console.error(
          `Cron process failed to launch campaign ${camp.id}:`,
          err.message,
        );
      }
    }

    return NextResponse.json({
      success: true,
      found: pendingCampaigns.length,
      enqueued: activatedCount,
    });
  } catch (error: any) {
    console.error("CRON /process-schedule internal crash:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
