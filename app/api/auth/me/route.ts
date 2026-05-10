import { getAuth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // 1. Extract Dynamic Clerk Context (Now utilizing multi-tenant tokens!)
    const { userId, orgId, orgRole } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch live user from Clerk
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress || "synced@clerk.user";

    // 2. Load or Create the Static Identity Anchor (The global human user)
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { email: email }]
      },
    });

    // Self-healing fallback: sync IDs
    if (dbUser && dbUser.id !== userId) {
      dbUser = await prisma.user.update({
        where: { email: dbUser.email },
        data: { id: userId },
      });
    }

    // If completely brand new human, initialize global identity
    if (!dbUser) {
      // Create temporary individual fallback workspace to preserve boot-flow
      const fallbackOrg = await prisma.organization.create({
        data: {
          name: `${email.split('@')[0]}'s Workspace`,
          from_email: email,
        },
      });
      
      dbUser = await prisma.user.create({
        data: {
          id: userId,
          email: email,
          password_hash: "CLERK_MANAGED_AUTH",
          role: "SUPER_ADMIN", 
          org_id: fallbackOrg.id, // Hard anchor to satisfy schema constraints
        },
      });
    }

    // --- 🚀 DYNAMIC MULTI-TENANT OVERRIDE RESOLVER 🚀 ---
    let activeOrg;
    let activeRole = dbUser.role; // Fallback to global role

    if (orgId) {
      // USER IS INSIDE AN ACTIVE CLERK ORGANIZATION! 🏢
      activeOrg = await prisma.organization.findUnique({
        where: { clerk_org_id: orgId }
      });

      // Self-healing: If this organization doesn't exist in our Supabase yet, spawn a shadow-copy!
      if (!activeOrg) {
        activeOrg = await prisma.organization.create({
          data: {
            clerk_org_id: orgId,
            name: "New Enterprise Workspace", // Will be synced via Clerk hooks or manual update
            from_email: email, 
          }
        });
      }

      // Map the dynamic Clerk Org Role into our DB format
      // Clerk roles: 'org:admin' -> SUPER_ADMIN, 'org:member' -> CAMPAIGN_MANAGER
      if (orgRole) {
        if (orgRole === 'org:admin' || orgRole.includes('admin')) {
          activeRole = "SUPER_ADMIN";
        } else if (orgRole.includes('member')) {
          activeRole = "CAMPAIGN_MANAGER";
        } else {
          activeRole = "VIEWER";
        }
      }
    } else {
      // USER IS IN SOLO MODE (PERSONAL ACCOUNT) 🏠
      activeOrg = await prisma.organization.findUnique({
        where: { id: dbUser.org_id }
      });
    }

    // FINAL CONTEXT DELIVERY
    return NextResponse.json({
      id: dbUser.id,
      email: dbUser.email,
      role: activeRole, // Dynamically calculated based on active session
      org_id: activeOrg?.id || dbUser.org_id,
      org_name: activeOrg?.name || "Workspace",
      aws_region: activeOrg?.aws_region || null,
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
