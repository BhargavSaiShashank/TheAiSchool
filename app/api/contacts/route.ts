import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSecureOrgId, enforceRole } from "@/lib/auth-utils";

/**
 * Securely fetches ONLY the contacts owned by the active user's organization.
 */
export async function GET(req: NextRequest) {
  try {
    const orgId = await getSecureOrgId(req);

    const contacts = await prisma.contact.findMany({
      where: {
        org_id: orgId,
      },
      include: {
        lists: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const formattedContacts = contacts.map((c) => {
      let customFields = {};
      try {
        if (c.custom_fields) {
          customFields = JSON.parse(c.custom_fields);
        }
      } catch (e) {
        // Ignore field errors gracefully
      }

      return {
        id: c.id,
        email: c.email,
        firstName: c.first_name || "",
        lastName: c.last_name || "",
        status: c.status,
        company: (customFields as any).company || "",
        city: (customFields as any).city || "",
        jobTitle: (customFields as any).jobTitle || "",
        listIds: c.lists.map((l) => l.list_id),
      };
    });

    return NextResponse.json(formattedContacts);
  } catch (error: any) {
    console.error("GET /api/contacts authorization fault:", error.message);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

/**
 * Securely injects a new subscriber ONLY within the active user's workspace.
 */
export async function POST(req: NextRequest) {
  try {
    await enforceRole(req, ["SUPER_ADMIN", "CAMPAIGN_MANAGER"]);
    const orgId = await getSecureOrgId(req);
    const body = await req.json();
    const {
      email,
      firstName,
      lastName,
      status,
      company,
      city,
      jobTitle,
      listId,
    } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email address is mandatory" },
        { status: 400 },
      );
    }

    // Create within strict org isolation
    const newContact = await prisma.contact.create({
      data: {
        email,
        first_name: firstName,
        last_name: lastName,
        status: status || "active",
        org_id: orgId,
        custom_fields: JSON.stringify({ company, city, jobTitle }),
        source: "manual",
      },
    });

    if (listId && listId !== "none") {
      await prisma.contactListMember.create({
        data: {
          contact_id: newContact.id,
          list_id: listId,
        },
      });
    }

    return NextResponse.json({
      id: newContact.id,
      email: newContact.email,
      firstName: newContact.first_name || "",
      lastName: newContact.last_name || "",
      status: newContact.status,
    });
  } catch (error: any) {
    console.error("POST /api/contacts authorization fault:", error.message);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
