import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      orderBy: {
        created_at: "desc",
      },
    });

    const formattedTemplates = templates.map((t) => {
      // Map database schema fields to frontend structure cleanly
      let blockCount = 0;
      try {
        if (t.blocks) {
          const parsed = JSON.parse(t.blocks);
          if (Array.isArray(parsed)) blockCount = parsed.length;
        }
      } catch (err) {}

      return {
        id: t.id,
        name: t.name,
        category: t.category,
        content: t.blocks,
        html: t.html,
        thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=350&h=200&q=80", // premium visual fallback
        count: blockCount > 0 ? `Custom (${blockCount} blocks)` : "Starter Template",
      };
    });

    return NextResponse.json(formattedTemplates);
  } catch (error: any) {
    console.error("GET /api/templates error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, category, content, html } = body;

    if (!name) {
      return NextResponse.json({ error: "Template name is required" }, { status: 400 });
    }

    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: { name: "Default Org" },
      });
    }

    // Check if updating an existing template or creating a new one
    let template;
    if (id && id !== "new") {
      template = await prisma.template.update({
        where: { id },
        data: {
          name,
          category: category || "General",
          blocks: content || "[]",
          html: html || "",
        },
      });
    } else {
      template = await prisma.template.create({
        data: {
          name,
          category: category || "General",
          blocks: content || "[]",
          html: html || "",
          org_id: org.id,
        },
      });
    }

    return NextResponse.json(template);
  } catch (error: any) {
    console.error("POST /api/templates error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
