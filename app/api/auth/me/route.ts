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
    let activeRole = dbUser.role;

    if (orgId) {
      // USER IS INSIDE AN ACTIVE CLERK ORGANIZATION!
      // Use UPSERT (atomic update/insert select) to eradicate creation races absolutely!
      activeOrg = await prisma.organization.upsert({
        where: { clerk_org_id: orgId },
        update: {}, // Atomically acts as passive select if already present
        create: {
          clerk_org_id: orgId,
          name: "New Enterprise Workspace", 
          from_email: email,
        }
      });

      // Map the dynamic Clerk Org Role into internal RBAC spec
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
      // SOLO MODE (PERSONAL ACCOUNT) 🏠
      activeOrg = await prisma.organization.findUnique({
        where: { id: dbUser.org_id }
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
    return NextResponse.json({ 
      error: error.message, 
      code: error.code,
      meta: error.meta 
    }, { status: 500 });
  }
}
