import { Router, Response } from "express";
import { db } from "../config/firebase";
import { verifyToken } from "../middleware/verifyToken";
import { verifySession } from "../middleware/verifySession";
import { verifyDevice } from "../middleware/verifyDevice";
import { AuthenticatedRequest, VideoDoc, ErrorCodes } from "../types";
import { generateSignedEmbedUrl } from "../utils/bunnyStream";

import { isCourseAccessActive } from "../utils/courseAccess";

const router = Router();

// ─── GET /videos/:id/stream ───────────────────────────────────────────────────

/**
 * Returns a token-authenticated Bunny Stream embed URL for a video the student is enrolled to watch.
 *
 * Checks:
 *  1. Valid token + session + device (middleware)
 *  2. Subscription active & per-course access active
 *  3. Student is enrolled in the video's parent course
 *  4. Video status is "ready" (finished encoding)
 *
 * Middleware: verifyToken → verifySession → verifyDevice
 */
router.get(
  "/:id/stream",
  verifyToken,
  verifySession,
  verifyDevice,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const videoId = req.params.id;
    const { courseId, playlistId } = req.query as { courseId?: string; playlistId?: string };

    if (!courseId || !playlistId) {
      res.status(400).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Missing required query parameters: courseId, playlistId.",
      });
      return;
    }

    const accessCheck = isCourseAccessActive(req.userDoc!, courseId);
    if (!accessCheck.active) {
      res.status(403).json({
        code: ErrorCodes.NOT_ENROLLED,
        message: accessCheck.reason || "You do not have access to this course.",
      });
      return;
    }

    try {
      // Direct path lookup — single document read, no scan
      const videoRef = db
        .collection("courses")
        .doc(courseId)
        .collection("playlists")
        .doc(playlistId)
        .collection("videos")
        .doc(videoId);

      const videoSnap = await videoRef.get();

      if (!videoSnap.exists) {
        res.status(404).json({
          code: ErrorCodes.NOT_FOUND,
          message: "Video not found.",
        });
        return;
      }

      const video = videoSnap.data() as VideoDoc;

      // Defense in depth: confirm the video's own stored courseId matches
      if (video.courseId && video.courseId !== courseId) {
        res.status(403).json({
          code: ErrorCodes.NOT_ENROLLED,
          message: "Video does not belong to the specified course.",
        });
        return;
      }

      // Block only if video explicitly failed encoding
      if (video.status === "failed") {
        res.status(403).json({
          code: ErrorCodes.INTERNAL_ERROR,
          message: "Video processing failed. Please re-upload the video.",
        });
        return;
      }

      const bunnyGuid = video.bunnyVideoGuid;
      if (!bunnyGuid) {
        res.status(404).json({
          code: ErrorCodes.NOT_FOUND,
          message: "Video stream reference missing.",
        });
        return;
      }

      // Generate server-side token-signed Bunny Stream player URL (1 hour expiration)
      const embedUrl = generateSignedEmbedUrl(bunnyGuid, 3600);

      res.status(200).json({
        embedUrl,
        title: video.title,
        videoId,
        courseId,
        playlistId,
      });
    } catch (error) {
      console.error(`[GET /videos/${videoId}/stream] Error:`, error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to fetch stream URL.",
      });
    }
  }
);

export default router;
