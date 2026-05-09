import { getAuth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch live user from Clerk
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress || "synced@clerk.user";

    // Fetch user from DB with their connected organization (matching by Clerk userId or actual email)
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { email: email }
        ]
      },
      include: { organization: true },
    });

    // Self-healing fallback: If user was seeded/manually invited with their email, but hasn't had their Clerk ID mapped yet
    if (dbUser && dbUser.id !== userId) {
      dbUser = await prisma.user.update({
        where: { email: dbUser.email },
        data: { id: userId },
        include: { organization: true },
      });
    }

    // If user record completely doesn't exist yet
    if (!dbUser) {
      let defaultOrg = await prisma.organization.findFirst();
      if (!defaultOrg) {
        defaultOrg = await prisma.organization.create({
          data: { name: "Default Org" },
        });
      }

      dbUser = await prisma.user.create({
        data: {
          id: userId,
          email: email,
          password_hash: "CLERK_MANAGED_AUTH",
          role: "CAMPAIGN_MANAGER",
          org_id: defaultOrg.id,
        },
        include: { organization: true },
      });
    }

    return NextResponse.json({
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      org_id: dbUser.org_id,
      org_name: dbUser.organization?.name || "Default Org",
    });
  } catch (error: any) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
