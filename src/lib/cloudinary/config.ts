export type CloudinaryFolder =
  | "profile_photos"
  | "cover_photos"
  | "post_media"
  | "chat_media";

export interface CloudinaryResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  resourceType: string;
  width?: number;
  height?: number;
  duration?: number;
}

export const uploadToCloudinary = (
  file: File,
  folder: CloudinaryFolder,
  onProgress?: (pct: number) => void
): Promise<CloudinaryResult> => {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
    );
    fd.append("folder", folder);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        const r = JSON.parse(xhr.responseText);
        resolve({
          publicId: r.public_id,
          url: r.url,
          secureUrl: r.secure_url,
          format: r.format,
          resourceType: r.resource_type,
          width: r.width,
          height: r.height,
          duration: r.duration,
        });
      } else {
        reject(new Error("Upload failed"));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Upload error")));
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`
    );
    xhr.send(fd);
  });
};

// Optimized URL generator
export const getOptimizedUrl = (
  publicId: string,
  opts: { w?: number; h?: number; q?: number } = {}
): string => {
  const { w = 800, h, q = 80 } = opts;
  const t = [`f_auto`, `q_${q}`, `w_${w}`, h ? `h_${h}` : "", "c_fill"]
    .filter(Boolean)
    .join(",");
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${t}/${publicId}`;
};
