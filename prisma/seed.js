const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Simplified password hash for seed (we can use direct string since our login handler will support it or simple compare)
const PASSWORD_HASH = "admin123_hashed"; // In a real app we'd use bcrypt, but simple mock is fine for local sandbox

async function main() {
  console.log("Seeding database...");

  // Clean existing data
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

  console.log("Existing data cleared.");

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: "PulseSend Inc.",
      logo_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80",
      from_email: "hello@pulsesend.com",
      ses_config_set: "pulsesend-events",
      aws_region: "us-east-1",
    },
  });

  console.log("Organization created:", org.name);

  // 2. Create Users
  const users = [
    {
      email: "superadmin@pulsesend.com",
      password_hash: "admin123", // Using simple passwords for testing
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
  console.log("Users seeded.");

  // 3. Create Contact Lists
  const listA = await prisma.contactList.create({
    data: {
      org_id: org.id,
      name: "SaaS Innovators",
      description: "Early adopters and SaaS founders",
      tags: "SaaS,Founders,Tech",
    },
  });

  const listB = await prisma.contactList.create({
    data: {
      org_id: org.id,
      name: "Monthly Newsletter",
      description: "General monthly marketing newsletter list",
      tags: "Newsletter,Marketing",
    },
  });

  console.log("Contact lists created.");

  // 4. Create Contacts
  const mockContacts = [
    { email: "aravind.k@theaischool.co", first_name: "Aravind", last_name: "Kumar", status: "active", source: "import", custom_fields: JSON.stringify({ company: "The AI School", city: "Hyderabad", jobTitle: "Director" }) },
    { email: "priya.sharma@techcorp.com", first_name: "Priya", last_name: "Sharma", status: "active", source: "form", custom_fields: JSON.stringify({ company: "TechCorp", city: "Bangalore", jobTitle: "Product Lead" }) },
    { email: "john.doe@example.com", first_name: "John", last_name: "Doe", status: "active", source: "manual", custom_fields: JSON.stringify({ company: "Example Inc.", city: "Chennai", jobTitle: "Engineer" }) },
    { email: "jane.smith@example.com", first_name: "Jane", last_name: "Smith", status: "active", source: "manual", custom_fields: JSON.stringify({ company: "Acme Corp", city: "Hyderabad", jobTitle: "CEO" }) },
    { email: "vikram.r@ventures.io", first_name: "Vikram", last_name: "Reddy", status: "unsubscribed", source: "import", custom_fields: JSON.stringify({ company: "Reddy Ventures", city: "Hyderabad", jobTitle: "Partner" }) },
    { email: "bounced-user@badhost.com", first_name: "Bounced", last_name: "Contact", status: "bounced", source: "api", custom_fields: JSON.stringify({ company: "Bad Host", city: "Delhi", jobTitle: "Developer" }) },
    { email: "complained-user@spamfilter.com", first_name: "Spam", last_name: "Reporter", status: "complained", source: "import", custom_fields: JSON.stringify({ company: "Spam Filter", city: "Mumbai", jobTitle: "Admin" }) },
    { email: "rahul.nair@innovate.co", first_name: "Rahul", last_name: "Nair", status: "active", source: "import", custom_fields: JSON.stringify({ company: "Innovate Ltd", city: "Chennai", jobTitle: "CTO" }) },
    { email: "sneha.patel@designers.in", first_name: "Sneha", last_name: "Patel", status: "active", source: "form", custom_fields: JSON.stringify({ company: "Designers Studio", city: "Ahmedabad", jobTitle: "UX Lead" }) },
    { email: "amit.sen@financehub.com", first_name: "Amit", last_name: "Sen", status: "active", source: "api", custom_fields: JSON.stringify({ company: "FinanceHub", city: "Kolkata", jobTitle: "Analyst" }) },
  ];

  const contactsInDb = [];
  for (const c of mockContacts) {
    const createdContact = await prisma.contact.create({
      data: {
        org_id: org.id,
        ...c,
      },
    });
    contactsInDb.push(createdContact);

    // Add active / unsubscribed contacts to list memberships
    if (c.status === "active" || c.status === "unsubscribed") {
      await prisma.contactListMember.create({
        data: {
          contact_id: createdContact.id,
          list_id: listA.id,
        },
      });

      // Also add some to Newsletter List B
      if (Math.random() > 0.3) {
        await prisma.contactListMember.create({
          data: {
            contact_id: createdContact.id,
            list_id: listB.id,
          },
        });
      }
    }
  }

  console.log("Contacts seeded & added to lists.");

  // 5. Seed Suppression List
  await prisma.suppressionList.create({
    data: {
      org_id: org.id,
      email: "bounced-user@badhost.com",
      reason: "bounced",
      suppressed_at: new Date(),
      manually_added: false,
      audit_log: JSON.stringify([{ action: "suppressed", reason: "hard bounce detected by SES simulation", timestamp: new Date() }]),
    },
  });

  await prisma.suppressionList.create({
    data: {
      org_id: org.id,
      email: "complained-user@spamfilter.com",
      reason: "complained",
      suppressed_at: new Date(),
      manually_added: false,
      audit_log: JSON.stringify([{ action: "suppressed", reason: "spam complaint detected by SNS webhook", timestamp: new Date() }]),
    },
  });

  console.log("Suppression list seeded.");

  // 6. Create Segment
  const HyderabadSegment = await prisma.segment.create({
    data: {
      org_id: org.id,
      name: "Hyderabad Founders",
      rules: JSON.stringify({
        condition: "AND",
        rules: [
          { field: "city", operator: "equals", value: "Hyderabad" },
          { field: "status", operator: "equals", value: "active" },
        ],
      }),
    },
  });

  console.log("Segment created.");

  // 7. Templates Seed (HTML & Blocks)
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
          { type: "footer", content: { address: "PulseSend Inc, Hyderabad, India", copyright: "© 2026 PulseSend" } }
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
              PulseSend Inc, Hyderabad, India<br/>
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
          { type: "footer", content: { address: "PulseSend Inc, Hyderabad, India", copyright: "© 2026 PulseSend" } }
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
              PulseSend Inc, Hyderabad, India<br/>
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

  const templatesInDb = [];
  for (const t of starterTemplates) {
    const createdTemplate = await prisma.template.create({
      data: {
        org_id: org.id,
        ...t,
      },
    });
    templatesInDb.push(createdTemplate);
  }

  console.log("Templates seeded.");

  // 8. Campaigns & Sends with historic activity to generate rich visual graphs
  const campaignA = await prisma.campaign.create({
    data: {
      org_id: org.id,
      name: "Welcome Onboarding Campaign",
      subject: "Welcome to PulseSend - Let's send emails!",
      preview_text: "Get started with your premium campaign manager today.",
      from_name: "PulseSend Onboarding",
      from_email: "hello@pulsesend.com",
      status: "sent",
      template_id: templatesInDb[0].id,
      scheduled_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  });

  const campaignB = await prisma.campaign.create({
    data: {
      org_id: org.id,
      name: "May Product Newsletter",
      subject: "PulseSend Monthly Roundup: Dynamic Templates & Analytics",
      preview_text: "Explore our premium drag and drop templates",
      from_name: "PulseSend Marketing",
      from_email: "newsletter@pulsesend.com",
      status: "sent",
      template_id: templatesInDb[1].id,
      scheduled_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
  });

  const campaignC = await prisma.campaign.create({
    data: {
      org_id: org.id,
      name: "Summer Promotion Blast",
      subject: "Summer Sale: 50% Off Premium Plans",
      preview_text: "Upgrade your account and unlock unlimited sending capabilities.",
      from_name: "PulseSend Team",
      from_email: "deals@pulsesend.com",
      status: "draft",
      template_id: templatesInDb[2].id,
    },
  });

  console.log("Campaigns seeded.");

  // 9. Generate historic analytics data (opens, clicks, bounces)
  // Campaign A Analytics (Welcome Campaign) - Sent to 6 active contacts
  const activeContacts = contactsInDb.filter(c => c.status === "active" || c.status === "unsubscribed");
  
  for (const contact of activeContacts) {
    const send = await prisma.campaignSend.create({
      data: {
        campaign_id: campaignA.id,
        contact_id: contact.id,
        status: "delivered",
        sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    });

    // Seed events
    await prisma.emailEvent.create({
      data: {
        contact_id: contact.id,
        campaign_id: campaignA.id,
        event_type: "sent",
        occurred_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.emailEvent.create({
      data: {
        contact_id: contact.id,
        campaign_id: campaignA.id,
        event_type: "delivered",
        occurred_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 5000),
      },
    });

    // 80% open rate simulation
    if (Math.random() < 0.8) {
      await prisma.emailEvent.create({
        data: {
          contact_id: contact.id,
          campaign_id: campaignA.id,
          event_type: "opened",
          occurred_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 3600 * 1000 * Math.random()),
          ip: "157.45.12.18",
          user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        },
      });

      // 40% click rate simulation
      if (Math.random() < 0.4) {
        await prisma.emailEvent.create({
          data: {
            contact_id: contact.id,
            campaign_id: campaignA.id,
            event_type: "clicked",
            occurred_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 7200 * 1000 * Math.random()),
            ip: "157.45.12.18",
            user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
            metadata: JSON.stringify({ url: "https://pulsesend.com" }),
          },
        });
      }
    }
  }

  // Campaign B Analytics (Newsletter) - Sent to 6 contacts
  for (const contact of activeContacts) {
    const send = await prisma.campaignSend.create({
      data: {
        campaign_id: campaignB.id,
        contact_id: contact.id,
        status: "delivered",
        sent_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.emailEvent.create({
      data: {
        contact_id: contact.id,
        campaign_id: campaignB.id,
        event_type: "sent",
        occurred_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.emailEvent.create({
      data: {
        contact_id: contact.id,
        campaign_id: campaignB.id,
        event_type: "delivered",
        occurred_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 3000),
      },
    });

    // 60% open rate
    if (Math.random() < 0.6) {
      await prisma.emailEvent.create({
        data: {
          contact_id: contact.id,
          campaign_id: campaignB.id,
          event_type: "opened",
          occurred_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 4000 * 1000 * Math.random()),
          ip: "103.41.92.110",
          user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 Chrome/120.0.0.0 Mobile Safari/537.36",
        },
      });

      // 20% click rate
      if (Math.random() < 0.2) {
        await prisma.emailEvent.create({
          data: {
            contact_id: contact.id,
            campaign_id: campaignB.id,
            event_type: "clicked",
            occurred_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 8000 * 1000 * Math.random()),
            ip: "103.41.92.110",
            user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 Chrome/120.0.0.0 Mobile Safari/537.36",
            metadata: JSON.stringify({ url: "https://pulsesend.com/blog" }),
          },
        });
      }
    }
  }

  // Create some simulated bounce and complaint sends
  const badContact = contactsInDb.find(c => c.status === "bounced");
  if (badContact) {
    await prisma.campaignSend.create({
      data: {
        campaign_id: campaignA.id,
        contact_id: badContact.id,
        status: "bounced",
        sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.emailEvent.create({
      data: {
        contact_id: badContact.id,
        campaign_id: campaignA.id,
        event_type: "bounced",
        occurred_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 10000),
        metadata: JSON.stringify({ reason: "550 5.1.1 User Unknown" }),
      },
    });
  }

  const spamContact = contactsInDb.find(c => c.status === "complained");
  if (spamContact) {
    await prisma.campaignSend.create({
      data: {
        campaign_id: campaignA.id,
        contact_id: spamContact.id,
        status: "complained",
        sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.emailEvent.create({
      data: {
        contact_id: spamContact.id,
        campaign_id: campaignA.id,
        event_type: "complained",
        occurred_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 15000),
        metadata: JSON.stringify({ reason: "Spam complaint received from recipient ISP" }),
      },
    });
  }

  console.log("Analytics events seeded.");
  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
