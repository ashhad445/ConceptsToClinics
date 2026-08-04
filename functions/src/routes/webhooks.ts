import { Router, Request, Response } from "express";
import { db } from "../config/firebase";
import { getBunnyVideoMetadata } from "../utils/bunnyStream";

const router = Router();

interface BunnyWebhookPayload {
  VideoLibraryId: number;
  VideoGuid: string;
  Status: number; // 4 = finished/ready, 5 = failed
}

/**
 * POST /webhooks/bunny
 * Bunny Stream encoding status webhook.
 * Automatically updates Firestore video status and duration metadata.
 */
router.post("/bunny", async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body as BunnyWebhookPayload;

    if (!payload || !payload.VideoGuid) {
      res.status(400).send("Invalid webhook payload.");
      return;
    }

    const { VideoGuid, Status } = payload;
    console.log(`[Bunny Webhook] Received status event for video ${VideoGuid}, status: ${Status}`);

    // Query collection group 'videos' to locate matching video document
    const videosSnap = await db.collectionGroup("videos").where("bunnyVideoGuid", "==", VideoGuid).get();

    if (videosSnap.empty) {
      console.warn(`[Bunny Webhook] No matching Firestore video found for bunnyVideoGuid: ${VideoGuid}`);
      res.status(200).send("No matching video doc found.");
      return;
    }

    if (Status === 4) {
      // Finished encoding / Ready
      let duration = 0;
      try {
        const metadata = await getBunnyVideoMetadata(VideoGuid);
        duration = Math.round(metadata.length || 0);
      } catch (err) {
        console.error(`[Bunny Webhook] Error fetching metadata for ${VideoGuid}:`, err);
      }

      const batch = db.batch();
      videosSnap.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, {
          status: "ready",
          duration: duration,
        });
      });
      await batch.commit();

      console.log(`[Bunny Webhook] Successfully updated video ${VideoGuid} to status='ready', duration=${duration}s.`);
    } else if (Status === 5) {
      // Encoding failed
      const batch = db.batch();
      videosSnap.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, {
          status: "failed",
        });
      });
      await batch.commit();

      console.warn(`[Bunny Webhook] Updated video ${VideoGuid} to status='failed'.`);
    }

    res.status(200).send("Webhook processed successfully.");
  } catch (error) {
    console.error("[Bunny Webhook] Unexpected error processing webhook:", error);
    res.status(500).send("Internal server error.");
  }
});

export default router;
