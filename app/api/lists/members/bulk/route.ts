import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceRole } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  try {
    await enforceRole(req, ["SUPER_ADMIN", "CAMPAIGN_MANAGER"]);
    const { contactIds, listId, action } = await req.json();

    if (!contactIds || !Array.isArray(contactIds)) {
      return NextResponse.json(
        { error: "Invalid bulk selection parameters" },
        { status: 400 },
      );
    }

    if (action === "add") {
      if (!listId || listId === "none") {
        return NextResponse.json(
          { error: "Please select a valid target list" },
          { status: 400 },
        );
      }

      for (const contactId of contactIds) {
        await prisma.contactListMember.upsert({
          where: {
            contact_id_list_id: {
              contact_id: contactId,
              list_id: listId,
            },
          },
          update: {},
          create: {
            contact_id: contactId,
            list_id: listId,
          },
        });
      }
    } else if (action === "remove") {
      if (!listId || listId === "none") {
        return NextResponse.json(
          { error: "Please select a valid list source" },
          { status: 400 },
        );
      }

      await prisma.contactListMember.deleteMany({
        where: {
          contact_id: { in: contactIds },
          list_id: listId,
        },
      });
    } else if (action === "delete") {
      await prisma.contact.deleteMany({
        where: {
          id: { in: contactIds },
        },
      });
    }

    return NextResponse.json({ success: true, count: contactIds.length });
  } catch (error: any) {
    console.error("POST /api/lists/members/bulk error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
