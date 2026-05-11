import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSecureOrgId, enforceRole } from "@/lib/auth-utils";

/**
 * Fetches only the segmentation lists created by the authenticated workspace.
 */
export async function GET(req: NextRequest) {
  try {
    const orgId = await getSecureOrgId(req);

    const lists = await prisma.contactList.findMany({
      where: {
        org_id: orgId,
      },
      include: {
        members: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const formattedLists = lists.map((list) => ({
      id: list.id,
      name: list.name,
      description: list.description || "",
      count: list.members.length,
      tags: list.tags ? list.tags.split(",") : ["Marketing"],
    }));

    return NextResponse.json(formattedLists);
  } catch (error: any) {
    console.error("GET /api/lists fault:", error.message);
    return NextResponse.json(
      { error: "Session failure: Unauthorized" },
      { status: 401 },
    );
  }
}

/**
 * Creates new segmentation structures strictly within user context boundaries.
 */
export async function POST(req: NextRequest) {
  try {
    await enforceRole(req, ["SUPER_ADMIN", "CAMPAIGN_MANAGER"]);
    const orgId = await getSecureOrgId(req);
    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "List descriptor label is mandatory" },
        { status: 400 },
      );
    }

    const newList = await prisma.contactList.create({
      data: {
        name,
        description,
        org_id: orgId,
        tags: "Fresh,Segment",
      },
    });

    return NextResponse.json({
      id: newList.id,
      name: newList.name,
      description: newList.description || "",
      count: 0,
      tags: ["Fresh", "Segment"],
    });
  } catch (error: any) {
    console.error("POST /api/lists fault:", error.message);
    return NextResponse.json(
      { error: "Action disallowed: Authentication required" },
      { status: 401 },
    );
  }
}

/**
 * Modifies configuration parameters of an existing structure.
 */
export async function PUT(req: NextRequest) {
  try {
    await enforceRole(req, ["SUPER_ADMIN", "CAMPAIGN_MANAGER"]);
    const orgId = await getSecureOrgId(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const { name, description } = await req.json();

    if (!id) return NextResponse.json({ error: "Target list identity missing" }, { status: 400 });

    const updated = await prisma.contactList.updateMany({
      where: { id, org_id: orgId },
      data: { name, description }
    });

    return NextResponse.json({ success: true, updatedCount: updated.count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Executes irreversible permanent eradication of the directory tree and relational mapping.
 */
export async function DELETE(req: NextRequest) {
  try {
    await enforceRole(req, ["SUPER_ADMIN", "CAMPAIGN_MANAGER"]);
    const orgId = await getSecureOrgId(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Deletion target not provided" }, { status: 400 });

    // Cascade suppression: First purge memberships
    await prisma.contactListMember.deleteMany({ where: { list_id: id } });
    
    // Finally kill the host definition
    const deleted = await prisma.contactList.deleteMany({
      where: { id, org_id: orgId }
    });

    return NextResponse.json({ success: true, deletedCount: deleted.count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
