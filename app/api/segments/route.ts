import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSecureOrgId } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    const orgId = await getSecureOrgId(req);
    const segments = await prisma.segment.findMany({
      where: { org_id: orgId },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(segments);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch segments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const orgId = await getSecureOrgId(req);
    const body = await req.json();
    const { name, rules } = body;

    if (!name || !rules) {
      return NextResponse.json({ error: "Missing Segment Name or Rule Definitions" }, { status: 400 });
    }

    const newSegment = await prisma.segment.create({
      data: {
        org_id: orgId,
        name: name,
        rules: typeof rules === "string" ? rules : JSON.stringify(rules),
      },
    });

    return NextResponse.json(newSegment);
  } catch (error: any) {
    console.error("[Segments API] Create error:", error);
    return NextResponse.json({ error: "Failed to archive segment" }, { status: 500 });
  }
}
