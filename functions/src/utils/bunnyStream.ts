import crypto from "crypto";

/**
 * Bunny Stream Service Helper Utility
 * Interacts with Bunny Stream REST API and signs player embed URLs.
 * All API keys and Token Auth keys MUST remain server-side inside Firebase Functions.
 */

function getEnvVars() {
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  const tokenKey = process.env.BUNNY_TOKEN_AUTH_KEY;

  if (!libraryId || !apiKey) {
    throw new Error("Missing BUNNY_LIBRARY_ID or BUNNY_STREAM_API_KEY environment variables.");
  }

  return { libraryId, apiKey, tokenKey };
}

export interface BunnyVideoMetadata {
  guid: string;
  title: string;
  length: number; // duration in seconds
  width: number;
  height: number;
  status: number; // 4 = finished / ready, 5 = failed
}

/**
 * Creates a video entry in Bunny Stream video library.
 * Returns the generated videoGuid.
 */
export async function createBunnyVideo(title: string): Promise<string> {
  const { libraryId, apiKey } = getEnvVars();

  const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
    method: "POST",
    headers: {
      AccessKey: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to create Bunny video (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as { guid: string };
  return data.guid;
}

/**
 * Uploads a video binary file buffer to Bunny Stream for a specific videoGuid.
 */
export async function uploadBunnyVideo(videoGuid: string, fileBuffer: Buffer): Promise<void> {
  const { libraryId, apiKey } = getEnvVars();

  const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoGuid}`, {
    method: "PUT",
    headers: {
      AccessKey: apiKey,
      "Content-Type": "application/octet-stream",
    },
    body: new Uint8Array(fileBuffer),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to upload Bunny video (${response.status}): ${errText}`);
  }
}

/**
 * Deletes a video from Bunny Stream video library.
 */
export async function deleteBunnyVideo(videoGuid: string): Promise<void> {
  const { libraryId, apiKey } = getEnvVars();

  const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoGuid}`, {
    method: "DELETE",
    headers: {
      AccessKey: apiKey,
    },
  });

  if (!response.ok && response.status !== 404) {
    const errText = await response.text();
    console.error(`Failed to delete Bunny video ${videoGuid} (${response.status}): ${errText}`);
  }
}

/**
 * Fetches video metadata (duration, width, height, encoding status) from Bunny Stream.
 */
export async function getBunnyVideoMetadata(videoGuid: string): Promise<BunnyVideoMetadata> {
  const { libraryId, apiKey } = getEnvVars();

  const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoGuid}`, {
    method: "GET",
    headers: {
      AccessKey: apiKey,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to fetch Bunny video metadata (${response.status}): ${errText}`);
  }

  return (await response.json()) as BunnyVideoMetadata;
}

/**
 * Generates a SHA256 token-signed player embed URL for secure video playback.
 * Default expiration is 3600 seconds (1 hour).
 */
export function generateSignedEmbedUrl(videoGuid: string, expirationSeconds: number = 3600): string {
  const { libraryId, tokenKey } = getEnvVars();

  if (!tokenKey) {
    // If token key is not configured, fallback to unsigned embed URL for dev
    console.warn("BUNNY_TOKEN_AUTH_KEY is missing; falling back to unsigned embed URL.");
    return `https://player.mediadelivery.net/embed/${libraryId}/${videoGuid}?autoplay=true`;
  }

  const expires = Math.floor(Date.now() / 1000) + expirationSeconds;
  // Bunny Stream Token Auth algorithm: SHA256_HEX(tokenKey + videoGuid + expires)
  const hashable = `${tokenKey}${videoGuid}${expires}`;
  const token = crypto.createHash("sha256").update(hashable).digest("hex");

  return `https://player.mediadelivery.net/embed/${libraryId}/${videoGuid}?token=${token}&expires=${expires}&autoplay=true`;
}
