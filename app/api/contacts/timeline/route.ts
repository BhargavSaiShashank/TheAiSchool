import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");

    if (!contactId) {
      return NextResponse.json(
        { error: "Missing contact identifier" },
        { status: 400 },
      );
    }

    // Query all email events for this contact, ordered chronologically
    const events = await prisma.emailEvent.findMany({
      where: { contact_id: contactId },
      include: {
        campaign: {
          select: {
            name: true,
            subject: true,
          },
        },
      },
      orderBy: { occurred_at: "desc" },
    });

    return NextResponse.json(events);
  } catch (error: any) {
    console.error("GET /api/contacts/timeline error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
