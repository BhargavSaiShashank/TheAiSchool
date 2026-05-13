import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany();
  console.log(`Found ${orgs.length} workspaces to seed...`);

  const starterDesigns = [
    {
      name: "Welcome Aboard (Nebula)",
      category: "Welcome",
      html: `
        <div style="background: #09090b; color: #fafafa; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; border: 1px solid #27272a; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); width: 48px; height: 48px; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);"></span>
            <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; background: linear-gradient(to right, #fafafa, #a1a1aa); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Ignition Complete.</h1>
          </div>
          <div style="background: rgba(39,39,42,0.3); border: 1px solid rgba(255,255,255,0.05); padding: 28px; border-radius: 16px; border-left: 4px solid #a855f7;">
            <p style="font-size: 16px; line-height: 1.6; color: #d4d4d8; margin-top: 0;">Hello <strong>{{first_name}}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6; color: #a1a1aa;">Welcome to <strong>{{custom.company}}</strong>. Your operations environment is now fully initialized. You are cleared to leverage the full power of the automated matrix.</p>
            <div style="text-align: center; margin-top: 32px; margin-bottom: 12px;">
              <a href="https://pulsesend.com/dashboard" style="display: inline-block; background: linear-gradient(to right, #8b5cf6, #6366f1); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);">Initialize Core Console</a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.05);">
            <p style="font-size: 11px; color: #71717a; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;">© 2026 {{custom.company}} // Operational Grid</p>
            <p style="font-size: 11px; color: #52525b; margin-top: 8px;"><a href="/unsubscribe?uid={{uid}}" style="color: #a1a1aa; text-decoration: underline;">Terminate Node Link (Unsubscribe)</a></p>
          </div>
        </div>
      `,
    },
    {
      name: "Tech & Pulse (Modern Editorial)",
      category: "Newsletter",
      html: `
        <div style="background: #f8f9fa; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="background: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 16px; overflow: hidden; border: 1px solid #e9ecef; box-shadow: 0 1px 3px rgba(0,0,0,0.02), 0 20px 40px rgba(0,0,0,0.03);">
            <div style="border-bottom: 1px solid #f1f3f5; padding: 24px 40px; text-align: center;">
              <p style="margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #868e96;">Edition № 42 // Technical Review</p>
            </div>
            <div style="padding: 48px 40px;">
              <h1 style="margin: 0 0 24px 0; font-size: 32px; font-weight: 800; letter-spacing: -1px; line-height: 1.15; color: #1a1d20;">Building deep-state operational systems.</h1>
              <p style="font-size: 16px; line-height: 1.7; color: #495057; margin-bottom: 32px;">In this week's brief, we unpack advanced patterns for resilient real-time syncing, transactional isolation boundaries, and responsive interfaces built for sustained operations.</p>
              <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #212529;">⚡ Highlight Focus:</h3>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #495057;">
                  <li>Distributed event deduplication pipelines</li>
                  <li>CSS-in-JS vs native CSS performance benchmarks</li>
                  <li>Multi-tenant organization partitioning</li>
                </ul>
              </div>
              <a href="#" style="display: inline-block; background: #1a1d20; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 14px 28px; border-radius: 6px; letter-spacing: -0.2px;">Read Full Briefing →</a>
            </div>
            <div style="background: #f8f9fa; padding: 24px 40px; border-top: 1px solid #f1f3f5; text-align: center;">
              <p style="font-size: 12px; color: #adb5bd; margin: 0;">Delivered to {{email}} by Vanguard Editorial.</p>
              <p style="font-size: 12px; color: #adb5bd; margin: 8px 0 0 0;"><a href="/unsubscribe?uid={{uid}}" style="color: #868e96; text-decoration: underline;">Unsubscribe</a></p>
            </div>
          </div>
        </div>
      `,
    },
    {
      name: "CyberFlash Promo (Cyberpunk)",
      category: "Promotional",
      html: `
        <div style="background: #03001c; color: #ffffff; font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #00f2fe; border-radius: 24px; overflow: hidden; box-shadow: 0 0 50px rgba(0, 242, 254, 0.15);">
          <div style="background: linear-gradient(135deg, rgba(0, 242, 254, 0.1) 0%, rgba(79, 172, 254, 0) 100%); padding: 48px 32px; text-align: center;">
            <div style="background: #4facfe; display: inline-block; color: #03001c; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; padding: 6px 16px; border-radius: 100px; margin-bottom: 24px;">Flash Sale // 24H Window</div>
            <h1 style="margin: 0 0 16px 0; font-size: 48px; font-weight: 900; line-height: 0.9; text-transform: uppercase; letter-spacing: -1px; background: linear-gradient(to right, #00f2fe 0%, #4facfe 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Get 50% Off Matrix Tier</h1>
            <p style="font-size: 17px; color: #b4b0d5; line-height: 1.5; max-width: 400px; margin: 0 auto 32px auto;">Unlock absolute speed and complete workspace bounds for a lifetime. Offer ends tonight.</p>
            <div style="background: #0b072b; border: 1px solid rgba(0,242,254,0.3); border-radius: 16px; padding: 24px; margin-bottom: 32px; max-width: 360px; margin-left: auto; margin-right: auto;">
              <div style="text-decoration: line-through; font-size: 16px; color: #5c548e; font-weight: 600;">Original $99/mo</div>
              <div style="font-size: 44px; font-weight: 900; color: #00f2fe; margin: 4px 0;">$49.50<span style="font-size: 18px; color: #b4b0d5; font-weight: 500;">/mo</span></div>
              <div style="font-size: 12px; color: #a78bfa; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Code: HYPERDRIVE</div>
            </div>
            <a href="#" style="display: block; max-width: 280px; margin: 0 auto; background: #00f2fe; color: #03001c; text-align: center; text-decoration: none; font-weight: 800; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; padding: 18px; border-radius: 12px; box-shadow: 0 8px 30px rgba(0, 242, 254, 0.4);">Claim Node Tier</a>
          </div>
          <div style="background: #0b072b; padding: 24px; text-align: center; border-top: 1px solid rgba(0, 242, 254, 0.2);">
            <p style="font-size: 11px; color: #5c548e; margin: 0;">This node alert was sent to {{first_name}}.</p>
            <p style="font-size: 11px; color: #5c548e; margin: 8px 0 0 0;"><a href="/unsubscribe?uid={{uid}}" style="color: #4facfe; text-decoration: underline;">Decline Further Alerts</a></p>
          </div>
        </div>
      `,
    },
    {
      name: "Nexus Event Invite (Glassmorphism)",
      category: "Event Invite",
      html: `
        <div style="background: #0f172a; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
          <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 48px 32px; border-bottom: 1px solid #334155;">
            <div style="text-align: center; margin-bottom: 32px;">
              <span style="font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #38bdf8;">Exclusive Invitation</span>
              <h1 style="margin: 8px 0 0 0; font-size: 36px; font-weight: 900; letter-spacing: -0.5px;">Pulse Horizon '26</h1>
              <p style="margin: 8px 0 0 0; font-size: 16px; color: #94a3b8;">Global Systems Architect Summit</p>
            </div>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 28px; margin-bottom: 32px;">
              <div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 16px; margin-bottom: 16px;">
                <div>
                  <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Date & Time</div>
                  <div style="font-size: 14px; font-weight: 700; margin-top: 4px; color: #f1f5f9;">May 24, 2026 @ 09:00 UTC</div>
                </div>
              </div>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">Join us and 5,000+ elite engineers as we dive deep into edge network topology, serverless data boundaries, and high-density event propagation architectures. Special keynote address by Google Advanced Systems Group.</p>
            </div>
            <div style="text-align: center;">
              <a href="#" style="display: inline-block; background: #ffffff; color: #0f172a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 40px; border-radius: 9999px; box-shadow: 0 10px 15px -3px rgba(255,255,255,0.1);">Secure Virtual Pass</a>
            </div>
          </div>
          <div style="background: #020617; padding: 24px 32px; text-align: center;">
            <p style="font-size: 11px; color: #475569; margin: 0;">Reserved for organization node contacts.</p>
            <p style="font-size: 11px; color: #475569; margin: 6px 0 0 0;"><a href="/unsubscribe?uid={{uid}}" style="color: #64748b; text-decoration: underline;">Unsubscribe</a></p>
          </div>
        </div>
      `,
    },
    {
      name: "Apex Security (Industrial Alert)",
      category: "Training Notice",
      html: `
        <div style="background: #0c0a09; color: #f5f5f4; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; max-width: 600px; margin: 0 auto; border: 1px solid #292524; border-radius: 8px; overflow: hidden;">
          <div style="background: #f97316; color: #0c0a09; padding: 12px 20px; font-weight: 900; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
            ⚠️ SECURITY COMPLIANCE ALERT // ACTION REQUIRED
          </div>
          <div style="padding: 32px 24px;">
            <div style="border-bottom: 1px dashed #292524; padding-bottom: 24px; margin-bottom: 24px;">
              <div style="font-size: 12px; color: #78716c;">STATUS: PENDING_COMPLIANCE</div>
              <div style="font-size: 12px; color: #78716c; margin-top: 4px;">PRIORITY: CRITICAL (LEVEL 1)</div>
            </div>
            <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #f97316; text-transform: uppercase;">Mandatory Security Protocol Training</h2>
            <p style="font-size: 13px; line-height: 1.7; color: #a8a29e; margin-bottom: 24px;">System operations telemetry reveals your node credentials require mandatory re-validation. Complete the secure authentication protocols and emergency handling training module to maintain uninterrupted credential access.</p>
            <div style="background: #1c1917; border: 1px solid #292524; padding: 20px; border-radius: 4px; margin-bottom: 24px;">
              <div style="font-size: 12px; color: #f97316; margin-bottom: 8px; font-weight: bold;">Required Action:</div>
              <div style="font-size: 12px; color: #d6d3d1; line-height: 1.5;">
                > Open the internal security terminal.<br>
                > Authenticate via multi-factor node challenge.<br>
                > Complete the 15-minute assessment simulator.
              </div>
            </div>
            <div style="text-align: left;">
              <a href="#" style="display: inline-block; background: transparent; border: 2px solid #f97316; color: #f97316; font-weight: bold; font-size: 13px; text-decoration: none; padding: 12px 24px; text-transform: uppercase; letter-spacing: 1px;">Initialize Safe Boot Terminal</a>
            </div>
          </div>
          <div style="background: #1c1917; border-top: 1px dashed #292524; padding: 20px 24px; font-size: 11px; color: #57534e;">
            SYSTEM IDENTITY SYNC: {{email}}<br>
            Failure to comply triggers automatic node lock in 48 hours.<br>
            <a href="/unsubscribe?uid={{uid}}" style="color: #78716c; text-decoration: underline; margin-top: 8px; display: inline-block;">Unsubscribe from Security Bulletins</a>
          </div>
        </div>
      `,
    },
  ];

  let totalSeeded = 0;

  for (const org of orgs) {
    console.log(`Seeding for ${org.name}...`);

    // Check current counts to avoid excessive spam
    const existing = await prisma.template.count({ where: { org_id: org.id } });
    if (existing >= 5) {
      console.log(`Skipping ${org.name}, already has ${existing} templates.`);
      continue;
    }

    for (const design of starterDesigns) {
      // Minimal skeleton Unlayer JSON payload representing a simple layout
      const mockBlocks = JSON.stringify({
        counters: { u_column: 1, u_row: 1, u_content_text: 1 },
        body: {
          rows: [
            {
              cells: [1],
              columns: [
                {
                  contents: [
                    {
                      type: "text",
                      values: {
                        containerPadding: "10px",
                        textAlign: "left",
                        lineHeight: "140%",
                        padding: "10px",
                        text: design.html,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        schemaVersion: 16,
      });

      await prisma.template.create({
        data: {
          name: design.name,
          category: design.category,
          org_id: org.id,
          html: design.html,
          blocks: mockBlocks,
        },
      });
      totalSeeded++;
    }
  }

  console.log(`🎉 SUCCESSFULLY SEEDED ${totalSeeded} STARTER TEMPLATES!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
