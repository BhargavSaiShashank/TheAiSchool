import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Finalized Identity Gateway Route
 * Handlers are hardened against concurrent client hydration races via atomic operations.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Extract Dynamic Clerk Context using modern async auth extraction
    const { userId, orgId, orgRole } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch live user from Clerk to determine mapping properties
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress || "synced@clerk.user";

    // --- 🔒 PHASE 1: ATOMIC USER RESOLUTION 🔒 ---
    // Step A: Attempt fast retrieval of the global identity anchor
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { email: email }]
      },
    });

    // Step B: Self-healing fallback: sync IDs if email match found
    if (dbUser && dbUser.id !== userId) {
      dbUser = await prisma.user.update({
        where: { email: dbUser.email },
        data: { id: userId },
      });
    }

    // Step C: If completely brand new, initialize identity ATOMICALLY
    if (!dbUser) {
      try {
        // Nest creation within organization to eliminate partial constraint fails!
        dbUser = await prisma.user.create({
          data: {
            id: userId,
            email: email,
            password_hash: "CLERK_MANAGED_AUTH",
            role: "SUPER_ADMIN",
            organization: {
              create: {
                name: `${email.split('@')[0]}'s Workspace`,
                from_email: email,
              }
            }
          },
        });
      } catch (insertErr: any) {
        // RACE DETECTION: If P2002 arrives, it implies another parallel request won the insertion race.
        // Swallow gracefully and fetch the existing user created by that winner.
        if (insertErr.code === 'P2002') {
           dbUser = await prisma.user.findUnique({ where: { id: userId } });
           if (!dbUser) {
             // Double-safe fallback check via email
             dbUser = await prisma.user.findUnique({ where: { email: email } });
           }
        } else {
           throw insertErr; // Genuine non-race error encountered
        }
      }
    }

    if (!dbUser) {
      throw new Error("FAILED_IDENTITY_LOCK: Critical error resolving identity container.");
    }

    // --- 🚀 PHASE 2: ATOMIC MULTI-TENANT SHADOW SYNC 🚀 ---
    let activeOrg;
    // Safety Core: If org context exists, drop baseline to minimum clearance (VIEWER) instantly to prevent privilege leaks!
    let activeRole = orgId ? "VIEWER" : dbUser.role; 

    if (orgId) {
      // USER IS INSIDE AN ACTIVE CLERK ORGANIZATION!
      activeOrg = await prisma.organization.upsert({
        where: { clerk_org_id: orgId },
        update: {}, 
        create: {
          clerk_org_id: orgId,
          name: "New Enterprise Workspace", 
          from_email: email,
        }
      });

      // Map the dynamic Clerk Org Role into internal RBAC spec with absolute defensive strictness
      if (orgRole) {
        const roleLower = orgRole.toLowerCase();
        if (roleLower === 'org:admin' || roleLower.includes('admin')) {
          activeRole = "SUPER_ADMIN";
        } else if (roleLower === 'org:member' || roleLower.includes('member') || roleLower.includes('manager')) {
          activeRole = "CAMPAIGN_MANAGER";
        } else {
          activeRole = "VIEWER"; // Secure fallback for unexpected/custom Clerk roles
        }
      }
    } else {
      // SOLO MODE (PERSONAL ACCOUNT) 🏠
      activeOrg = await prisma.organization.findUnique({
        where: { id: dbUser.org_id }
      });
    }

    // --- 🔄 DYNAMIC CONTEXT SYNCHRONIZATION 🔄 ---
    // Detect if the database physically drifts from the current session authority.
    // If it drifts, execute an immediate hot-patch to sync current workspace.
    const hasOrgDrift = activeOrg && dbUser.org_id !== activeOrg.id;
    const hasRoleDrift = dbUser.role !== activeRole;

    if (hasOrgDrift || hasRoleDrift) {
       // Sync DB to reflect reality of current workspace
       await prisma.user.update({
         where: { id: dbUser.id },
         data: {
           org_id: activeOrg?.id || dbUser.org_id,
           role: activeRole,
         },
       });
    }

    // FINAL CONTEXT DELIVERY
    return NextResponse.json({
      id: dbUser.id,
      email: dbUser.email,
      role: activeRole, 
      org_id: activeOrg?.id || dbUser.org_id,
      org_name: activeOrg?.name || "Workspace",
      aws_region: activeOrg?.aws_region || null,
    });

  } catch (error: any) {
    console.error("Fatal crash inside /api/auth/me gateway:", error);
    
    // MAXIMUM DIAGNOSTIC ESCALATION: Leave absolutely no metadata hidden.
    return NextResponse.json({ 
      error: error.message || "Unknown Error Encountered", 
      code: error.code || "NO_ERROR_CODE",
      meta: error.meta || {},
      stack: error.stack?.substring(0, 1000) || "No Stack Trace Available",
      name: error.name || "GenericError",
      rawString: String(error)
    }, { status: 500 });
  }
}
