import { v2 as cloudinary } from "cloudinary";

import { env } from "../config/env.ts";

// Cloudinary hosts user avatars (and recipe images). Configured here and ready
// for the upload endpoints; credentials come from the environment.
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Upload an in-memory image buffer (from multer memoryStorage) and return its
// secure URL. No temp files touch disk.
export const uploadImageBuffer = (buffer: Buffer, folder: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error || !result) return reject(error ?? new Error("Upload failed"));
      resolve(result.secure_url);
    });
    stream.end(buffer);
  });

export default cloudinary;
