import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const s3 = s3Client;

/**
 * Uploads a file buffer directly to the configured AWS S3 Bucket
 * making it publicly readable for email clients.
 */
export async function uploadToS3(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const bucketName = process.env.AWS_S3_BUCKET_NAME || "pulsesend-email-assets";
  const region = process.env.AWS_REGION || "eu-north-1";

  // Create clean, unique file path key
  const uniqueKey = `assets/${Date.now()}-${fileName.replace(/\s+/g, "_")}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueKey,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: "public-read", // Allow public reading of images in emails
    })
  );

  // Return public URL of the uploaded image asset
  return `https://${bucketName}.s3.${region}.amazonaws.com/${uniqueKey}`;
}
