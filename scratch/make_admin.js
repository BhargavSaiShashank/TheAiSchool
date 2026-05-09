const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Upgrading user role...");
  const user = await prisma.user.findFirst({
    where: { email: { contains: "shashank" } }
  });

  if (user) {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: "SUPER_ADMIN" }
    });
    console.log(`Successfully upgraded ${updated.email} to SUPER_ADMIN!`);
  } else {
    console.log("User not found!");
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
