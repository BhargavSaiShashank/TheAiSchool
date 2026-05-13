import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processCampaignDispatch } from "@/lib/dispatcher";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("id");

    if (!campaignId) {
      return NextResponse.json({ error: "Query parameter ?id=CAMPAIGN_ID is required." }, { status: 400 });
    }

    // 1. Fetch campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      return NextResponse.json({ error: `Campaign ${campaignId} not found` }, { status: 404 });
    }

    // 2. Prepare Dispatch Config from environment
    const config = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      region: process.env.AWS_REGION || "eu-north-1",
      senderEmail: process.env.AWS_SENDER_EMAIL || "dommetishashank@gmail.com",
    };

    console.log(`[FORCE DISPATCH] Manually executing dispatcher for campaign: ${campaignId}`);
    
    // Temporarily set state back to 'sending' so dispatcher runs successfully
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'sending' }
    });

    // 3. Fire dispatcher synchronously for debug visibility
    await processCampaignDispatch(campaignId, config);

    // 4. Fetch resulting send counts
    const sendCount = await prisma.campaignSend.count({
      where: { campaign_id: campaignId }
    });

    return NextResponse.json({
      success: true,
      message: "Dispatcher manual invocation completed successfully.",
      campaignName: campaign.name,
      finalStatus: "sent",
      campaignSendsGenerated: sendCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
