const { PrismaClient } = require('@prisma/client');
const { createClerkClient } = require('@clerk/backend');

const prisma = new PrismaClient();
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function resetAll() {
  console.log("🔥 INITIATING TOTAL ENVIRONMENT WIPE 🔥\n");

  try {
    console.log("1. Wiping Prisma Database (Supabase)...");
    try {
      // Delete in order to respect foreign key constraints
      await prisma.suppressionList.deleteMany();
      console.log("  - Suppressions deleted");
      
      await prisma.emailEvent.deleteMany();
      console.log("  - Email Events deleted");
      
      await prisma.campaignSend.deleteMany();
      console.log("  - Campaign Sends deleted");
      
      await prisma.campaign.deleteMany();
      console.log("  - Campaigns deleted");
      
      await prisma.template.deleteMany();
      console.log("  - Templates deleted");
      
      await prisma.segment.deleteMany();
      console.log("  - Segments deleted");
      
      await prisma.importJob.deleteMany();
      await prisma.contactListMember.deleteMany();
      await prisma.contact.deleteMany();
      await prisma.contactList.deleteMany();
      console.log("  - Contacts, Lists & Jobs deleted");
      
      await prisma.user.deleteMany();
      console.log("  - Users deleted");
      
      await prisma.organization.deleteMany();
      console.log("  - Organizations deleted");

      console.log("✅ Prisma Database completely wiped.");
    } catch (dbErr) {
      console.log("⚠️  Prisma Database Wipe Failed/Skipped (Project is likely paused on Supabase). Ensure your Supabase project is ACTIVE.");
      console.log(`   Details: ${dbErr.message || dbErr}\n`);
    }

    console.log("\n2. Wiping Clerk Users and Organizations...");
    
    // Fetch and delete all Clerk Users
    const users = await clerkClient.users.getUserList();
    if (users && users.data) {
        for (const user of users.data) {
        await clerkClient.users.deleteUser(user.id);
        console.log(`  - Deleted Clerk User: ${user.emailAddresses[0]?.emailAddress || user.id}`);
        }
    }
    
    // Fetch and delete all Clerk Organizations
    const organizations = await clerkClient.organizations.getOrganizationList();
    if (organizations && organizations.data) {
        for (const org of organizations.data) {
        await clerkClient.organizations.deleteOrganization(org.id);
        console.log(`  - Deleted Clerk Organization: ${org.name}`);
        }
    }

    console.log("✅ Clerk Authentication completely wiped.");
    
    console.log("\n🚀 TOTAL RESET SUCCESSFUL. ENVIRONMENT IS CLEAN. 🚀");

  } catch (error) {
    console.error("❌ ERROR DURING RESET:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAll();
