import { task, logger } from "@trigger.dev/sdk/v3";
import sharp from "sharp";

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

      // convert % to pixels
      const left = Math.floor((payload.x / 100) * imgWidth);
      const top = Math.floor((payload.y / 100) * imgHeight);
      const width = Math.floor((payload.width / 100) * imgWidth);
      const height = Math.floor((payload.height / 100) * imgHeight);

      // validate bounds (prevent crashing if numbers are weird)
      if (width === 0 || height === 0) throw new Error("Invalid dimensions");

      const outputBuffer = await sharp(inputBuffer)
        .extract({ left, top, width, height })
        .toBuffer();

      // return base64 (simplest for MVP display)
      // in a real production app, i would upload this 'outputBuffer' to S3/Supabase and return a URL.
      const base64Image = `data:image/png;base64,${outputBuffer.toString('base64')}`;

      await logger.info("Cropping complete");
      
      return { imageUrl: base64Image };
      
    } catch (error: any) {
      await logger.error("Crop failed", { error });
      throw error;
    }
  },
});
