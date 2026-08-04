import { Router, Response } from "express";
import { db } from "../config/firebase";
import { verifyToken } from "../middleware/verifyToken";
import { verifySession } from "../middleware/verifySession";
import { AuthenticatedRequest, ProgressDoc, ErrorCodes } from "../types";

const router = Router();

// ─── POST /progress/update ────────────────────────────────────────────────────

/**
 * Upserts the student's watch progress for a specific video.
 *
 * Called every 15 seconds during playback, and on pause/exit.
 * Sets isCompleted: true when percentComplete reaches 90%.
 *
 * Body: { videoId, courseId, playlistId?, watchedSeconds, totalSeconds }
 *
 * Middleware: verifyToken → verifySession
 * (verifyDevice not required here — progress updates are not content-gated by device)
 */
router.post(
  "/update",
  verifyToken,
  verifySession,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { videoId, courseId, playlistId, watchedSeconds, totalSeconds } = req.body;

    // ── Input validation ──────────────────────────────────────────────────────
    if (!videoId || !courseId || watchedSeconds == null || totalSeconds == null) {
      res.status(400).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Missing required fields: videoId, courseId, watchedSeconds, totalSeconds.",
      });
      return;
    }

    if (typeof watchedSeconds !== "number" || typeof totalSeconds !== "number" || totalSeconds <= 0) {
      res.status(400).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "watchedSeconds and totalSeconds must be positive numbers.",
      });
      return;
    }

    // ── Enrollment check ──────────────────────────────────────────────────────
    const enrolledCourses = req.userDoc!.enrolledCourses;
    if (!enrolledCourses.includes(courseId)) {
      res.status(403).json({
        code: ErrorCodes.NOT_ENROLLED,
        message: "You are not enrolled in this course.",
      });
      return;
    }

    const uid = req.uid!;
    const progressRef = db
      .collection("users")
      .doc(uid)
      .collection("progress")
      .doc(videoId);

    try {
      const now = new Date();
      const percentComplete = Math.min(
        Math.round((watchedSeconds / totalSeconds) * 100),
        100
      );

      // Check existing progress to preserve firstWatchedAt and isCompleted
      const existing = await progressRef.get();
      const existingData = existing.exists ? (existing.data() as ProgressDoc) : null;

      const wasCompleted = existingData?.isCompleted ?? false;
      const isNowCompleted = percentComplete >= 90;

      const progressUpdate: Partial<ProgressDoc> = {
        videoId,
        courseId,
        watchedSeconds: Math.max(watchedSeconds, existingData?.watchedSeconds ?? 0),
        totalSeconds,
        percentComplete,
        isCompleted: wasCompleted || isNowCompleted, // once completed, stays completed
        lastWatchedAt: now as unknown as FirebaseFirestore.Timestamp,
        firstWatchedAt: existingData?.firstWatchedAt ?? (now as unknown as FirebaseFirestore.Timestamp),
      };

      // Store playlistId if provided (videos added after the playlist refactor)
      if (playlistId && typeof playlistId === "string") {
        progressUpdate.playlistId = playlistId;
      }

      await progressRef.set(progressUpdate, { merge: true });

      if (!wasCompleted && isNowCompleted) {
        console.log(`[progress/update] Video ${videoId} marked complete for uid ${uid}`);
      }

      res.status(200).json({
        message: "Progress updated.",
        percentComplete,
        isCompleted: progressUpdate.isCompleted,
      });
    } catch (error) {
      console.error("[progress/update] Error:", error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to update progress.",
      });
    }
  }
);

// ─── GET /progress/:courseId ──────────────────────────────────────────────────

/**
 * Returns all progress documents for a student under a specific course.
 * Used by the mobile app to show completion checkmarks and resume positions.
 *
 * Middleware: verifyToken → verifySession
 */
router.get(
  "/:courseId",
  verifyToken,
  verifySession,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const courseId = req.params.courseId;
    const uid = req.uid!;

    // ── Enrollment check ──────────────────────────────────────────────────────
    if (!req.userDoc!.enrolledCourses.includes(courseId)) {
      res.status(403).json({
        code: ErrorCodes.NOT_ENROLLED,
        message: "You are not enrolled in this course.",
      });
      return;
    }

    try {
      const progressSnap = await db
        .collection("users")
        .doc(uid)
        .collection("progress")
        .where("courseId", "==", courseId)
        .get();

      const progress = progressSnap.docs.map((doc) => {
        const data = doc.data() as ProgressDoc;
        return {
          videoId: doc.id,
          courseId: data.courseId,
          playlistId: data.playlistId ?? null,
          watchedSeconds: data.watchedSeconds,
          totalSeconds: data.totalSeconds,
          percentComplete: data.percentComplete,
          isCompleted: data.isCompleted,
          lastWatchedAt: data.lastWatchedAt,
        };
      });

      res.status(200).json({ progress });
    } catch (error) {
      console.error(`[GET /progress/${courseId}] Error:`, error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to fetch progress.",
      });
    }
  }
);

export default router;
