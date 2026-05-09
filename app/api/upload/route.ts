import { NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/s3";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Stream upload directly to S3
    const publicUrl = await uploadToS3(buffer, file.name, file.type);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error("POST /api/upload S3 upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file to S3" }, { status: 500 });
  }
}
