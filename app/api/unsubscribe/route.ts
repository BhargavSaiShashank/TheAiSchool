import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json(
        { error: "Missing campaign unique identifier" },
        { status: 400 },
      );
    }

    const [contactId, campaignId] = uid.split("_");

    if (!contactId) {
      return NextResponse.json(
        { error: "Invalid unique identifier structure" },
        { status: 400 },
      );
    }

    // Fetch the active contact details
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      include: { organization: true },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Update contact status to "unsubscribed" in database
    await prisma.contact.update({
      where: { id: contact.id },
      data: { status: "unsubscribed" },
    });

    // Log the "unsubscribed" email event record
    if (campaignId) {
      await prisma.emailEvent.create({
        data: {
          contact_id: contact.id,
          campaign_id: campaignId,
          event_type: "unsubscribed",
          user_agent: req.headers.get("user-agent") || undefined,
          ip: req.headers.get("x-forwarded-for") || undefined,
        },
      });
    }

    return NextResponse.json({
      email: contact.email,
      orgName: contact.organization?.name || "PulseSend Inc.",
    });
  } catch (error: any) {
    console.error("POST /api/unsubscribe error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json(
        { error: "Missing unique identifier" },
        { status: 400 },
      );
    }

    const [contactId] = uid.split("_");

    // Fetch and re-subscribe contact back to "active" status
    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: { status: "active" },
    });

    return NextResponse.json({ success: true, email: contact.email });
  } catch (error: any) {
    console.error("PUT /api/unsubscribe error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
