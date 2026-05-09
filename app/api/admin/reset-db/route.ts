import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    console.log("Wiping all sandbox, campaign, and contact data...");

    // Delete in correct order to respect foreign keys
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

    console.log("Database successfully reset!");
    return NextResponse.json({ success: true, message: "All sandbox, campaign, and contact data successfully wiped." });
  } catch (error: any) {
    console.error("Database reset error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
