const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Initializing full database wipe...");

  try {
    // Delete all table records in safe dependency order
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

    console.log("✅ Database successfully wiped! All tables are now completely empty.");
  } catch (error) {
    console.error("❌ Database wipe failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
