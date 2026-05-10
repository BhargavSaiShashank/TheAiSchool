const { PrismaClient } = require("@prisma/client");
const OLD_URL = "postgresql://postgres.echmfpmtvuktwxhyiviy:jkUsH57pfHxmiGJs@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const NEW_URL = "postgresql://postgres:iamvibecoder%40123@db.crookspuisiuiujolegj.supabase.co:5432/postgres";

async function patch() {
  const oldP = new PrismaClient({ datasources: { db: { url: OLD_URL } } });
  const newP = new PrismaClient({ datasources: { db: { url: NEW_URL } } });

  try {
    console.log("Migrating final Campaign data...");
    const campaigns = await oldP.campaign.findMany();
    if (campaigns.length > 0) {
      await newP.campaign.createMany({ data: campaigns });
      console.log(`✅ Migrated ${campaigns.length} missing campaigns!`);
    }
  } catch (e) {
    console.error("Patch failed:", e.message);
  } finally {
    await oldP.$disconnect();
    await newP.$disconnect();
  }
}
patch();
