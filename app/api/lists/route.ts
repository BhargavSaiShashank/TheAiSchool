import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const lists = await prisma.contactList.findMany({
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
    console.error("GET /api/lists error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "List name is required" }, { status: 400 });
    }

    // Get default seeded organization
    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: "Default Org",
        },
      });
    }

    const newList = await prisma.contactList.create({
      data: {
        name,
        description,
        org_id: org.id,
        tags: "New,Live",
      },
    });

    return NextResponse.json({
      id: newList.id,
      name: newList.name,
      description: newList.description || "",
      count: 0,
      tags: ["New", "Live"],
    });
  } catch (error: any) {
    console.error("POST /api/lists error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
