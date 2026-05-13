import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSecureOrgId, enforceRole } from "@/lib/auth-utils";

/**
 * Safely serves only the template directory belonging to the active organization context.
 */
export async function GET(req: NextRequest) {
  try {
    let orgId = req.headers.get("x-org-id");
    if (!orgId || orgId === "undefined") {
      orgId = await getSecureOrgId(req);
    }

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
        thumbnail:
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=350&h=200&q=80",
        count:
          blockCount > 0 ? `Custom (${blockCount} blocks)` : "Active Template",
      };
    });

    return NextResponse.json(formattedTemplates);
  } catch (error: any) {
    console.error("GET /api/templates fault:", error.message);
    return NextResponse.json(
      { error: "Access Denied: Unverifiable session" },
      { status: 401 },
    );
  }
}

/**
 * Securely creates or mutates template layouts, strictly locked into user ownership bounds.
 */
export async function POST(req: NextRequest) {
  try {
    await enforceRole(req, ["SUPER_ADMIN", "CAMPAIGN_MANAGER"]);
    let orgId = req.headers.get("x-org-id");
    if (!orgId || orgId === "undefined") {
      orgId = await getSecureOrgId(req);
    }
    const body = await req.json();
    const { id, name, category, content, html } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Template identifier required" },
        { status: 400 },
      );
    }

    let template;
    if (id && id !== "new") {
      // Highly defensive update: ensure the target template is owned by our exact organization context.
      template = await prisma.template.updateMany({
        where: {
          id: id,
          org_id: orgId, // Prevents high-privilege crossover attacks
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
    return NextResponse.json(
      { error: "Write forbidden without credentialed sync" },
      { status: 401 },
    );
  }
}

/**
 * Securely excises existing templates, anchored by both RBAC authority and structural tenancy limits.
 */
export async function DELETE(req: NextRequest) {
  try {
    await enforceRole(req, ["SUPER_ADMIN", "CAMPAIGN_MANAGER"]);
    let orgId = req.headers.get("x-org-id");
    if (!orgId || orgId === "undefined") {
      orgId = await getSecureOrgId(req);
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Invalid identifier provided" },
        { status: 400 },
      );
    }

    // Critical Multi-tenant Security: Force org_id verification before excision.
    const outcome = await prisma.template.deleteMany({
      where: {
        id: id,
        org_id: orgId,
      },
    });

    if (outcome.count === 0) {
      return NextResponse.json(
        { error: "Resource not found or inaccessible" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("DELETE /api/templates fault:", error.message);
    return NextResponse.json(
      { error: "Purge rejected: Unauthorized context" },
      { status: 401 },
    );
  }
}
