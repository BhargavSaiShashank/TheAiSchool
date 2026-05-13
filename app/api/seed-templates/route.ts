import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const queryOrgId = searchParams.get("orgId");
    
    let org = null;
    if (queryOrgId) {
      org = await prisma.organization.findUnique({ where: { id: queryOrgId } });
    }
    
    if (!org) {
      org = await prisma.organization.findFirst();
    }
    
    if (!org) {
      // Auto provision fallback org if completely wiped
      org = await prisma.organization.create({
        data: {
          name: "Demonstration Workspace"
        }
      });
    }

    const orgId = org.id;

    // Insane Template 1: Cyberpunk Dark Theme
    const cyberHtml = `
      <div style="background:#050508; color:#e2e8f0; font-family:system-ui, sans-serif; padding:40px 20px; max-width:600px; margin:0 auto; border:1px solid #1e1b4b; border-radius:12px; box-shadow: 0 10px 30px -10px rgba(124, 92, 255, 0.3);">
        <h1 style="font-size:24px; font-weight:900; text-transform:uppercase; letter-spacing:2px; background: linear-gradient(to right, #7C5CFF, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom:20px;">
          SYSTEM DISPATCH // QUANTUM MATRIX
        </h1>
        <div style="background:#0c0c12; border:1px solid #1e1e2e; padding:20px; border-radius:8px; font-size:14px; margin-bottom:24px; border-left: 4px solid #7C5CFF;">
          <p style="margin:0; line-height:1.6; font-family:monospace; color:#a1a1aa;">
            > INITIALIZING DEEP-STREAM ANALYTICS PROTOCOLS...<br>
            > TELEMETRY CONVERGENCE STABLE.<br><br>
            Welcome to the next evolution of operational control. We have completed the deployment of your global node infrastructure. 
          </p>
        </div>
        <a href="#" style="display:inline-block; background:#7C5CFF; color:#ffffff; text-decoration:none; font-weight:bold; font-size:13px; padding:12px 24px; border-radius:6px; text-transform:uppercase; letter-spacing:1px; box-shadow: 0 4px 14px rgba(124,92,255,0.4);">
          Access Control Grid
        </a>
      </div>
    `;

    // Insane Template 2: Clean Minimalist Obsidian SaaS
    const saasHtml = `
      <div style="background:#ffffff; color:#09090b; font-family:'Inter', -apple-system, sans-serif; padding:50px 30px; max-width:550px; margin:0 auto; border-radius:16px; border:1px solid #e4e4e7;">
        <div style="margin-bottom:32px;">
          <div style="width:36px; height:36px; background:#09090b; border-radius:8px; display:inline-block;"></div>
        </div>
        <h1 style="font-size:28px; font-weight:800; letter-spacing:-0.5px; color:#09090b; line-height:1.2; margin-bottom:16px;">
          Your analytics reporting just received a massive upgrade.
        </h1>
        <p style="font-size:16px; line-height:1.6; color:#52525b; margin-bottom:24px;">
          Starting today, you can track delivery metrics, visual click maps, and geographic engagement rates down to the microsecond. Zero complexity. Extreme power.
        </p>
        <div style="background:#f4f4f5; padding:20px; border-radius:12px; margin-bottom:28px;">
          <h3 style="margin:0 0 8px 0; font-size:14px; font-weight:700;">⚡ What's New:</h3>
          <ul style="margin:0; padding-left:20px; font-size:14px; color:#52525b; line-height:1.7;">
            <li>Deterministic Click Injection API</li>
            <li>Next-Gen WebSocket Live Poller</li>
            <li>Unified Organizational Boundaries</li>
          </ul>
        </div>
        <a href="#" style="display:block; text-align:center; background:#09090b; color:#ffffff; text-decoration:none; font-weight:600; font-size:14px; padding:14px; border-radius:8px;">
          Get Started Now
        </a>
      </div>
    `;

    // Insane Template 3: Holographic AI Portal
    const aiHtml = `
      <div style="background:#000000; color:#ffffff; font-family:system-ui, sans-serif; padding:60px 20px; max-width:600px; margin:0 auto; position:relative; overflow:hidden; text-align:center; border:1px solid #333; border-radius:20px;">
        <div style="display:inline-block; padding:6px 12px; border-radius:20px; background:rgba(255,255,255,0.1); font-size:11px; font-weight:bold; text-transform:uppercase; letter-spacing:1.5px; color:#3b82f6; border:1px solid rgba(59, 130, 246, 0.3); margin-bottom:24px;">
          ⚡ CO-PILOT ASSISTED
        </div>
        <h1 style="font-size:32px; font-weight:800; letter-spacing:-1px; margin:0 0 16px 0; background: linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          Artificial Intelligence has met your workflow.
        </h1>
        <p style="font-size:15px; line-height:1.6; color:#8e8e93; max-width:460px; margin:0 auto 32px auto;">
          Seamlessly generate email copy, automate high-delivery cadences, and map predictive outcomes with a click.
        </p>
        <div style="border-radius:16px; background: linear-gradient(90deg, #ff007a 0%, #7C5CFF 100%); padding:2px; display:inline-block;">
          <a href="#" style="display:block; background:#000000; color:#ffffff; padding:14px 32px; border-radius:14px; text-decoration:none; font-weight:bold; font-size:14px;">
            Launch Neural Workspace
          </a>
        </div>
      </div>
    `;

    // Insane Template 4: Editorial Creator Vibe
    const creatorHtml = `
      <div style="background:#fdfcf7; color:#2b2620; font-family:'Georgia', serif; padding:50px 30px; max-width:580px; margin:0 auto; border:1px solid #e6e1d6;">
        <div style="text-align:center; font-size:12px; font-family:sans-serif; font-weight:700; text-transform:uppercase; letter-spacing:3px; border-bottom: 2px solid #2b2620; padding-bottom:15px; margin-bottom:40px;">
          THE CREATOR OBSERVER
        </div>
        <h1 style="font-size:34px; font-style:italic; line-height:1.1; margin:0 0 20px 0; color:#1a1714;">
          The gentle art of modern engineering scaling.
        </h1>
        <p style="font-size:17px; line-height:1.7; color:#4a433b; margin-bottom:24px;">
          "Simplicity is the ultimate sophistication." In a world that constantly chases complexity, true mastery lies in stripping away the noise until only the essential core remains.
        </p>
        <blockquote style="border-left: 3px solid #8b7d6b; padding-left:20px; margin:0 0 28px 20px; font-style:italic; color:#6b5e4f; font-size:18px;">
          Scale without losing your soul.
        </blockquote>
        <p style="font-size:16px; line-height:1.7; color:#4a433b; margin-bottom:36px;">
          In today's newsletter, we unpack how top teams build systems that process millions of events while keeping UX fluid, crisp, and elegant.
        </p>
        <a href="#" style="font-family:sans-serif; font-weight:bold; text-decoration:underline; color:#2b2620; font-size:14px;">
          Read Full Essay →
        </a>
      </div>
    `;

    // Insane Template 5: High Contrast Metric Matrix
    const metricHtml = `
      <div style="background:#0c0a09; color:#f5f5f4; font-family:'Inter', sans-serif; padding:40px; max-width:600px; margin:0 auto; border-radius:8px;">
        <div style="display:flex; align-items:center; justify-content:between; margin-bottom:40px; border-bottom:1px solid #292524; padding-bottom:15px;">
          <div style="font-weight:bold; color:#e7e5e4; font-size:14px;">📈 LIVE TELEMETRY</div>
          <div style="color:#78716c; font-size:12px; font-family:monospace;">ACTIVE NODES: 24</div>
        </div>
        <h2 style="font-size:22px; font-weight:800; margin:0 0 24px 0; color:#fafaf9;">Weekly Engagement Pulse</h2>
        
        <div style="display:grid; gap:15px; margin-bottom:32px;">
          <div style="background:#1c1917; border:1px solid #292524; padding:15px; border-radius:6px;">
            <div style="font-size:11px; color:#a8a29e; font-weight:bold; text-transform:uppercase;">Unique Open Rate</div>
            <div style="font-size:28px; font-weight:900; color:#22c55e; font-family:monospace; margin-top:5px;">98.4%</div>
          </div>
          <div style="background:#1c1917; border:1px solid #292524; padding:15px; border-radius:6px;">
            <div style="font-size:11px; color:#a8a29e; font-weight:bold; text-transform:uppercase;">Click-Through Conversion</div>
            <div style="font-size:28px; font-weight:900; color:#3b82f6; font-family:monospace; margin-top:5px;">24.1%</div>
          </div>
        </div>
        
        <a href="#" style="display:block; text-align:center; background:#22c55e; color:#0c0a09; text-decoration:none; font-weight:bold; font-size:13px; padding:12px; border-radius:4px; text-transform:uppercase;">
          Inspect Cloud Cluster
        </a>
      </div>
    `;

    const templatesToCreate = [
      { name: "SYSTEM DISPATCH // MATRIX", category: "Futuristic", html: cyberHtml },
      { name: "Obsidian SaaS Upgrade", category: "Minimalist", html: saasHtml },
      { name: "Co-Pilot Neural Reveal", category: "AI Assist", html: aiHtml },
      { name: "The Creator Observer", category: "Editorial", html: creatorHtml },
      { name: "Live Metrics Dashboard", category: "Telemetry", html: metricHtml }
    ];

    let createdCount = 0;
    for (const temp of templatesToCreate) {
      // Check if template already exists in organization
      const exists = await prisma.template.findFirst({
        where: { org_id: orgId, name: temp.name }
      });

      if (!exists) {
        await prisma.template.create({
          data: {
            org_id: orgId,
            name: temp.name,
            category: temp.category,
            html: temp.html,
            blocks: "[]"
          }
        });
        createdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${createdCount} insane templates successfully injected into active workspace!`,
      organizationId: orgId,
      details: templatesToCreate.map(t => t.name)
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
