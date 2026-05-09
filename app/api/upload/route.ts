import { NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/s3";

export async function POST(req: Request) {
  try {
    const formData = await req.json();
    const { file, fileName, fileType } = formData;

    if (!file) {
      return NextResponse.json({ error: "No file data provided" }, { status: 400 });
    }

    // Unlayer or dropzone uploads sometimes send base64 data strings
    const base64Data = file.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const uploadedUrl = await uploadToS3(
      buffer,
      fileName || "upload.png",
      fileType || "image/png"
    );

    return NextResponse.json({ url: uploadedUrl });
  } catch (error: any) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
