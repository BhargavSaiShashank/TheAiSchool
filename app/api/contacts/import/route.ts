import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { contacts } = await req.json();

    if (!contacts || !Array.isArray(contacts)) {
      return NextResponse.json({ error: "Invalid contacts list provided" }, { status: 400 });
    }

    // Get default organization or create one
    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: "Default Org",
        },
      });
    }

    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
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

        // Use upsert to handle updates and additions seamlessly
        const existing = await prisma.contact.findUnique({
          where: { email: c.email },
        });

        if (existing) {
          await prisma.contact.update({
            where: { email: c.email },
            data: {
              first_name: c.firstName || existing.first_name,
              last_name: c.lastName || existing.last_name,
              phone: c.phone || existing.phone,
              custom_fields: customFields,
              status: c.status || existing.status,
            },
          });
          updatedCount++;
        } else {
          await prisma.contact.create({
            data: {
              email: c.email,
              first_name: c.firstName || "",
              last_name: c.lastName || "",
              phone: c.phone || "",
              status: c.status || "active",
              org_id: org.id,
              custom_fields: customFields,
              source: "import",
            },
          });
          addedCount++;
        }
      } catch (err) {
        console.error("Error importing contact row:", c.email, err);
        errorCount++;
      }
    }

    return NextResponse.json({
      added: addedCount,
      updated: updatedCount,
      skipped: skippedCount,
      errored: errorCount,
    });
  } catch (error: any) {
    console.error("POST /api/contacts/import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
