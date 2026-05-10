const { PrismaClient } = require("@prisma/client");

const OLD_URL = "postgresql://postgres.echmfpmtvuktwxhyiviy:jkUsH57pfHxmiGJs@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const NEW_URL = "postgresql://postgres:iamvibecoder%40123@db.crookspuisiuiujolegj.supabase.co:5432/postgres";

async function verify() {
  console.log("🔍 AUDITING BOTH DATABASES FOR PERFECT ALIGNMENT...");
  
  const oldP = new PrismaClient({ datasources: { db: { url: OLD_URL } } });
  const newP = new PrismaClient({ datasources: { db: { url: NEW_URL } } });

  try {
    const tables = [
      'organization', 'user', 'contact', 'contactList', 
      'template', 'campaign', 'campaignSend', 'emailEvent'
    ];

    console.log("\nTABLE COMPARISON:");
    console.log("----------------------------------------------------");
    console.log("Table Name\t\t| Old Count\t| New Count\t| Status");
    console.log("----------------------------------------------------");

    for (const table of tables) {
       const oldCount = await oldP[table].count();
       const newCount = await newP[table].count();
       const status = oldCount === newCount ? "✅ MATCH" : "❌ MISMATCH";
       
       console.log(`${table.padEnd(20)}\t| ${oldCount}\t\t| ${newCount}\t\t| ${status}`);
    }
    console.log("----------------------------------------------------");

  } catch (e) {
    console.error("Audit failed:", e.message);
  } finally {
    await oldP.$disconnect();
    await newP.$disconnect();
  }
}

verify();
