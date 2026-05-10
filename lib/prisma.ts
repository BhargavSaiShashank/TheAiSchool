import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// High-resilience lazy-loader for Prisma Client to prevent top-level import crashes on Vercel
const getPrismaClient = () => {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  if (!process.env.DATABASE_URL) {
    console.error("❌ FATAL CONFIGURATION ERROR: DATABASE_URL environment variable is ABSENT!");
    // DO NOT throw here, allowing system diagnostics to pick it up downstream in handler catch blocks!
  }

  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
};

export const prisma = getPrismaClient();
