import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Extract the user's authenticated session
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Please log in first." }, { status: 401 });
    }

    // 2. Locate the core organization in the database
    let targetOrg = await prisma.organization.findFirst({
      orderBy: { created_at: 'asc' }
    });

    if (!targetOrg) {
      // Create it if completely missing
      targetOrg = await prisma.organization.create({
        data: { name: "The AI School Workspace" }
      });
    }

    const correctOrgId = targetOrg.id;

    // 3. Ensure user record exists and is mapped to this correct organization
    let userInDb = await prisma.user.findUnique({
      where: { id: userId }
    });

    let userUpdated = false;
    if (!userInDb) {
      return NextResponse.json({ error: `Sync Lock Error: DB User not found for Clerk ID ${userId}. Please log in to the app console first to auto-provision.` }, { status: 404 });
    } else if (userInDb.org_id !== correctOrgId) {
      // Re-align user org_id if it shifted or was mismatched!
      userInDb = await prisma.user.update({
        where: { id: userId },
        data: { org_id: correctOrgId }
      });
      userUpdated = true;
    }

    // 4. SEED templates into this specific verified orgId now!
    const cyberHtml = `
      <div style="background:#050508; color:#e2e8f0; font-family:sans-serif; padding:40px 20px; max-width:600px; margin:0 auto; border:1px solid #1e1b4b; border-radius:12px; box-shadow: 0 10px 30px rgba(124, 92, 255, 0.25);">
        <h1 style="font-size:22px; font-weight:900; text-transform:uppercase; letter-spacing:2px; background: linear-gradient(to right, #7C5CFF, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom:20px;">
          ⚡ SYSTEM DISPATCH // MATRIX
        </h1>
        <div style="background:#0c0c12; border:1px solid #1e1e2e; padding:20px; border-radius:8px; font-family:monospace; color:#a1a1aa; margin-bottom:24px; border-left: 4px solid #7C5CFF;">
          > STATUS: ONLINE<br>
          > ANALYTICS SYNC COMPLETE.<br><br>
          Your quantum analytics pipelines have converged successfully. Enjoy real-time data feeds.
        </div>
        <a href="#" style="display:inline-block; background:#7C5CFF; color:#ffffff; text-decoration:none; font-weight:bold; font-size:13px; padding:12px 24px; border-radius:6px; letter-spacing:1px;">
          ENTER MATRIX →
        </a>
      </div>
    `;

    const saasHtml = `
      <div style="background:#ffffff; color:#09090b; font-family:sans-serif; padding:45px 25px; max-width:550px; margin:0 auto; border-radius:12px; border:1px solid #e4e4e7; box-shadow:0 4px 20px rgba(0,0,0,0.05);">
        <div style="width:32px; height:32px; background:#09090b; border-radius:8px; margin-bottom:28px;"></div>
        <h1 style="font-size:26px; font-weight:800; letter-spacing:-0.5px; margin-bottom:15px; color:#09090b;">
          Beautifully raw analytics.
        </h1>
        <p style="font-size:15px; color:#52525b; line-height:1.6; margin-bottom:25px;">
          Deploy and monitor campaigns with precision telemetry. No fluff, just raw performance.
        </p>
        <a href="#" style="display:block; text-align:center; background:#09090b; color:#ffffff; text-decoration:none; font-weight:600; font-size:14px; padding:12px; border-radius:6px;">
          Launch Dashboard
        </a>
      </div>
    `;

    const aiHtml = `
      <div style="background:#000000; color:#ffffff; font-family:sans-serif; padding:50px 20px; max-width:580px; margin:0 auto; border:1px solid #27272a; border-radius:16px; text-align:center; box-shadow:0 0 30px rgba(59,130,246,0.15);">
        <div style="display:inline-block; padding:5px 12px; border-radius:20px; background:rgba(59, 130, 246, 0.1); border:1px solid rgba(59, 130, 246, 0.2); color:#60a5fa; font-size:10px; font-weight:bold; text-transform:uppercase; letter-spacing:1px; margin-bottom:20px;">
          CO-PILOT ACTIVE
        </div>
        <h1 style="font-size:28px; font-weight:800; margin-bottom:15px; background:linear-gradient(135deg, #fff 0%, #a1a1aa 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
          The era of Predictive Copy is here.
        </h1>
        <p style="color:#a1a1aa; font-size:14px; margin-bottom:30px;">
          Automate variations, predict open rates, and drive high engagement.
        </p>
        <a href="#" style="display:inline-block; background:linear-gradient(90deg, #3b82f6, #7C5CFF); color:white; font-weight:bold; text-decoration:none; padding:12px 28px; border-radius:30px; font-size:13px;">
          Start Mapping
        </a>
      </div>
    `;

    const creatorHtml = `
      <div style="background:#fafaf9; color:#292524; font-family:'Georgia', serif; padding:50px 30px; max-width:550px; margin:0 auto; border:1px solid #e7e5e4;">
        <div style="text-align:center; font-size:12px; font-family:sans-serif; font-weight:800; letter-spacing:3px; border-bottom: 2px solid #292524; padding-bottom:12px; margin-bottom:35px;">
          WEEKLY OBSERVER
        </div>
        <h1 style="font-size:32px; font-style:italic; margin-bottom:20px;">
          The silent power of minimalist interfaces.
        </h1>
        <p style="font-size:16px; line-height:1.8; color:#57534e; margin-bottom:30px;">
          We examine how reducing information density actually amplifies visual importance.
        </p>
        <a href="#" style="font-family:sans-serif; font-weight:bold; color:#292524; font-size:13px; text-decoration:underline;">
          Read Full Essay →
        </a>
      </div>
    `;

    const metricHtml = `
      <div style="background:#09090b; color:#fafafa; font-family:sans-serif; padding:35px; max-width:580px; margin:0 auto; border-radius:8px; border:1px solid #27272a;">
        <div style="font-weight:bold; font-size:12px; color:#a1a1aa; letter-spacing:1px; margin-bottom:25px; border-bottom:1px solid #27272a; padding-bottom:10px;">
          📈 TELEMETRY SUMMARY
        </div>
        <h2 style="font-size:20px; font-weight:700; margin-bottom:20px;">Weekly Dispatch Pulse</h2>
        <div style="background:#18181b; border:1px solid #27272a; padding:15px; border-radius:6px; margin-bottom:15px;">
          <div style="font-size:11px; color:#71717a;">OPEN CONVERSIONS</div>
          <div style="font-size:28px; font-weight:bold; color:#22c55e; font-family:monospace; margin-top:5px;">94.2%</div>
        </div>
        <div style="background:#18181b; border:1px solid #27272a; padding:15px; border-radius:6px; margin-bottom:25px;">
          <div style="font-size:11px; color:#71717a;">CLICK THROUGH</div>
          <div style="font-size:28px; font-weight:bold; color:#3b82f6; font-family:monospace; margin-top:5px;">24.8%</div>
        </div>
        <a href="#" style="display:block; text-align:center; background:#ffffff; color:#000000; text-decoration:none; font-weight:bold; font-size:13px; padding:10px; border-radius:4px;">
          Inspect Metrics Cluster
        </a>
      </div>
    `;

    const templates = [
      { name: "SYSTEM DISPATCH // MATRIX", category: "Futuristic", html: cyberHtml },
      { name: "Obsidian SaaS Upgrade", category: "Minimalist", html: saasHtml },
      { name: "Co-Pilot Neural Reveal", category: "AI Assist", html: aiHtml },
      { name: "The Creator Observer", category: "Editorial", html: creatorHtml },
      { name: "Live Metrics Dashboard", category: "Telemetry", html: metricHtml }
    ];

    let seededCount = 0;
    for (const t of templates) {
      const existing = await prisma.template.findFirst({
        where: { org_id: correctOrgId, name: t.name }
      });
      if (!existing) {
        await prisma.template.create({
          data: {
            org_id: correctOrgId,
            name: t.name,
            category: t.category,
            html: t.html,
            blocks: "[]"
          }
        });
        seededCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Self-Healing Org Alignment Completed Successfully!",
      details: {
        activeClerkUserId: userId,
        targetOrgId: correctOrgId,
        userOrgPreAlign: userInDb.org_id,
        userOrgPostAlign: correctOrgId,
        userUpdated,
        seededTemplatesCount: seededCount
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
