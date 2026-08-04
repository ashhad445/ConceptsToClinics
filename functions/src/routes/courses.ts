import { Router, Response } from "express";
import { db } from "../config/firebase";
import { verifyToken } from "../middleware/verifyToken";
import { verifySession } from "../middleware/verifySession";
import { verifyDevice } from "../middleware/verifyDevice";
import { AuthenticatedRequest, CourseDoc, PlaylistDoc, VideoDoc, ErrorCodes } from "../types";

const router = Router();

// ─── Subscription Helper ──────────────────────────────────────────────────────

/**
 * Returns true if the student's subscription is currently active.
 * Checks both the boolean flag and the expiry timestamp.
 */
const isSubscriptionActive = (req: AuthenticatedRequest): boolean => {
  const userDoc = req.userDoc!;
  if (!userDoc.subscriptionActive) return false;
  if (
    userDoc.subscriptionExpiry &&
    userDoc.subscriptionExpiry.toDate() < new Date()
  ) {
    return false;
  }
  return true;
};

// ─── GET /courses ─────────────────────────────────────────────────────────────

/**
 * Returns ONLY the courses this student is enrolled in (and are published).
 * Also attaches the student's overall progress summary per course.
 *
 * Middleware: verifyToken → verifySession → verifyDevice
 */
router.get(
  "/",
  verifyToken,
  verifySession,
  verifyDevice,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!isSubscriptionActive(req)) {
      res.status(403).json({
        code: ErrorCodes.SUBSCRIPTION_INACTIVE,
        message: "Your subscription is not active. Please contact your instructor.",
      });
      return;
    }

    const enrolledCourses = req.userDoc!.enrolledCourses || [];

    try {
      // Fetch ALL published courses
      const coursesSnap = await db
        .collection("courses")
        .where("isPublished", "==", true)
        .orderBy("order")
        .get();

      // Fetch progress for this student (to calculate overall course progress)
      const progressSnap = await db
        .collection("users")
        .doc(req.uid!)
        .collection("progress")
        .get();

      // Build a map of courseId → completed video count
      const completedCountByCourse: Record<string, number> = {};
      progressSnap.forEach((doc) => {
        const data = doc.data();
        if (data.isCompleted && data.courseId) {
          completedCountByCourse[data.courseId] =
            (completedCountByCourse[data.courseId] || 0) + 1;
        }
      });

      const courses = coursesSnap.docs.map((doc) => {
        const data = doc.data() as CourseDoc;
        const isEnrolled = enrolledCourses.includes(doc.id);
        const completedVideos = completedCountByCourse[doc.id] || 0;
        const progressPercent =
          data.totalVideos > 0
            ? Math.round((completedVideos / data.totalVideos) * 100)
            : 0;

        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          thumbnail: data.thumbnail,
          totalPlaylists: data.totalPlaylists ?? 0,
          totalVideos: data.totalVideos ?? 0,
          completedVideos,
          progressPercent,
          isEnrolled,
        };
      });

      res.status(200).json({ courses });
    } catch (error) {
      console.error("[GET /courses] Error:", error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to fetch courses.",
      });
    }
  }
);

// ─── GET /courses/:id/playlists ───────────────────────────────────────────────

/**
 * Returns the ordered playlist list for a course the student is enrolled in.
 * Attaches per-playlist progress (completed videos / totalVideos).
 *
 * Middleware: verifyToken → verifySession → verifyDevice
 */
router.get(
  "/:id/playlists",
  verifyToken,
  verifySession,
  verifyDevice,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!isSubscriptionActive(req)) {
      res.status(403).json({
        code: ErrorCodes.SUBSCRIPTION_INACTIVE,
        message: "Your subscription is not active. Please contact your instructor.",
      });
      return;
    }

    const courseId = req.params.id;
    const enrolledCourses = req.userDoc!.enrolledCourses;

    if (!enrolledCourses.includes(courseId)) {
      res.status(403).json({
        code: ErrorCodes.NOT_ENROLLED,
        message: "You are not enrolled in this course.",
      });
      return;
    }

    try {
      // Fetch playlists ordered by `order` field
      const playlistsSnap = await db
        .collection("courses")
        .doc(courseId)
        .collection("playlists")
        .orderBy("order")
        .get();

      // Fetch this student's progress for all videos in this course
      const progressSnap = await db
        .collection("users")
        .doc(req.uid!)
        .collection("progress")
        .where("courseId", "==", courseId)
        .get();

      // Build a map of playlistId → completed video count
      const completedByPlaylist: Record<string, number> = {};
      progressSnap.forEach((doc) => {
        const data = doc.data();
        if (data.isCompleted && data.playlistId) {
          completedByPlaylist[data.playlistId] =
            (completedByPlaylist[data.playlistId] || 0) + 1;
        }
      });

      const playlists = playlistsSnap.docs.map((doc) => {
        const data = doc.data() as PlaylistDoc;
        const completedVideos = completedByPlaylist[doc.id] || 0;
        const progressPercent =
          data.totalVideos > 0
            ? Math.round((completedVideos / data.totalVideos) * 100)
            : 0;

        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          order: data.order,
          totalVideos: data.totalVideos ?? 0,
          completedVideos,
          progressPercent,
        };
      });

      res.status(200).json({ playlists });
    } catch (error) {
      console.error(`[GET /courses/${courseId}/playlists] Error:`, error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to fetch playlists.",
      });
    }
  }
);

// ─── GET /courses/:id/playlists/:playlistId/videos ────────────────────────────

/**
 * Returns the ordered video list for a specific playlist within a course.
 * Attaches per-video progress data for the student.
 *
 * Middleware: verifyToken → verifySession → verifyDevice
 */
router.get(
  "/:id/playlists/:playlistId/videos",
  verifyToken,
  verifySession,
  verifyDevice,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!isSubscriptionActive(req)) {
      res.status(403).json({
        code: ErrorCodes.SUBSCRIPTION_INACTIVE,
        message: "Your subscription is not active. Please contact your instructor.",
      });
      return;
    }

    const courseId = req.params.id;
    const playlistId = req.params.playlistId;
    const enrolledCourses = req.userDoc!.enrolledCourses;

    if (!enrolledCourses.includes(courseId)) {
      res.status(403).json({
        code: ErrorCodes.NOT_ENROLLED,
        message: "You are not enrolled in this course.",
      });
      return;
    }

    try {
      // Fetch videos ordered by `order` field
      const videosSnap = await db
        .collection("courses")
        .doc(courseId)
        .collection("playlists")
        .doc(playlistId)
        .collection("videos")
        .orderBy("order")
        .get();

      // Fetch this student's progress for videos in this course
      const progressSnap = await db
        .collection("users")
        .doc(req.uid!)
        .collection("progress")
        .where("courseId", "==", courseId)
        .get();

      // Build a map of videoId → progress data
      const progressByVideo: Record<string, { isCompleted: boolean; watchedSeconds: number; percentComplete: number }> = {};
      progressSnap.forEach((doc) => {
        const data = doc.data();
        progressByVideo[doc.id] = {
          isCompleted: data.isCompleted || false,
          watchedSeconds: data.watchedSeconds || 0,
          percentComplete: data.percentComplete || 0,
        };
      });

      const videos = videosSnap.docs.map((doc) => {
        const data = doc.data() as VideoDoc;
        const progress = progressByVideo[doc.id] || {
          isCompleted: false,
          watchedSeconds: 0,
          percentComplete: 0,
        };

        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          bunnyVideoGuid: data.bunnyVideoGuid || "",
          status: data.status || "ready",
          duration: data.duration || 0,
          order: data.order,
          isFreePreview: data.isFreePreview,
          isCompleted: progress.isCompleted,
          watchedSeconds: progress.watchedSeconds,
          percentComplete: progress.percentComplete,
        };
      });

      res.status(200).json({ videos });
    } catch (error) {
      console.error(`[GET /courses/${courseId}/playlists/${playlistId}/videos] Error:`, error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to fetch videos.",
      });
    }
  }
);

export default router;
