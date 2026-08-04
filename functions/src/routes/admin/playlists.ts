import { Router, Response } from "express";
import { db } from "../../config/firebase";
import { verifyToken } from "../../middleware/verifyToken";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { AuthenticatedRequest, CourseDoc, PlaylistDoc, ErrorCodes } from "../../types";

const router = Router();

router.use(verifyToken, verifyAdmin);

// ─── GET /admin/playlists/all ──────────────────────────────────────────────
/**
 * Returns every playlist across every course, with the parent course's
 * title attached, for use in the "Attach Existing Playlist" picker UI.
 */
router.get(
  "/all",
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const coursesSnap = await db.collection("courses").get();

      const allPlaylists: Array<{
        playlistId: string;
        playlistTitle: string;
        playlistDescription: string;
        totalVideos: number;
        sourceCourseId: string;
        sourceCourseTitle: string;
      }> = [];

      await Promise.all(
        coursesSnap.docs.map(async (courseDoc) => {
          const courseData = courseDoc.data() as CourseDoc;
          const playlistsSnap = await courseDoc.ref.collection("playlists").get();
          playlistsSnap.docs.forEach((plDoc) => {
            const plData = plDoc.data() as PlaylistDoc;
            allPlaylists.push({
              playlistId: plDoc.id,
              playlistTitle: plData.title,
              playlistDescription: plData.description,
              totalVideos: plData.totalVideos ?? 0,
              sourceCourseId: courseDoc.id,
              sourceCourseTitle: courseData.title,
            });
          });
        })
      );

      res.status(200).json({ playlists: allPlaylists });
    } catch (error) {
      console.error("[admin/playlists/all GET] Error:", error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to fetch all playlists.",
      });
    }
  }
);

export default router;
