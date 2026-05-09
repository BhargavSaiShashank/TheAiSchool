import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import { getSecureOrgId } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    const orgId = await getSecureOrgId(req);

    const list = await prisma.suppressionList.findMany({
      where: { org_id: orgId },
      orderBy: { suppressed_at: "desc" },
    });

    const formatted = list.map((item) => ({
      id: item.id,
      email: item.email,
      reason: item.reason,
      date: formatDistanceToNow(new Date(item.suppressed_at), { addSuffix: true }),
      log: item.audit_log || "System auto-suppressed",
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const orgId = await getSecureOrgId(req);
    const { email, reason, log } = await req.json();

    if (!email || !reason) {
      return NextResponse.json({ error: "Field inputs missing" }, { status: 400 });
    }

    const created = await prisma.suppressionList.create({
      data: {
        email,
        reason,
        org_id: orgId,
        audit_log: log || "Manually added via security dash",
      },
    });

    return NextResponse.json(created);
  } catch (error: any) {
    return NextResponse.json({ error: "Action denied" }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const orgId = await getSecureOrgId(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing record identifier" }, { status: 400 });

    // Use deleteMany combined with org_id for secure deletion verification
    await prisma.suppressionList.deleteMany({
      where: {
        id: id,
        org_id: orgId
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Deletion execution failed" }, { status: 401 });
  }
}
