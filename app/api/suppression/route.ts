import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";

export async function GET() {
  try {
    const list = await prisma.suppressionList.findMany({
      orderBy: { suppressed_at: "desc" },
    });

    const formatted = list.map((item) => ({
      id: item.id,
      email: item.email,
      reason: item.reason, // e.g. 'hard_bounce', 'spam_complaint', 'manual_unsubscribe'
      date: formatDistanceToNow(new Date(item.suppressed_at), { addSuffix: true }),
      log: item.reason === "hard_bounce" 
        ? "hard bounce detected by SES simulation: 550 5.1.1 User Unknown"
        : item.reason === "spam_complaint"
        ? "spam complaint detected by SNS webhook"
        : "manually added by administrator or unsubscribe link click",
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET /api/suppression error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { email, reason, log } = await req.json();

    if (!email || !reason) {
      return NextResponse.json({ error: "Email and reason are required" }, { status: 400 });
    }

    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: { name: "Default Org" },
      });
    }

    const created = await prisma.suppressionList.create({
      data: {
        email,
        reason,
        org_id: org.id,
      },
    });

    return NextResponse.json(created);
  } catch (error: any) {
    console.error("POST /api/suppression error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Suppression ID is required" }, { status: 400 });
    }

    await prisma.suppressionList.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/suppression error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
