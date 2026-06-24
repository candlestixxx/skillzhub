import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "mock_access_key",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "mock_secret_key",
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || "skillzhub-mvp-bucket";

export async function generateUploadUrl(key: string, contentType: string = "video/mp4"): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export async function generateDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

import fs from "fs";

/**
 * Uploads a local file directly to S3. Used by the worker after FFmpeg normalization.
 */
export async function uploadLocalFileToS3(localFilePath: string, key: string, contentType: string = "video/mp4"): Promise<void> {
    const fileStream = fs.createReadStream(localFilePath);

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileStream,
        ContentType: contentType,
    });

    try {
        await s3Client.send(command);
    } catch (error) {
        console.error(`Failed to upload ${localFilePath} to S3 at key ${key}`, error);
        throw error;
    }
}
