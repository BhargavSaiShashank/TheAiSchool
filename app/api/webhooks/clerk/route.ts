import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Retrieve clerk webhook secret from environment
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;

  // Verify svix signatures if WEBHOOK_SECRET is present
  if (WEBHOOK_SECRET) {
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Error: Missing svix headers", { status: 400 });
    }

    const wh = new Webhook(WEBHOOK_SECRET);

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Error: Could not verify webhook signature:", err);
      return new Response("Error: Verification failed", { status: 400 });
    }
  } else {
    // Skip signature verification in development sandbox if secret is not set
    evt = payload as WebhookEvent;
  }

  const { id } = evt.data;
  const eventType = evt.type;

  try {
    if (eventType === "user.created" || eventType === "user.updated") {
      const data = evt.data as any;
      const primaryEmail = data.email_addresses?.[0]?.email_address || "";

      const existingUser = await prisma.user.findUnique({
        where: { id: id as string },
      });

      if (!existingUser && eventType === "user.created") {
        // Spawn an isolated Solo Workspace to act as the user's home base
        const personalWorkspace = await prisma.organization.create({
          data: {
            name: "Personal Workspace",
            from_email: primaryEmail,
          },
        });

        // Create the user, defaulting to SUPER_ADMIN, and bind to their new workspace
        await prisma.user.create({
          data: {
            id: id as string,
            email: primaryEmail,
            password_hash: "CLERK_MANAGED_AUTH",
            role: "SUPER_ADMIN",
            org_id: personalWorkspace.id,
          },
        });
      } else if (existingUser) {
        // Standard update
        await prisma.user.update({
          where: { id: id as string },
          data: { email: primaryEmail },
        });
      }
    }

    if (eventType === "organization.created") {
      const data = evt.data as any;
      const clerkOrgId = id as string;
      const name = data.name || "Enterprise Workspace";

      // Securely map to clerk_org_id, allowing Prisma to auto-generate the secure UUID `id`
      await prisma.organization.upsert({
        where: { clerk_org_id: clerkOrgId },
        update: { name },
        create: {
          clerk_org_id: clerkOrgId,
          name,
        },
      });
    }

    if (
      eventType === "organizationMembership.created" ||
      eventType === "organizationMembership.deleted"
    ) {
      // 🛡️ INTENTIONALLY OMITTED: We DO NOT overwrite the User's `org_id` home base.
      // The application relies on `getSecureOrgId()` to dynamically extract the active workspace
      // directly from the live Clerk session token to prevent cross-tenant corruption.
      console.log(
        `Clerk Membership event intercepted and ignored for structural integrity.`,
      );
    }

    return NextResponse.json({ success: true });
  } catch (dbErr: any) {
    console.error("Database sync error in Clerk webhook:", dbErr);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }
}
