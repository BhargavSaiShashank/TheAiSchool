import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId, orgId } = await auth();
    
    const dbUsers = await prisma.user.findMany({
      take: 5,
      select: { id: true, org_id: true, role: true }
    });

    const activeUserInDb = userId ? await prisma.user.findUnique({
      where: { id: userId }
    }) : null;

    const allOrgs = await prisma.organization.findMany({
      select: { id: true, name: true }
    });

    const templateCounts = await prisma.template.groupBy({
      by: ['org_id'],
      _count: { id: true }
    });

    const allTemplates = await prisma.template.findMany({
      select: { id: true, name: true, org_id: true },
      take: 10
    });

    return NextResponse.json({
      clerkSession: { userId, orgId },
      activeUserInDb: activeUserInDb ? { id: activeUserInDb.id, org_id: activeUserInDb.org_id } : null,
      allOrganizations: allOrgs,
      templateGroups: templateCounts,
      sampleTemplates: allTemplates,
      allUsers: dbUsers
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
