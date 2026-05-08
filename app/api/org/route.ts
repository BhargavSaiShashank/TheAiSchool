import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");

    let org = null;
    if (orgId && orgId !== "undefined") {
      org = await prisma.organization.findUnique({
        where: { id: orgId },
      });
    }

    if (!org) {
      org = await prisma.organization.findFirst();
    }

    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: "The AI School",
          from_email: "hello@pulsesend.com",
          aws_region: "us-east-1",
          ses_config_set: "pulsesend-events",
        },
      });
    }

    return NextResponse.json({
      name: org.name,
      fromEmail: org.from_email || "",
      region: org.aws_region || "us-east-1",
      configSet: org.ses_config_set || "",
    });
  } catch (error: any) {
    console.error("GET /api/org error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, fromEmail, region, configSet, orgId } = body;

    let org = null;
    if (orgId && orgId !== "undefined") {
      org = await prisma.organization.findUnique({
        where: { id: orgId },
      });
    }

    if (!org) {
      org = await prisma.organization.findFirst();
    }

    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: name || "The AI School",
          from_email: fromEmail || "",
          aws_region: region || "us-east-1",
          ses_config_set: configSet || "",
        },
      });
    } else {
      org = await prisma.organization.update({
        where: { id: org.id },
        data: {
          name: name ?? org.name,
          from_email: fromEmail ?? org.from_email,
          aws_region: region ?? org.aws_region,
          ses_config_set: configSet ?? org.ses_config_set,
        },
      });
    }

    return NextResponse.json({
      name: org.name,
      fromEmail: org.from_email || "",
      region: org.aws_region || "us-east-1",
      configSet: org.ses_config_set || "",
    });
  } catch (error: any) {
    console.error("POST /api/org error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
