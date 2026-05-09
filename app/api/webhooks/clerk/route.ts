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
      const firstName = data.first_name || "";
      const lastName = data.last_name || "";

      // Ensure a default organization exists
      let defaultOrg = await prisma.organization.findFirst();
      if (!defaultOrg) {
        defaultOrg = await prisma.organization.create({
          data: {
            name: "Default Org",
          },
        });
      }

      await prisma.user.upsert({
        where: { id: id as string },
        update: {
          email: primaryEmail,
        },
        create: {
          id: id as string,
          email: primaryEmail,
          password_hash: "CLERK_MANAGED_AUTH",
          role: "CAMPAIGN_MANAGER",
          org_id: defaultOrg.id,
        },
      });
    }

    if (eventType === "organization.created") {
      const data = evt.data as any;
      const name = data.name || "My Organization";

      await prisma.organization.upsert({
        where: { id: id as string },
        update: {
          name,
        },
        create: {
          id: id as string,
          name,
        },
      });
    }

    if (eventType === "organizationMembership.created") {
      const data = evt.data as any;
      const orgId = data.organization?.id;
      const userId = data.public_user_data?.user_id;

      if (orgId && userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            org_id: orgId,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (dbErr: any) {
    console.error("Database sync error in Clerk webhook:", dbErr);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }
}
