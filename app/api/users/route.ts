import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const list = await prisma.user.findMany({
      orderBy: { created_at: "asc" },
    });

    const formatted = list.map((item) => ({
      id: item.id,
      email: item.email,
      role: item.role,
      status: "Active", // Seeded users are active
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { email, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: { name: "Default Org" },
      });
    }

    // Default password for invited teammates matching standard user schema
    const created = await prisma.user.create({
      data: {
        email,
        role,
        password_hash: role === "SUPER_ADMIN" ? "admin123" : role === "CAMPAIGN_MANAGER" ? "manager123" : "viewer123",
        org_id: org.id,
      },
    });

    return NextResponse.json({
      id: created.id,
      email: created.email,
      role: created.role,
      status: "Invited",
    });
  } catch (error: any) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, role } = await req.json();

    if (!id || !role) {
      return NextResponse.json({ error: "User ID and role are required" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/users error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/users error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
