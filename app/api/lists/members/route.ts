import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { listId, contactIds } = body;

    if (!listId || !contactIds || !Array.isArray(contactIds)) {
      return NextResponse.json({ error: "listId and contactIds array are required" }, { status: 400 });
    }

    const data = contactIds.map((cid: string) => ({
      contact_id: cid,
      list_id: listId,
    }));

    await prisma.contactListMember.createMany({
      data,
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true, count: contactIds.length });
  } catch (error: any) {
    console.error("POST /api/lists/members error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
