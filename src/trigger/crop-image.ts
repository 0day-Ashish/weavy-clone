import { task, logger } from "@trigger.dev/sdk/v3";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 Client
const s3 = new S3Client({
  region: process.env.S3_REGION!,
  endpoint: process.env.S3_ENDPOINT!, 
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

export const cropImageTask = task({
  id: "crop-image",
  run: async (payload: { imageUrl: string; x: number; y: number; width: number; height: number }, { ctx }) => {
    
    await logger.info("Cropping started", { payload });

    try {
      const response = await fetch(payload.imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);

      const metadata = await sharp(inputBuffer).metadata();
      const imgWidth = metadata.width || 0;
      const imgHeight = metadata.height || 0;

      const left = Math.floor((payload.x / 100) * imgWidth);
      const top = Math.floor((payload.y / 100) * imgHeight);
      const width = Math.floor((payload.width / 100) * imgWidth);
      const height = Math.floor((payload.height / 100) * imgHeight);

      if (width === 0 || height === 0) throw new Error("Invalid dimensions");

      const outputBuffer = await sharp(inputBuffer)
        .extract({ left, top, width, height })
        .toBuffer();

      const fileName = `cropped-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
      
      await s3.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: fileName,
        Body: outputBuffer,
        ContentType: "image/png",
      }));

      let publicUrl = "";
      if (process.env.S3_ENDPOINT?.includes("supabase")) {
         const baseUrl = process.env.S3_ENDPOINT.replace("/s3", "/object/public");
         publicUrl = `${baseUrl}/${process.env.S3_BUCKET_NAME}/${fileName}`;
      } else {
         publicUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${fileName}`;
      }

      await logger.info("Cropping complete", { publicUrl });
      
      return { imageUrl: publicUrl };
      
    } catch (error: any) {
      await logger.error("Crop failed", { error });
      throw error;
    }
  },
});
