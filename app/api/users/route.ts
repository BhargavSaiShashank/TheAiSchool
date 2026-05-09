import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSecureOrgId } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    const orgId = await getSecureOrgId(req);

    const list = await prisma.user.findMany({
      where: { org_id: orgId },
      orderBy: { created_at: "asc" },
    });

    const formatted = list.map((item) => ({
      id: item.id,
      email: item.email,
      role: item.role,
      status: item.active_status ? "Active" : "Inactive",
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to retrieve team manifest" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const orgId = await getSecureOrgId(req);
    const { email, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Mandatory email/role pairs expected" }, { status: 400 });
    }

    // Force assignment to the secure organization ID resolved by token
    const created = await prisma.user.create({
      data: {
        email,
        role,
        password_hash: "PENDING_CLERK_CLAIM",
        org_id: orgId,
        id: `PENDING_${crypto.randomUUID()}`, // placeholder until they claim their Clerk seat
      },
    });

    return NextResponse.json({
      id: created.id,
      email: created.email,
      role: created.role,
      status: "Provisioned",
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Resource allocation rejected" }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const orgId = await getSecureOrgId(req);
    const { id, role } = await req.json();

    if (!id || !role) return NextResponse.json({ error: "Parameters invalid" }, { status: 400 });

    // Safe update filtering by composite id & org_id to block lateral elevation attacks
    const updated = await prisma.user.updateMany({
      where: { 
        id: id,
        org_id: orgId
      },
      data: { role },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Execution blocked" }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const orgId = await getSecureOrgId(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.user.deleteMany({
      where: { 
        id: id,
        org_id: orgId
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Deletion failure" }, { status: 401 });
  }
}
