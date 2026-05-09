import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

/**
 * Retrieves the active organization details for the authenticated user.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Identify user profile to secure their specific org_id
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true }
    });

    if (!userProfile || !userProfile.organization) {
      return NextResponse.json({ error: "No active workspace context found" }, { status: 404 });
    }

    const org = userProfile.organization;

    return NextResponse.json({
      id: org.id,
      name: org.name,
      fromEmail: org.from_email || "",
      region: org.aws_region || "",
      configSet: org.ses_config_set || "",
    });
  } catch (error: any) {
    console.error("GET /api/org error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * Updates the organization profile strictly for the user's owned workspace.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, fromEmail, region, configSet } = body;

    // 1. Fetch current user context securely
    const userProfile = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userProfile) {
      return NextResponse.json({ error: "User account mapping not found" }, { status: 404 });
    }

    // 2. Atomically update user's explicit organization
    const updatedOrg = await prisma.organization.update({
      where: { id: userProfile.org_id },
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
    return NextResponse.json({ error: "Failed to save profile updates" }, { status: 500 });
  }
}
