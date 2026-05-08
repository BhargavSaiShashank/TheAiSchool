const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding a fresh, clean database for production-ready scratch usage...");

  // 1. Clean existing data
  await prisma.emailEvent.deleteMany({});
  await prisma.campaignSend.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.template.deleteMany({});
  await prisma.segment.deleteMany({});
  await prisma.contactListMember.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.importJob.deleteMany({});
  await prisma.contactList.deleteMany({});
  await prisma.suppressionList.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});

  console.log("All old placeholder and fake data cleared.");

  // 2. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: "PulseSend Inc.",
      logo_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80",
      from_email: "hello@pulsesend.com",
      ses_config_set: "pulsesend-events",
      aws_region: "eu-north-1",
    },
  });

  console.log("Organization created:", org.name);

  // 3. Create Clean Core System Users
  const users = [
    {
      email: "superadmin@pulsesend.com",
      password_hash: "admin123",
      role: "SUPER_ADMIN",
      org_id: org.id,
    },
    {
      email: "manager@pulsesend.com",
      password_hash: "manager123",
      role: "CAMPAIGN_MANAGER",
      org_id: org.id,
    },
    {
      email: "viewer@pulsesend.com",
      password_hash: "viewer123",
      role: "VIEWER",
      org_id: org.id,
    },
  ];

  for (const u of users) {
    await prisma.user.create({ data: u });
  }
  console.log("Clean system users created successfully.");

  // 4. Seeding Premium Starter Email Templates (No campaign sends or historic fake logs)
  const starterTemplates = [
    {
      name: "Welcome Onboard",
      category: "Welcome",
      blocks: JSON.stringify({
        blocks: [
          { type: "header", content: { text: "Welcome to PulseSend", bgColor: "#121212" } },
          { type: "text", content: { text: "<p>Hey <strong>{{first_name}}</strong>,</p><p>We are absolutely thrilled to have you join us at <strong>{{custom.company}}</strong>! Our goal is to make sending beautiful email campaigns as seamless and premium as possible.</p><p>Click the button below to explore your new dashboard and get started:</p>" } },
          { type: "button", content: { label: "Go to Dashboard", url: "https://pulsesend.com", color: "#121212", textColor: "#ffffff", borderRadius: 6, padding: 12 } },
          { type: "spacer", content: { height: 20 } },
          { type: "footer", content: { address: "PulseSend Inc, India", copyright: "© 2026 PulseSend" } }
        ]
      }),
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden; background: #ffffff;">
          <div style="background: #18181b; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Welcome to PulseSend</h1>
          </div>
          <div style="padding: 32px; color: #3f3f46; line-height: 1.6;">
            <p>Hey <strong>{{first_name}}</strong>,</p>
            <p>We are absolutely thrilled to have you join us at <strong>{{custom.company}}</strong>! Our goal is to make sending beautiful email campaigns as seamless and premium as possible.</p>
            <p>Click the button below to explore your new dashboard and get started:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://pulsesend.com" style="background: #18181b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Go to Dashboard</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 32px 0;" />
            <p style="font-size: 12px; color: #71717a; text-align: center; margin: 0;">
              PulseSend Inc, India<br/>
              © 2026 PulseSend. All rights reserved. <br/>
              <a href="/unsubscribe?uid={{uid}}" style="color: #18181b; text-decoration: underline;">Unsubscribe</a>
            </p>
          </div>
        </div>
      `,
    },
    {
      name: "Monthly Tech Newsletter",
      category: "Newsletter",
      blocks: JSON.stringify({
        blocks: [
          { type: "header", content: { text: "PulseSend Newsletter", bgColor: "#18181b" } },
          { type: "text", content: { text: "<h2>May Tech Highlights</h2><p>Welcome to our tech roundup! Here are the top stories for this month:</p><ul><li>AI Agents take over the workspace</li><li>Next.js 15 App Router best practices</li><li>AWS SES sandbox tips</li></ul>" } },
          { type: "button", content: { label: "Read Full Newsletter", url: "https://pulsesend.com/blog", color: "#2563eb", textColor: "#ffffff", borderRadius: 6 } },
          { type: "footer", content: { address: "PulseSend Inc, India", copyright: "© 2026 PulseSend" } }
        ]
      }),
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden; background: #ffffff;">
          <div style="background: #18181b; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px;">PulseSend Newsletter</h1>
          </div>
          <div style="padding: 32px; color: #3f3f46; line-height: 1.6;">
            <h2>May Tech Highlights</h2>
            <p>Welcome to our tech roundup! Here are the top stories for this month:</p>
            <ul>
              <li>AI Agents take over the workspace</li>
              <li>Next.js 15 App Router best practices</li>
              <li>AWS SES sandbox tips</li>
            </ul>
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://pulsesend.com" style="background: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Read Full Newsletter</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 32px 0;" />
            <p style="font-size: 12px; color: #71717a; text-align: center; margin: 0;">
              PulseSend Inc, India<br/>
              © 2026 PulseSend. All rights reserved. <br/>
              <a href="/unsubscribe?uid={{uid}}" style="color: #2563eb; text-decoration: underline;">Unsubscribe</a>
            </p>
          </div>
        </div>
      `,
    },
    {
      name: "Product Promotion",
      category: "Promotional",
      blocks: JSON.stringify({}),
      html: `<div style="padding: 32px; font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 8px;"><h2>Exclusive 50% Off!</h2><p>For {{first_name}}, get 50% off on all PulseSend plans this weekend only.</p><div style="text-align:center;margin:24px;"><a href="#" style="background:#18181b;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;">Claim Offer</a></div><p style="font-size:12px;color:#71717a;text-align:center;"><a href="/unsubscribe?uid={{uid}}">Unsubscribe</a></p></div>`,
    },
    {
      name: "AI Hackathon Event",
      category: "Event Invite",
      blocks: JSON.stringify({}),
      html: `<div style="padding: 32px; font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 8px;"><h2>Join the AI Hackathon!</h2><p>We are hosting a global AI development hackathon on May 12th. Register now to save your spot.</p><div style="text-align:center;margin:24px;"><a href="#" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;">Register Now</a></div><p style="font-size:12px;color:#71717a;text-align:center;"><a href="/unsubscribe?uid={{uid}}">Unsubscribe</a></p></div>`,
    },
    {
      name: "AWS Training Notice",
      category: "Training Notice",
      blocks: JSON.stringify({}),
      html: `<div style="padding: 32px; font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 8px;"><h2>AWS SES Training Workshop</h2><p>Learn how to optimize AWS SES deliverability and bypass sandbox restrictions.</p><div style="text-align:center;margin:24px;"><a href="#" style="background:#0284c7;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;">View Schedule</a></div><p style="font-size:12px;color:#71717a;text-align:center;"><a href="/unsubscribe?uid={{uid}}">Unsubscribe</a></p></div>`,
    }
  ];

  for (const t of starterTemplates) {
    await prisma.template.create({
      data: {
        org_id: org.id,
        ...t,
      },
    });
  }

  console.log("Core Premium Starter templates seeded cleanly.");
  console.log("Database reset complete! Ready for custom usage from scratch.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
