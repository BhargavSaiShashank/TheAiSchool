import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSecureOrgId } from "@/lib/auth-utils";

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
    return NextResponse.json({ error: "Session failure: Unauthorized" }, { status: 401 });
  }
}

/**
 * Creates new segmentation structures strictly within user context boundaries.
 */
export async function POST(req: NextRequest) {
  try {
    const orgId = await getSecureOrgId(req);
    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "List descriptor label is mandatory" }, { status: 400 });
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
    return NextResponse.json({ error: "Action disallowed: Authentication required" }, { status: 401 });
  }
}
