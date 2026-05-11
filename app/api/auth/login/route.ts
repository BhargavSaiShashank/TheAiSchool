import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findFirst({
      where: { email },
      include: { organization: true },
    });

    if (!user || user.password_hash !== password) {
      return NextResponse.json(
        { error: "Invalid email address or security credentials." },
        { status: 401 },
      );
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      org_id: user.org_id,
      org_name: user.organization?.name || "PulseSend Inc.",
    });
  } catch (error: any) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
