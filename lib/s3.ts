import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const bucketName = process.env.AWS_S3_BUCKET_NAME || "pulsesend-email-assets";
const region = process.env.AWS_REGION || "eu-north-1";

export const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Uploads a file to AWS S3 and returns its public URL
 */
export async function uploadToS3(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
): Promise<string> {
  const key = `uploads/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
    ACL: "public-read", // allows email clients to publicly download/display the image
  });

  await s3Client.send(command);

  // Return the public S3 URL of the uploaded asset
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}
