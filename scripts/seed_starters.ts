import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany();
  console.log(`Found ${orgs.length} workspaces to seed...`);

  const starterDesigns = [
    {
      name: "Welcome Aboard",
      category: "Welcome",
      html: "<h1>Welcome to our community!</h1><p>We're thrilled to have you here.</p>",
    },
    {
      name: "Monthly Newsletter",
      category: "Newsletter",
      html: "<h2>This Month's Updates</h2><p>Check out the latest news inside.</p>",
    },
    {
      name: "Flash Sale! 24 Hours",
      category: "Promotional",
      html: "<h1>50% OFF EVERYTHING</h1><p>Limited time offer, click now!</p>",
    },
    {
      name: "Product Launch Event",
      category: "Event Invite",
      html: "<h2>Join us for the big reveal</h2><p>RSVP below to secure your spot.</p>",
    },
    {
      name: "System Training Notice",
      category: "Training Notice",
      html: "<h3>Mandatory System Walkthrough</h3><p>Log in tomorrow for mandatory induction.</p>",
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
          html: `<html><body>${design.html}</body></html>`,
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
