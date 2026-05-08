import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
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
        console.error("Error parsing contact custom fields:", e);
      }

      return {
        id: c.id,
        email: c.email,
        firstName: c.first_name || "",
        lastName: c.last_name || "",
        status: c.status,
        company: (customFields as any).company || "PulseSend Sandbox",
        city: (customFields as any).city || "Hyderabad",
        jobTitle: (customFields as any).jobTitle || "Developer",
        listIds: c.lists.map((l) => l.list_id),
      };
    });

    return NextResponse.json(formattedContacts);
  } catch (error: any) {
    console.error("GET /api/contacts error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, firstName, lastName, status, company, city, jobTitle, listId, orgId } = body;

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    // Get specific or default organization
    let org = null;
    if (orgId) {
      org = await prisma.organization.findUnique({ where: { id: orgId } });
    }
    if (!org) {
      org = await prisma.organization.findFirst();
    }
    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: "Default Org",
        },
      });
    }

    const newContact = await prisma.contact.create({
      data: {
        email,
        first_name: firstName,
        last_name: lastName,
        status: status || "active",
        org_id: org.id,
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
      company: company || "",
      city: city || "",
      jobTitle: jobTitle || "Developer",
    });
  } catch (error: any) {
    console.error("POST /api/contacts error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
