const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Fetching all templates from the database...");
  const templates = await prisma.template.findMany();
  console.log(`Found ${templates.length} templates:`);
  for (const t of templates) {
    console.log(`- ID: ${t.id} | Name: "${t.name}" | Category: "${t.category}" | Has HTML: ${!!t.html}`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
