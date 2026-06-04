import { PrismaClient } from "@prisma/client";
import { createCombinedExtension } from "./prisma-extensions";

const globalForPrisma = globalThis as unknown as {
  rawPrisma: PrismaClient | undefined;
  prisma: ReturnType<typeof buildClient> | undefined;
};

function buildClient() {
  const raw =
    globalForPrisma.rawPrisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  if (process.env.NODE_ENV !== "production") globalForPrisma.rawPrisma = raw;

  return raw.$extends(createCombinedExtension(raw));
}

export const prisma = globalForPrisma.prisma ?? buildClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const rawPrisma: PrismaClient =
  globalForPrisma.rawPrisma ??
  ((): PrismaClient => {
    const raw = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
    if (process.env.NODE_ENV !== "production") globalForPrisma.rawPrisma = raw;
    return raw;
  })();
