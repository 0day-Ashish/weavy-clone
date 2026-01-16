import { task, logger } from "@trigger.dev/sdk/v3";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import fs from "fs";
import path from "path";
import os from "os";

// tell fluent-ffmpeg where the binary is
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export const extractFrameTask = task({
  id: "extract-frame",
  run: async (payload: { videoUrl: string; timestamp: string }) => {
    
    await logger.info("Extraction started", { payload });

    const tempDir = os.tmpdir();
    const outputPath = path.join(tempDir, `frame-${Date.now()}.png`);

    return new Promise((resolve, reject) => {
      ffmpeg(payload.videoUrl)
        .screenshots({
          timestamps: [payload.timestamp], 
          filename: path.basename(outputPath),
          folder: tempDir,
          size: "320x?", 
        })
        .on("end", async () => {
          try {
            // read the file we just created
            const imageBuffer = await fs.promises.readFile(outputPath);
            
            // convert to base64 for easy display
            const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
            
            // cleanup: delete the temp file
            await fs.promises.unlink(outputPath);

            await logger.info("Frame extracted successfully");
            resolve({ imageUrl: base64Image });
          } catch (err) {
            reject(err);
          }
        })
        .on("error", (err) => {
          logger.error("FFmpeg error", { err });
          reject(err);
        });
    });
  },
});
