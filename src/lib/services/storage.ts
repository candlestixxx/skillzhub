import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
let s3Client: S3Client | null = null

function hasStorageConfig() {
  return Boolean(process.env.AWS_BUCKET_NAME && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
}

function getS3Client() {
  if (!s3Client) {
    if (!hasStorageConfig()) {
      throw new Error("S3 configuration missing")
    }

    s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  }

  return s3Client
}

export async function generateUploadUrl(key: string, contentType: string = "video/mp4"): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(getS3Client(), command, { expiresIn: 3600 });
}

export async function generateDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME!,
    Key: key,
  });

  return await getSignedUrl(getS3Client(), command, { expiresIn: 3600 });
}

export async function objectExists(key: string): Promise<boolean> {
  if (!hasStorageConfig()) {
    return true
  }

  try {
    await getS3Client().send(new HeadObjectCommand({ Bucket: BUCKET_NAME!, Key: key }))
    return true
  } catch {
    return false
  }
}
