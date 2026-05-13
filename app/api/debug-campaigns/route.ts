import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("id");

    // 1. Fetch system baseline counts
    const [orgs, totalContacts, lists, campaignSends] = await Promise.all([
      prisma.organization.count(),
      prisma.contact.count(),
      prisma.contactList.count(),
      prisma.campaignSend.count(),
    ]);

    let diagnostic: any = {
      summary: {
        totalOrganizations: orgs,
        totalContacts: totalContacts,
        totalLists: lists,
        totalCampaignSends: campaignSends,
      }
    };

    // 2. If no campaign specified, list the most recent campaigns and their IDs
    if (!campaignId) {
      const recentCampaigns = await prisma.campaign.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          org_id: true,
          recipients_config: true,
          created_at: true
        }
      });
      diagnostic.recentCampaigns = recentCampaigns;
      diagnostic.tip = "To run a deep analysis, call /api/debug-campaigns?id=CAMPAIGN_ID";
      return NextResponse.json(diagnostic);
    }

    // 3. Deep Analysis for specific campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      return NextResponse.json({ error: `Campaign ${campaignId} not found` }, { status: 404 });
    }

    // Build the exact query conditions dispatcher uses
    let selectedLists: string[] = [];
    let excludedLists: string[] = [];
    try {
      if (campaign.recipients_config) {
        const parsed = JSON.parse(campaign.recipients_config);
        selectedLists = parsed.selectedLists || [];
        excludedLists = parsed.excludedLists || [];
      }
    } catch (e) {}

    const queryConditions: any = {
      org_id: campaign.org_id,
      status: "active",
    };

    if (selectedLists.length > 0) {
      queryConditions.lists = {
        some: { list_id: { in: selectedLists } }
      };
    }

    if (excludedLists.length > 0) {
      queryConditions.NOT = {
        lists: { some: { list_id: { in: excludedLists } } }
      };
    }

    // Execute the dry-run queries
    const [matchingContacts, orgActiveContacts, actualSends] = await Promise.all([
      prisma.contact.findMany({ where: queryConditions, select: { id: true, email: true } }),
      prisma.contact.count({ where: { org_id: campaign.org_id, status: 'active' } }),
      prisma.campaignSend.count({ where: { campaign_id: campaignId } }),
    ]);

    diagnostic.analysis = {
      campaignName: campaign.name,
      campaignStatus: campaign.status,
      orgId: campaign.org_id,
      recipientsConfigRaw: campaign.recipients_config,
      parsedSelectedLists: selectedLists,
      parsedExcludedLists: excludedLists,
      diagnostics: {
        orgActiveContactsCount: orgActiveContacts,
        matchingContactsCount: matchingContacts.length,
        actualSendsRecordCount: actualSends,
      },
      queryConditionsUsed: queryConditions,
      sampleMatchedRecipients: matchingContacts.slice(0, 5),
    };

    if (matchingContacts.length === 0) {
      diagnostic.analysis.rootCause = "Targeting returned 0 contacts. Either selected lists are empty, or contacts don't belong to selected lists, or contacts status is not 'active'.";
    }

    return NextResponse.json(diagnostic);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
