import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSecureOrgId } from "@/lib/auth-utils";

/**
 * Safely serves only the template directory belonging to the active organization context.
 */
export async function GET(req: NextRequest) {
  try {
    const orgId = await getSecureOrgId(req);

    const templates = await prisma.template.findMany({
      where: {
        org_id: orgId,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const formattedTemplates = templates.map((t) => {
      let blockCount = 0;
      try {
        if (t.blocks) {
          const parsed = JSON.parse(t.blocks);
          if (Array.isArray(parsed)) blockCount = parsed.length;
        }
      } catch (err) {
        // Fallback handling for corrupt parsed blocks
      }

      return {
        id: t.id,
        name: t.name,
        category: t.category,
        content: t.blocks,
        html: t.html,
        thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=350&h=200&q=80",
        count: blockCount > 0 ? `Custom (${blockCount} blocks)` : "Active Template",
      };
    });

    return NextResponse.json(formattedTemplates);
  } catch (error: any) {
    console.error("GET /api/templates fault:", error.message);
    return NextResponse.json({ error: "Access Denied: Unverifiable session" }, { status: 401 });
  }
}

/**
 * Securely creates or mutates template layouts, strictly locked into user ownership bounds.
 */
export async function POST(req: NextRequest) {
  try {
    const orgId = await getSecureOrgId(req);
    const body = await req.json();
    const { id, name, category, content, html } = body;

    if (!name) {
      return NextResponse.json({ error: "Template identifier required" }, { status: 400 });
    }

    let template;
    if (id && id !== "new") {
      // Highly defensive update: ensure the target template is owned by our exact organization context.
      template = await prisma.template.updateMany({
        where: { 
          id: id,
          org_id: orgId // Prevents high-privilege crossover attacks
        },
        data: {
          name,
          category: category || "General",
          blocks: content || "[]",
          html: html || "",
        },
      });

      // Return full context for consistency
      return NextResponse.json({ id, name, success: true });
    } else {
      // Create absolutely anchored to secure context
      template = await prisma.template.create({
        data: {
          name,
          category: category || "General",
          blocks: content || "[]",
          html: html || "",
          org_id: orgId,
        },
      });
    }

    return NextResponse.json(template);
  } catch (error: any) {
    console.error("POST /api/templates fault:", error.message);
    return NextResponse.json({ error: "Write forbidden without credentialed sync" }, { status: 401 });
  }
}
