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
      // Create a brand new, isolated workspace just for this new registrant
      const newOrg = await prisma.organization.create({
        data: { 
          name: `${email.split('@')[0]}'s Workspace`,
          from_email: email,
          // aws_region remains null to trigger onboarding UI automatically!
        },
      });

      dbUser = await prisma.user.create({
        data: {
          id: userId,
          email: email,
          password_hash: "CLERK_MANAGED_AUTH",
          role: "SUPER_ADMIN", // Creator of the workspace is the root owner
          org_id: newOrg.id,
        },
        include: { organization: true },
      });
    }

    return NextResponse.json({
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      org_id: dbUser.org_id,
      org_name: dbUser.organization?.name || "Workspace",
      aws_region: dbUser.organization?.aws_region || null,
    });
  } catch (error: any) {
    console.error("Error in /api/auth/me:", error);
    // Diagnostic exposure to accelerate hotfix
    return NextResponse.json({ 
      error: error.message, 
      code: error.code,
      meta: error.meta 
    }, { status: 500 });
  }
}
