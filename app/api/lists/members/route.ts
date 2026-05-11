import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceRole } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  try {
    await enforceRole(req, ["SUPER_ADMIN", "CAMPAIGN_MANAGER"]);
    const body = await req.json();
    const { listId, contactIds } = body;

    if (!listId || !contactIds || !Array.isArray(contactIds)) {
      return NextResponse.json(
        { error: "listId and contactIds array are required" },
        { status: 400 },
      );
    }

    const data = contactIds.map((cid: string) => ({
      contact_id: cid,
      list_id: listId,
    }));

    // Cross-DB compatible batch inserts (supporting SQLite/PostgreSQL)
    for (const item of data) {
      try {
        await prisma.contactListMember.upsert({
          where: {
            contact_id_list_id: {
              contact_id: item.contact_id,
              list_id: item.list_id,
            },
          },
          update: {}, // Skip duplicates by doing nothing on update
          create: item,
        });
      } catch (err) {
        console.error("Duplicate contact list member insertion skipped:", err);
      }
    }

    return NextResponse.json({ success: true, count: contactIds.length });
  } catch (error: any) {
    console.error("POST /api/lists/members error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
