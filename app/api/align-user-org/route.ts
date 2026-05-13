import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let targetOrg = await prisma.organization.findFirst({
      orderBy: { created_at: 'asc' }
    });

    if (!targetOrg) {
      targetOrg = await prisma.organization.create({
        data: { name: "The AI School Workspace" }
      });
    }

    const correctOrgId = targetOrg.id;

    let userInDb = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userInDb) {
      return NextResponse.json({ error: "DB User not found" }, { status: 404 });
    } else if (userInDb.org_id !== correctOrgId) {
      await prisma.user.update({
        where: { id: userId },
        data: { org_id: correctOrgId }
      });
    }

    // ==========================================
    // 🛠️ VALID UNLAYER BLOCK LAYOUTS INJECTION 🛠️
    // ==========================================

    // 1. Futuristic Unlayer Design
    const cyberBlocks = {
      body: {
        rows: [
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: "heading",
                    values: {
                      text: "⚡ SYSTEM DISPATCH // MATRIX",
                      color: "#7C5CFF",
                      textAlign: "center",
                      fontSize: "28px",
                      fontFamily: { label: "Courier New", value: "courier new,courier,monospace" }
                    }
                  },
                  {
                    type: "divider",
                    values: {
                      border: { borderTopWidth: "2px", borderTopStyle: "solid", borderTopColor: "#3b82f6" },
                      padding: "20px 0px"
                    }
                  },
                  {
                    type: "text",
                    values: {
                      color: "#a1a1aa",
                      text: "<p style='font-family: monospace; font-size: 14px;'>> STATUS: ONLINE<br>> TELEMETRY CHANNEL ACTIVATED.<br><br>Welcome to the high-frequency email infrastructure grid.</p>",
                      lineHeight: "150%"
                    }
                  },
                  {
                    type: "button",
                    values: {
                      text: "LAUNCH DATA FLOW",
                      backgroundColor: "#7C5CFF",
                      color: "#ffffff",
                      textAlign: "center",
                      borderRadius: "4px",
                      padding: "12px 25px",
                      fontWeight: "bold",
                      fontSize: "14px"
                    }
                  }
                ],
                values: {
                  backgroundColor: "#0c0c12",
                  padding: "40px"
                }
              }
            ],
            values: {
              backgroundColor: "transparent",
              backgroundImage: { url: "", fullWidth: true, repeat: "no-repeat", size: "cover", position: "center" }
            }
          }
        ],
        values: {
          backgroundColor: "#050508",
          contentWidth: "600px"
        }
      },
      schemaVersion: 14
    };

    // 2. Minimalist SaaS Unlayer Design
    const saasBlocks = {
      body: {
        rows: [
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: "heading",
                    values: {
                      text: "Beautifully raw metrics.",
                      color: "#09090b",
                      textAlign: "left",
                      fontSize: "32px",
                      fontWeight: "800",
                      fontFamily: { label: "Helvetica Neue", value: "'Helvetica Neue', Helvetica, Arial, sans-serif" }
                    }
                  },
                  {
                    type: "text",
                    values: {
                      color: "#52525b",
                      text: "<p style='font-size: 16px;'>Deploy and monitor campaigns with deep pixel-level telemetry and 100% accurate attribution. Real power, zero compromises.</p>",
                      lineHeight: "160%"
                    }
                  },
                  {
                    type: "button",
                    values: {
                      text: "View Analytics Portal",
                      backgroundColor: "#09090b",
                      color: "#ffffff",
                      textAlign: "left",
                      borderRadius: "8px",
                      padding: "14px 28px",
                      fontSize: "14px",
                      fontWeight: "bold"
                    }
                  }
                ],
                values: {
                  backgroundColor: "#ffffff",
                  padding: "50px 30px"
                }
              }
            ],
            values: {
              backgroundColor: "transparent"
            }
          }
        ],
        values: {
          backgroundColor: "#f4f4f5",
          contentWidth: "550px"
        }
      },
      schemaVersion: 14
    };

    // 3. AI Co-Pilot Unlayer Design
    const aiBlocks = {
      body: {
        rows: [
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: "heading",
                    values: {
                      text: "CO-PILOT IS ASSISTING",
                      color: "#3b82f6",
                      textAlign: "center",
                      fontSize: "12px",
                      fontWeight: "bold",
                      fontFamily: { label: "Arial", value: "arial,helvetica,sans-serif" }
                    }
                  },
                  {
                    type: "heading",
                    values: {
                      text: "The era of predictive copy.",
                      color: "#ffffff",
                      textAlign: "center",
                      fontSize: "26px",
                      fontWeight: "bold"
                    }
                  },
                  {
                    type: "text",
                    values: {
                      color: "#a1a1aa",
                      text: "<p style='text-align: center;'>Automatically synthesize multi-variant dispatches, dynamically adjust sending velocity, and forecast target engagement.</p>",
                      lineHeight: "160%"
                    }
                  },
                  {
                    type: "button",
                    values: {
                      text: "EXECUTE NEURAL DISPATCH",
                      backgroundColor: "#3b82f6",
                      color: "#ffffff",
                      textAlign: "center",
                      borderRadius: "20px",
                      padding: "12px 30px"
                    }
                  }
                ],
                values: {
                  backgroundColor: "#000000",
                  padding: "40px"
                }
              }
            ]
          }
        ],
        values: {
          backgroundColor: "#000000",
          contentWidth: "580px"
        }
      },
      schemaVersion: 14
    };

    // 4. Editorial Creator Unlayer Design
    const creatorBlocks = {
      body: {
        rows: [
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: "heading",
                    values: {
                      text: "WEEKLY OBSERVER",
                      color: "#292524",
                      textAlign: "center",
                      fontSize: "12px",
                      letterSpacing: "3px",
                      fontFamily: { label: "Georgia", value: "georgia,times,serif" }
                    }
                  },
                  {
                    type: "divider",
                    values: { border: { borderTopWidth: "2px", borderTopStyle: "solid", borderTopColor: "#292524" } }
                  },
                  {
                    type: "heading",
                    values: {
                      text: "The gentle art of minimal code.",
                      color: "#292524",
                      textAlign: "left",
                      fontSize: "30px",
                      fontStyle: "italic",
                      fontFamily: { label: "Georgia", value: "georgia,times,serif" }
                    }
                  },
                  {
                    type: "text",
                    values: {
                      color: "#57534e",
                      text: "<p style='font-size:16px;'>In today's special installment, we break down the absolute importance of code simplicity, and how architectural discipline leads to exceptional velocity.</p>",
                      lineHeight: "180%",
                      fontFamily: { label: "Georgia", value: "georgia,times,serif" }
                    }
                  }
                ],
                values: {
                  backgroundColor: "#fafaf9",
                  padding: "50px"
                }
              }
            ]
          }
        ],
        values: {
          backgroundColor: "#e7e5e4",
          contentWidth: "580px"
        }
      },
      schemaVersion: 14
    };

    // 5. Metric Grid Unlayer Design
    const metricBlocks = {
      body: {
        rows: [
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: "heading",
                    values: {
                      text: "📈 TELEMETRY SUMMARY",
                      color: "#a1a1aa",
                      textAlign: "left",
                      fontSize: "13px"
                    }
                  },
                  {
                    type: "divider",
                    values: { border: { borderTopWidth: "1px", borderTopStyle: "solid", borderTopColor: "#27272a" } }
                  },
                  {
                    type: "heading",
                    values: {
                      text: "Real-Time Metrics Active",
                      color: "#ffffff",
                      fontSize: "20px"
                    }
                  },
                  {
                    type: "heading",
                    values: {
                      text: "94.2% SUCCESS",
                      color: "#22c55e",
                      fontSize: "28px",
                      fontFamily: { label: "Courier New", value: "courier new,courier,monospace" }
                    }
                  },
                  {
                    type: "button",
                    values: {
                      text: "LAUNCH PIPELINE GRID",
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      borderRadius: "4px",
                      padding: "10px 20px"
                    }
                  }
                ],
                values: {
                  backgroundColor: "#09090b",
                  padding: "40px"
                }
              }
            ]
          }
        ],
        values: {
          backgroundColor: "#000000",
          contentWidth: "600px"
        }
      },
      schemaVersion: 14
    };

    // Raw HTML variants corresponding to above blocks
    const cyberHtml = `<div style="background:#050508; color:#e2e8f0; font-family:sans-serif; padding:40px 20px; max-width:600px; margin:0 auto; border:1px solid #1e1b4b; border-radius:12px;"><h1 style="font-size:24px; color:#7C5CFF; text-align:center;">⚡ SYSTEM DISPATCH</h1><p style="color:#a1a1aa; font-family:monospace;">> STATUS: ONLINE<br>> TELEMETRY CHANNEL ACTIVATED.</p></div>`;
    const saasHtml = `<div style="background:#ffffff; color:#09090b; font-family:sans-serif; padding:45px; max-width:550px; margin:0 auto; border:1px solid #e4e4e7;"><h1>Beautifully raw metrics.</h1><p style="color:#52525b;">Deploy and monitor campaigns with deep telemetry.</p></div>`;
    const aiHtml = `<div style="background:#000000; color:#ffffff; font-family:sans-serif; padding:50px 20px; text-align:center;"><h2>The era of predictive copy.</h2><p style="color:#a1a1aa;">Synthesize multi-variant dispatches dynamically.</p></div>`;
    const creatorHtml = `<div style="background:#fafaf9; color:#292524; font-family:serif; padding:50px; max-width:580px; margin:0 auto;"><h2>The gentle art of minimal code.</h2><p style="color:#57534e;">Architectural discipline leads to exceptional velocity.</p></div>`;
    const metricHtml = `<div style="background:#09090b; color:#ffffff; padding:35px;"><h2 style="color:#22c55e;">94.2% SUCCESS</h2><p>Telemetry pipelines operational.</p></div>`;

    const templatesToCreate = [
      { name: "SYSTEM DISPATCH // MATRIX", category: "Futuristic", html: cyberHtml, blocks: JSON.stringify(cyberBlocks) },
      { name: "Obsidian SaaS Upgrade", category: "Minimalist", html: saasHtml, blocks: JSON.stringify(saasBlocks) },
      { name: "Co-Pilot Neural Reveal", category: "AI Assist", html: aiHtml, blocks: JSON.stringify(aiBlocks) },
      { name: "The Creator Observer", category: "Editorial", html: creatorHtml, blocks: JSON.stringify(creatorBlocks) },
      { name: "Live Metrics Dashboard", category: "Telemetry", html: metricHtml, blocks: JSON.stringify(metricBlocks) }
    ];

    // CLEAR pre-existing blank ones to allow fresh blocks injection!
    await prisma.template.deleteMany({
      where: {
        org_id: correctOrgId,
        name: { in: templatesToCreate.map(t => t.name) }
      }
    });

    let createdCount = 0;
    for (const t of templatesToCreate) {
      await prisma.template.create({
        data: {
          org_id: correctOrgId,
          name: t.name,
          category: t.category,
          html: t.html,
          blocks: t.blocks
        }
      });
      createdCount++;
    }

    return NextResponse.json({
      success: true,
      message: "Block Injection & Multi-Tenant Lock Complete!",
      details: {
        targetOrgId: correctOrgId,
        seededTemplatesWithBlocks: createdCount
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
