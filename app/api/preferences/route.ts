import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid") || "";

    if (!uid) {
      return NextResponse.json(
        { error: "Missing unique identifier" },
        { status: 400 },
      );
    }

    const [contactId] = uid.split("_");

    // Fetch the active contact details with their current list memberships
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        organization: true,
        lists: true, // This is ContactListMember[]
      },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Fetch all lists of the organization from ContactList model
    const allLists = await prisma.contactList.findMany({
      where: { org_id: contact.org_id },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    return NextResponse.json({
      email: contact.email,
      orgName: contact.organization?.name || "PulseSend Inc.",
      subscribedListIds: contact.lists.map((l) => l.list_id),
      allLists,
    });
  } catch (error: any) {
    console.error("GET /api/preferences error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { uid, listIds } = await req.json();

    if (!uid || !Array.isArray(listIds)) {
      return NextResponse.json(
        { error: "Invalid request parameters" },
        { status: 400 },
      );
    }

    const [contactId] = uid.split("_");

    // Fetch the contact
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Safely update contact list member connections
    // 1. Delete all existing memberships for this contact
    await prisma.contactListMember.deleteMany({
      where: { contact_id: contactId },
    });

    // 2. Insert new memberships for the selected list IDs
    if (listIds.length > 0) {
      await prisma.contactListMember.createMany({
        data: listIds.map((listId: string) => ({
          contact_id: contactId,
          list_id: listId,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/preferences error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
