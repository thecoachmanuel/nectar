/**
 * Normalizes image URLs so MongoDB GridFS uploads (/api/files/...) always resolve
 * reliably across all domains, local IPs, and production deployments without broken hostnames.
 */
export function normalizeImageUrl(url?: string | null, fallback = ""): string {
  if (!url || typeof url !== "string") return fallback;

  const trimmed = url.trim();
  if (!trimmed) return fallback;

  // Already a relative path, data URI, or blob URL
  if (trimmed.startsWith("/") || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  // If it points to an /api/files/ upload, strip any hardcoded origin (e.g. http://localhost:3000/api/files/...)
  const fileIdx = trimmed.indexOf("/api/files/");
  if (fileIdx !== -1) {
    return trimmed.substring(fileIdx);
  }

  // Otherwise return full URL (e.g., Cloudinary, S3, external CDN)
  return trimmed;
}
