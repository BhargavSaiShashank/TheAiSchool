const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const contact = await prisma.contact.findFirst();
  console.log("CONTACT_ID:", contact ? contact.id : "none");
  await prisma.$disconnect();
}
main();
