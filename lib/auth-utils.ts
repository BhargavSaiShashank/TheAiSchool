import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * High-security server utility to resolve and verify the current active 
 * organization context for an incoming Next.js request.
 * Throws an error if unauthorized to automatically trigger handler catch blocks.
 */
export async function getSecureOrgId(req: NextRequest): Promise<string> {
  // 1. Extract the complete dynamic identity packet
  const { userId, orgId } = await auth();
  if (!userId) {
    throw new Error("UNAUTHORIZED: No valid session detected");
  }

  // --- 🚀 2. DYNAMIC MULTI-TENANT RESOLUTION 🚀 ---
  if (orgId) {
    // The active user is viewing from inside a corporate context!
    const liveOrg = await prisma.organization.findUnique({
      where: { clerk_org_id: orgId },
      select: { id: true }
    });

    if (liveOrg) {
      return liveOrg.id;
    }
    // Fall-through if not yet created by /me gateway (self-heal potential)
  }

  // --- 🏠 3. SOLO MODE / FALLBACK RESOLUTION ---
  // We prioritize mapping by the central clerk user identifier to prevent ID-spoofing attempts.
  const activeUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { org_id: true }
  });

  if (!activeUser || !activeUser.org_id) {
    throw new Error("INCOMPLETE_PROFILE: User has no allocated workspace");
  }

  return activeUser.org_id;
}

/**
 * Iron-clad role enforcement barrier.
 * Verifies the user's active role within the current context against the allowed list.
 * Throws an error if the user lacks sufficient clearance.
 */
export async function enforceRole(req: NextRequest, allowedRoles: string[]): Promise<void> {
  const { userId, orgId, orgRole } = await auth();
  
  if (!userId) {
    throw new Error("UNAUTHORIZED: No valid session detected");
  }

  let activeRole = "VIEWER";

  if (orgId) {
    // 1. DYNAMIC CLERK ROLE PARSING
    if (orgRole) {
      if (orgRole === 'org:admin' || orgRole.includes('admin')) {
        activeRole = "SUPER_ADMIN";
      } else if (orgRole.includes('member')) {
        activeRole = "CAMPAIGN_MANAGER";
      }
    }
  } else {
    // 2. SOLO MODE FALLBACK (Check DB directly)
    const activeUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (activeUser?.role) {
      activeRole = activeUser.role;
    }
  }

  if (!allowedRoles.includes(activeRole)) {
    throw new Error(`FORBIDDEN: Requires one of [${allowedRoles.join(", ")}]. Current role: ${activeRole}`);
  }
}
