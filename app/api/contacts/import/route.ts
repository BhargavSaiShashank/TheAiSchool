import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSecureOrgId } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  try {
    const orgId = await getSecureOrgId(req);
    const { contacts, listId } = await req.json();

    if (!contacts || !Array.isArray(contacts)) {
      return NextResponse.json({ error: "Contact array invalid" }, { status: 400 });
    }

    let addedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const c of contacts) {
      if (!c.email || !c.email.includes("@")) {
        errorCount++;
        continue;
      }

      try {
        const customFields = JSON.stringify({
          company: c.company || "",
          city: c.city || "",
          jobTitle: c.jobTitle || "",
        });

        // Locate potential existing record strictly within the bound workspace!
        const existing = await prisma.contact.findFirst({
          where: { email: c.email, org_id: orgId },
        });

        let contactId = "";

        if (existing) {
          const updated = await prisma.contact.update({
            where: { id: existing.id },
            data: {
              first_name: c.firstName || existing.first_name,
              last_name: c.lastName || existing.last_name,
              custom_fields: customFields,
              status: c.status || existing.status,
            },
          });
          contactId = updated.id;
          updatedCount++;
        } else {
          const created = await prisma.contact.create({
            data: {
              email: c.email,
              first_name: c.firstName || "",
              last_name: c.lastName || "",
              status: c.status || "active",
              org_id: orgId, // Isolated creation
              custom_fields: customFields,
              source: "import",
            },
          });
          contactId = created.id;
          addedCount++;
        }

        // Secure list membership binding
        if (listId && listId !== "none" && contactId) {
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
      } catch (err) {
        errorCount++;
      }
    }

    return NextResponse.json({
      added: addedCount,
      updated: updatedCount,
      skipped: 0,
      errored: errorCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Operation forbidden" }, { status: 401 });
  }
}
