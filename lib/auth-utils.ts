import { NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * High-security server utility to resolve and verify the current active 
 * organization context for an incoming Next.js request.
 * Throws an error if unauthorized to automatically trigger handler catch blocks.
 */
export async function getSecureOrgId(req: NextRequest): Promise<string> {
  const { userId } = getAuth(req);
  if (!userId) {
    throw new Error("UNAUTHORIZED: No valid session detected");
  }

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
