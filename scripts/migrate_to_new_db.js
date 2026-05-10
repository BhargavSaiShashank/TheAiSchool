const { PrismaClient } = require("@prisma/client");

const OLD_URL = "postgresql://postgres.echmfpmtvuktwxhyiviy:jkUsH57pfHxmiGJs@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const NEW_URL = "postgresql://postgres:iamvibecoder%40123@db.crookspuisiuiujolegj.supabase.co:5432/postgres";

async function migrate() {
  console.log("🚀 Starting Zero-Downtime Cross-Region Data Migration...");
  
  const oldPrisma = new PrismaClient({
    datasources: { db: { url: OLD_URL } },
  });

  const newPrisma = new PrismaClient({
    datasources: { db: { url: NEW_URL } },
  });

  try {
    // 1. READ EVERYTHING FROM TOKYO (OLD)
    console.log("📥 Step 1: Extracting current dataset from Tokyo...");
    const orgs = await oldPrisma.organization.findMany();
    const users = await oldPrisma.user.findMany();
    const lists = await oldPrisma.contactList.findMany();
    const templates = await oldPrisma.template.findMany();
    const contacts = await oldPrisma.contact.findMany();
    
    console.log(`✅ Found: ${orgs.length} Orgs, ${users.length} Users, ${contacts.length} Contacts.`);

    // 2. WIPE DESTINATION (JUST IN CASE)
    console.log("🧹 Cleaning destination...");
    await newPrisma.contact.deleteMany();
    await newPrisma.template.deleteMany();
    await newPrisma.contactList.deleteMany();
    await newPrisma.user.deleteMany();
    await newPrisma.organization.deleteMany();

    // 3. WRITE EVERYTHING TO MUMBAI (NEW)
    console.log("📤 Step 2: Injecting records into localized cluster...");
    
    if (orgs.length > 0) {
       await newPrisma.organization.createMany({ data: orgs });
       console.log("   - Migrated Organizations");
    }

    if (users.length > 0) {
      await newPrisma.user.createMany({ data: users });
      console.log("   - Migrated Users");
    }

    if (lists.length > 0) {
      await newPrisma.contactList.createMany({ data: lists });
      console.log("   - Migrated Lists");
    }

    if (templates.length > 0) {
      await newPrisma.template.createMany({ data: templates });
      console.log("   - Migrated Templates");
    }

    if (contacts.length > 0) {
      await newPrisma.contact.createMany({ data: contacts });
      console.log("   - Migrated Contacts");
    }

    console.log("\n🎉 MIGRATION COMPLETE! New Database is fully populated.");

  } catch (error) {
    console.error("❌ Migration failed critical error:", error.message);
  } finally {
    await oldPrisma.$disconnect();
    await newPrisma.$disconnect();
  }
}

migrate();
