import { NextResponse } from "next/server";
import { formatDistanceToNow } from "date-fns";
import { prisma } from "@/lib/prisma";
import { pushToCampaignQueue } from "@/lib/sqs";
import { getSecureOrgId, enforceRole } from "@/lib/auth-utils";
import { after } from "next/server";
import { processCampaignDispatch } from "@/lib/dispatcher";

export async function GET(req: any) {
  try {
    const orgId = await getSecureOrgId(req);

    const campaigns = await prisma.campaign.findMany({
      where: {
        org_id: orgId,
      },
      include: {
        sends: true,
        email_events: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const formattedCampaigns = campaigns.map((camp) => {
      const sentCount = camp.sends ? camp.sends.length : 0;
      const openCount = camp.email_events
        ? camp.email_events.filter((e) => e?.event_type === "opened").length
        : 0;
      const clickCount = camp.email_events
        ? camp.email_events.filter((e) => e?.event_type === "clicked").length
        : 0;

      const openRateStr =
        sentCount > 0 ? `${((openCount / sentCount) * 100).toFixed(1)}%` : "—";
      const clickRateStr =
        sentCount > 0 ? `${((clickCount / sentCount) * 100).toFixed(1)}%` : "—";

      let sendDateStr = "—";
      if (camp.status === "sent" && camp.created_at) {
        try {
          sendDateStr = formatDistanceToNow(new Date(camp.created_at), {
            addSuffix: true,
          });
        } catch (err) {
          sendDateStr = "Recent";
        }
      }

      const statusStr = camp.status
        ? camp.status.charAt(0).toUpperCase() + camp.status.slice(1)
        : "Draft";

      return {
        id: camp.id,
        name: camp.name || "Untitled Campaign",
        subject: camp.subject || "No Subject",
        status: statusStr,
        sendDate: sendDateStr,
        recipients: sentCount,
        openRate: openRateStr,
        clickRate: clickRateStr,
      };
    });

    return NextResponse.json(formattedCampaigns);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/campaigns error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: any) {
  try {
    // --- 🛡️ RBAC ENFORCEMENT: ONLY ADMINS & MANAGERS CAN CREATE CAMPAIGNS ---
    await enforceRole(req, ["SUPER_ADMIN", "CAMPAIGN_MANAGER"]);

    const orgId = await getSecureOrgId(req);
    const body = await req.json();
    const {
      name,
      subject,
      previewText,
      fromName,
      fromEmail,
      status,
      templateId,
      recipientsConfig,
    } = body;

    if (!name || !subject) {
      return NextResponse.json(
        { error: "Campaign name and subject are required" },
        { status: 400 },
      );
    }

    // Safely verify if templateId exists in the database before assigning it to prevent foreign key constraint crashes (e.g. on mock starter IDs like t1, t2)
    let validTemplateId: string | null = null;
    if (templateId && typeof templateId === "string") {
      try {
        const templateExists = await prisma.template.findUnique({
          where: { id: templateId },
        });
        if (templateExists) {
          validTemplateId = templateId;
        }
      } catch (err) {
        // Safe fallback if not a valid UUID format or template does not exist
        validTemplateId = null;
      }
    }

    const newCamp = await prisma.campaign.create({
      data: {
        name,
        subject,
        preview_text: previewText || "",
        from_name: fromName || "PulseSend Team",
        from_email: fromEmail || "hello@pulsesend.com",
        status: status || "draft",
        template_id: validTemplateId,
        org_id: orgId,
        recipients_config: recipientsConfig,
      },
    });

    let sentCount = 0;
    let openRateStr = "—";
    let clickRateStr = "—";

    // If campaign is sent, auto-initiate relational dispatch tasks via AWS SQS
    if (status === "sent") {
      try {
        await pushToCampaignQueue(newCamp.id);
      } catch (sqsErr) {
        console.error(
          "Failed to push campaign dispatch job to AWS SQS:",
          sqsErr,
        );
      }
    }

    return NextResponse.json({
      id: newCamp.id,
      name: newCamp.name,
      subject: newCamp.subject,
      status: newCamp.status.charAt(0).toUpperCase() + newCamp.status.slice(1),
      sendDate:
        status === "sent"
          ? formatDistanceToNow(newCamp.created_at, { addSuffix: true })
          : "—",
      recipients: sentCount,
      openRate: openRateStr,
      clickRate: clickRateStr,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("POST /api/campaigns error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: any) {
  try {
    await enforceRole(req, ["SUPER_ADMIN", "CAMPAIGN_MANAGER"]);
    const orgId = await getSecureOrgId(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const {
      name,
      subject,
      previewText,
      fromName,
      fromEmail,
      status,
      templateId,
      recipientsConfig,
    } = body;

    let validTemplateId: string | null = null;
    if (templateId && typeof templateId === "string") {
      try {
        const templateExists = await prisma.template.findUnique({
          where: { id: templateId },
        });
        if (templateExists) {
          validTemplateId = templateId;
        }
      } catch (err) {
        validTemplateId = null;
      }
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        name,
        subject,
        preview_text: previewText || "",
        from_name: fromName || "PulseSend Team",
        from_email: fromEmail || "hello@pulsesend.com",
        status: status || "draft",
        template_id: validTemplateId,
        recipients_config: recipientsConfig,
      },
    });

    let sentCount = 0;
    let openRateStr = "—";
    let clickRateStr = "—";

    if (status === "sent") {
      try {
        await pushToCampaignQueue(updated.id);
      } catch (sqsErr) {
        console.error(
          "Failed to push campaign dispatch job to AWS SQS:",
          sqsErr,
        );
      }
    }

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      subject: updated.subject,
      status: updated.status.charAt(0).toUpperCase() + updated.status.slice(1),
      sendDate: updated.status === "sent" ? "Recent" : "—",
      recipients: sentCount,
      openRate: openRateStr,
      clickRate: clickRateStr,
    });
  } catch (error: any) {
    console.error("PUT /api/campaigns error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: any) {
  try {
    await enforceRole(req, ["SUPER_ADMIN", "CAMPAIGN_MANAGER"]);
    const orgId = await getSecureOrgId(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Identifier required for deletion" }, { status: 400 });
    }

    // Execute atomic deletion anchored to high-integrity org context validation
    const outcome = await prisma.campaign.deleteMany({
      where: {
        id: id,
        org_id: orgId
      }
    });

    if (outcome.count === 0) {
      return NextResponse.json({ error: "Resource not targeted or not owned" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("DELETE /api/campaigns error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
