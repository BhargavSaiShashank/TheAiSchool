import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password, orgName } = await req.json();

    if (!email || !password || !orgName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email address is already registered." }, { status: 400 });
    }

    // 1. Create a brand new organization for the signing-up user
    const newOrg = await prisma.organization.create({
      data: {
        name: orgName,
      },
    });

    // 2. Create the Super Admin user for this new organization
    const newUser = await prisma.user.create({
      data: {
        email,
        password_hash: password, // Keep password hash as clear password for standard schema
        role: "SUPER_ADMIN",
        org_id: newOrg.id,
      },
    });

    return NextResponse.json({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      org_id: newUser.org_id,
      org_name: newOrg.name,
    });
  } catch (error: any) {
    console.error("POST /api/auth/signup error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
