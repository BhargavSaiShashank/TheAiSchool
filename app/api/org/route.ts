import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { enforceRole } from "@/lib/auth-utils";

/**
 * Retrieves the active organization details for the authenticated user.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- 🛡️ RBAC ENFORCEMENT: ONLY SUPER ADMINS CAN ACCESS AWS SETTINGS ---
    await enforceRole(req, ["SUPER_ADMIN"]);

    let activeOrg;
    if (orgId) {
      // Target dynamically active corporate workspace
      activeOrg = await prisma.organization.findUnique({
        where: { clerk_org_id: orgId },
      });
    } else {
      // Fallback: user personal workspace
      const userProfile = await prisma.user.findUnique({
        where: { id: userId },
        include: { organization: true },
      });
      activeOrg = userProfile?.organization;
    }

    if (!activeOrg) {
      return NextResponse.json(
        { error: "No active workspace context found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: activeOrg.id,
      name: activeOrg.name,
      fromEmail: activeOrg.from_email || "",
      region: activeOrg.aws_region || "",
      configSet: activeOrg.ses_config_set || "",
    });
  } catch (error: any) {
    if (error.message.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("GET /api/org error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- 🛡️ RBAC ENFORCEMENT: ONLY SUPER ADMINS CAN MODIFY AWS SETTINGS ---
    await enforceRole(req, ["SUPER_ADMIN"]);

    const body = await req.json();
    const { name, fromEmail, region, configSet } = body;

    let targetOrgId: string;

    if (orgId) {
      // 1. DYNAMIC TARGETING: Secure the organization mapped to current Clerk context!
      const liveOrg = await prisma.organization.findUnique({
        where: { clerk_org_id: orgId },
      });

      if (!liveOrg) {
        // Micro-heal: If not mirrored yet, generate on update attempt
        const spawnedOrg = await prisma.organization.create({
          data: {
            clerk_org_id: orgId,
            name: name || "Enterprise Workspace",
            from_email: fromEmail,
          },
        });
        targetOrgId = spawnedOrg.id;
      } else {
        targetOrgId = liveOrg.id;
      }
    } else {
      // 2. SOLO MODE TARGETING: Secure the personal anchor workspace
      const userProfile = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userProfile) {
        return NextResponse.json(
          { error: "User identity mismatch" },
          { status: 404 },
        );
      }
      targetOrgId = userProfile.org_id;
    }

    // 3. AUTHORITATIVE UPDATE: Securely apply AWS payload to EXACT target container!
    const updatedOrg = await prisma.organization.update({
      where: { id: targetOrgId },
      data: {
        name: name?.trim() || undefined,
        from_email: fromEmail?.trim() || undefined,
        aws_region: region || undefined,
        ses_config_set: configSet || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      id: updatedOrg.id,
      name: updatedOrg.name,
      fromEmail: updatedOrg.from_email || "",
      region: updatedOrg.aws_region || "",
      configSet: updatedOrg.ses_config_set || "",
    });
  } catch (error: any) {
    console.error("POST /api/org error:", error);
    return NextResponse.json(
      { error: "Failed to save profile updates" },
      { status: 500 },
    );
  }
}
