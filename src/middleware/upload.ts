import multer from "multer";
import createHttpError from "http-errors";

// In-memory upload for images that are streamed straight to Cloudinary
// (avatars, recipe photos). No temp files touch disk. Wired up for later use.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(createHttpError(400, "Only image files are allowed"));
    }
  },
});

export const uploadSingle = (field: string) => upload.single(field);

export default upload;
