import { Router, Response } from "express";
import Busboy from "busboy";
import { db, admin } from "../../config/firebase";
import { verifyToken } from "../../middleware/verifyToken";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { AuthenticatedRequest, CourseDoc, PlaylistDoc, VideoDoc, ErrorCodes } from "../../types";
import { createBunnyVideo, uploadBunnyVideo, deleteBunnyVideo, getBunnyVideoMetadata } from "../../utils/bunnyStream";

const router = Router();

// All routes require verifyToken + verifyAdmin
router.use(verifyToken, verifyAdmin);

// ─── POST /admin/courses ──────────────────────────────────────────────────────

/**
 * Creates a new course.
 * Body: { title, description, thumbnail, order }
 */
router.post(
  "/",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { title, description, thumbnail, order, durationDays } = req.body;

    if (!title || !description || !thumbnail || order == null) {
      res.status(400).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Missing required fields: title, description, thumbnail, order.",
      });
      return;
    }

    try {
      const now = new Date();
      const courseData: CourseDoc = {
        title: title.trim(),
        description: description.trim(),
        thumbnail: thumbnail.trim(),
        order: Number(order),
        isPublished: false,
        durationDays: durationDays != null ? Number(durationDays) : 365,
        totalPlaylists: 0,
        totalVideos: 0,
        createdAt: now as unknown as FirebaseFirestore.Timestamp,
      };

      const courseRef = await db.collection("courses").add(courseData);

      console.log(`[admin/courses POST] Course created: ${courseRef.id} — "${title}"`);

      res.status(201).json({ id: courseRef.id, ...courseData });
    } catch (error) {
      console.error("[admin/courses POST] Error:", error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to create course.",
      });
    }
  }
);

// ─── GET /admin/courses ───────────────────────────────────────────────────────

/**
 * Returns all courses (published and unpublished) for the admin dashboard.
 */
router.get(
  "/",
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const coursesSnap = await db
        .collection("courses")
        .orderBy("order")
        .get();

      const courses = coursesSnap.docs.map((doc) => {
        const data = doc.data() as CourseDoc;
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          thumbnail: data.thumbnail,
          order: data.order,
          isPublished: data.isPublished,
          durationDays: data.durationDays ?? 365,
          totalPlaylists: data.totalPlaylists ?? 0,
          totalVideos: data.totalVideos ?? 0,
          createdAt: data.createdAt,
        };
      });

      res.status(200).json({ courses });
    } catch (error) {
      console.error("[admin/courses GET] Error:", error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to fetch courses.",
      });
    }
  }
);

// ─── PUT /admin/courses/:id ───────────────────────────────────────────────────

/**
 * Updates course metadata fields.
 * Body: { title?, description?, thumbnail?, order?, isPublished?, durationDays? }
 */
router.put(
  "/:id",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const courseId = req.params.id;
    const { title, description, thumbnail, order, isPublished, durationDays } = req.body;

    const updates: Partial<Record<string, unknown>> = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (thumbnail !== undefined) updates.thumbnail = thumbnail.trim();
    if (order !== undefined) updates.order = Number(order);
    if (isPublished !== undefined) updates.isPublished = Boolean(isPublished);
    if (durationDays !== undefined) updates.durationDays = Number(durationDays);

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "No valid fields provided to update.",
      });
      return;
    }

    try {
      const courseRef = db.collection("courses").doc(courseId);
      const courseSnap = await courseRef.get();

      if (!courseSnap.exists) {
        res.status(404).json({
          code: ErrorCodes.NOT_FOUND,
          message: "Course not found.",
        });
        return;
      }

      await courseRef.update(updates);

      res.status(200).json({ message: "Course updated successfully." });
    } catch (error) {
      console.error(`[admin/courses PUT /${courseId}] Error:`, error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to update course.",
      });
    }
  }
);

// ─── GET /admin/courses/:id/playlists ────────────────────────────────────────

/**
 * Returns all playlists for a course, ordered by their `order` field.
 */
router.get(
  "/:id/playlists",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const courseId = req.params.id;

    try {
      const playlistsSnap = await db
        .collection("courses")
        .doc(courseId)
        .collection("playlists")
        .orderBy("order")
        .get();

      const playlists = playlistsSnap.docs.map((doc) => {
        const data = doc.data() as PlaylistDoc;
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          thumbnail: data.thumbnail ?? "",
          order: data.order,
          totalVideos: data.totalVideos ?? 0,
          createdAt: data.createdAt,
        };
      });

      res.status(200).json({ playlists });
    } catch (error) {
      console.error(`[admin/courses GET /${courseId}/playlists] Error:`, error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to fetch playlists.",
      });
    }
  }
);

// ─── POST /admin/courses/:id/playlists ───────────────────────────────────────

/**
 * Creates a new playlist in a course and increments the course's totalPlaylists counter.
 * Body: { title, description, thumbnail, order }
 */
router.post(
  "/:id/playlists",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const courseId = req.params.id;
    const { title, description, thumbnail, order } = req.body;

    if (!title || order == null) {
      res.status(400).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Missing required fields: title, order.",
      });
      return;
    }

    try {
      const courseRef = db.collection("courses").doc(courseId);
      const courseSnap = await courseRef.get();

      if (!courseSnap.exists) {
        res.status(404).json({
          code: ErrorCodes.NOT_FOUND,
          message: "Course not found.",
        });
        return;
      }

      const now = new Date();
      const playlistData: PlaylistDoc = {
        title: title.trim(),
        description: (description ?? "").trim(),
        thumbnail: (thumbnail ?? "").trim(),
        order: Number(order),
        totalVideos: 0,
        createdAt: now as unknown as FirebaseFirestore.Timestamp,
      };

      let playlistId: string;
      await db.runTransaction(async (transaction) => {
        const playlistRef = courseRef.collection("playlists").doc();
        playlistId = playlistRef.id;
        transaction.set(playlistRef, playlistData);
        transaction.update(courseRef, {
          totalPlaylists: admin.firestore.FieldValue.increment(1),
        });
      });

      console.log(`[admin/courses POST /${courseId}/playlists] Playlist created: ${playlistId!}`);

      res.status(201).json({ id: playlistId!, ...playlistData });
    } catch (error) {
      console.error(`[admin/courses POST /${courseId}/playlists] Error:`, error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to create playlist.",
      });
    }
  }
);

// ─── POST /admin/courses/:id/playlists/attach-existing ────────────────────
/**
 * Copies an existing playlist (and all its videos) from another course into
 * this course. Video documents are duplicated, but bunnyVideoGuid values are
 * REUSED — no re-upload to Bunny Stream happens. This lets the tutor share
 * the same lecture videos across multiple courses without duplicating
 * storage or bandwidth cost.
 *
 * Body: { sourceCourseId: string, sourcePlaylistId: string, order: number }
 */
router.post(
  "/:id/playlists/attach-existing",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const targetCourseId = req.params.id;
    const { sourceCourseId, sourcePlaylistId, order } = req.body;

    if (!sourceCourseId || !sourcePlaylistId || order == null) {
      res.status(400).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Missing required fields: sourceCourseId, sourcePlaylistId, order.",
      });
      return;
    }

    try {
      const targetCourseRef = db.collection("courses").doc(targetCourseId);
      const sourcePlaylistRef = db
        .collection("courses")
        .doc(sourceCourseId)
        .collection("playlists")
        .doc(sourcePlaylistId);

      const [targetCourseSnap, sourcePlaylistSnap] = await Promise.all([
        targetCourseRef.get(),
        sourcePlaylistRef.get(),
      ]);

      if (!targetCourseSnap.exists) {
        res.status(404).json({ code: ErrorCodes.NOT_FOUND, message: "Target course not found." });
        return;
      }
      if (!sourcePlaylistSnap.exists) {
        res.status(404).json({ code: ErrorCodes.NOT_FOUND, message: "Source playlist not found." });
        return;
      }

      const sourcePlaylistData = sourcePlaylistSnap.data() as PlaylistDoc;

      const sourceVideosSnap = await sourcePlaylistRef.collection("videos").orderBy("order").get();
      const sourceVideos = sourceVideosSnap.docs.map((doc) => doc.data() as VideoDoc);

      const now = new Date();

      const newPlaylistData: PlaylistDoc = {
        title: sourcePlaylistData.title,
        description: sourcePlaylistData.description,
        thumbnail: sourcePlaylistData.thumbnail ?? "",
        order: Number(order),
        totalVideos: sourceVideos.length,
        createdAt: now as unknown as FirebaseFirestore.Timestamp,
      };

      const newPlaylistRef = targetCourseRef.collection("playlists").doc();

      const batch = db.batch();
      batch.set(newPlaylistRef, newPlaylistData);

      sourceVideos.forEach((video) => {
        const newVideoRef = newPlaylistRef.collection("videos").doc();
        const newVideoData: VideoDoc = {
          title: video.title,
          description: video.description,
          bunnyVideoGuid: video.bunnyVideoGuid, // REUSED — no re-upload
          order: video.order,
          isFreePreview: video.isFreePreview,
          status: video.status,
          duration: video.duration,
          courseId: targetCourseId,
          playlistId: newPlaylistRef.id,
          uploadedAt: video.uploadedAt,
          createdAt: now as unknown as FirebaseFirestore.Timestamp,
        };
        batch.set(newVideoRef, newVideoData);
      });

      batch.update(targetCourseRef, {
        totalPlaylists: admin.firestore.FieldValue.increment(1),
        totalVideos: admin.firestore.FieldValue.increment(sourceVideos.length),
      });

      await batch.commit();

      console.log(
        `[admin/courses POST /${targetCourseId}/playlists/attach-existing] Attached "${sourcePlaylistData.title}" (${sourceVideos.length} videos) from course ${sourceCourseId} — new playlist ID: ${newPlaylistRef.id}`
      );

      res.status(201).json({ id: newPlaylistRef.id, ...newPlaylistData });
    } catch (error) {
      console.error(`[admin/courses POST /${targetCourseId}/playlists/attach-existing] Error:`, error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to attach existing playlist.",
      });
    }
  }
);

// ─── PUT /admin/courses/:id/playlists/:playlistId ────────────────────────────

/**
 * Updates a playlist's metadata.
 * Body: { title?, description?, order? }
 */
router.put(
  "/:id/playlists/:playlistId",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id: courseId, playlistId } = req.params;
    const { title, description, thumbnail, order } = req.body;

    const updates: Partial<Record<string, unknown>> = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (thumbnail !== undefined) updates.thumbnail = thumbnail.trim();
    if (order !== undefined) updates.order = Number(order);

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "No valid fields provided to update.",
      });
      return;
    }

    try {
      const playlistRef = db
        .collection("courses")
        .doc(courseId)
        .collection("playlists")
        .doc(playlistId);

      const playlistSnap = await playlistRef.get();
      if (!playlistSnap.exists) {
        res.status(404).json({
          code: ErrorCodes.NOT_FOUND,
          message: "Playlist not found.",
        });
        return;
      }

      await playlistRef.update(updates);

      res.status(200).json({ message: "Playlist updated successfully." });
    } catch (error) {
      console.error(`[admin/courses PUT /${courseId}/playlists/${playlistId}] Error:`, error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to update playlist.",
      });
    }
  }
);

// ─── DELETE /admin/courses/:id/playlists/:playlistId ─────────────────────────

/**
 * Deletes a playlist and all its videos.
 * Uses a batch write to delete all videos, then decrements both
 * totalPlaylists and totalVideos on the course doc atomically.
 */
router.delete(
  "/:id/playlists/:playlistId",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id: courseId, playlistId } = req.params;

    try {
      const courseRef = db.collection("courses").doc(courseId);
      const playlistRef = courseRef.collection("playlists").doc(playlistId);

      const playlistSnap = await playlistRef.get();
      if (!playlistSnap.exists) {
        res.status(404).json({
          code: ErrorCodes.NOT_FOUND,
          message: "Playlist not found.",
        });
        return;
      }

      const playlistData = playlistSnap.data() as PlaylistDoc;
      const videoCount = playlistData.totalVideos ?? 0;

      // Fetch all videos to delete them
      const videosSnap = await playlistRef.collection("videos").get();

      // Batch delete all videos + the playlist itself, then update course counters
      const batch = db.batch();
      videosSnap.docs.forEach((doc) => batch.delete(doc.ref));
      batch.delete(playlistRef);
      await batch.commit();

      // Update course counters
      await courseRef.update({
        totalPlaylists: admin.firestore.FieldValue.increment(-1),
        totalVideos: admin.firestore.FieldValue.increment(-videoCount),
      });

      console.log(
        `[admin/courses DELETE /${courseId}/playlists/${playlistId}] Playlist deleted with ${videoCount} videos`
      );

      res.status(200).json({ message: "Playlist and all its videos deleted successfully." });
    } catch (error) {
      console.error(`[admin/courses DELETE /${courseId}/playlists/${playlistId}] Error:`, error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to delete playlist.",
      });
    }
  }
);

// ─── GET /admin/courses/:id/playlists/:playlistId/videos ─────────────────────

/**
 * Returns all videos in a playlist, ordered by their `order` field.
 */
router.get(
  "/:id/playlists/:playlistId/videos",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id: courseId, playlistId } = req.params;

    try {
      const videosSnap = await db
        .collection("courses")
        .doc(courseId)
        .collection("playlists")
        .doc(playlistId)
        .collection("videos")
        .orderBy("order")
        .get();

      const videos = await Promise.all(
        videosSnap.docs.map(async (doc) => {
          const data = doc.data() as VideoDoc;
          let currentStatus = data.status || "ready";
          let duration = data.duration || 0;

          // If status is uploading or processing, verify status with Bunny Stream
          if ((currentStatus === "uploading" || currentStatus === "processing") && data.bunnyVideoGuid) {
            try {
              const meta = await getBunnyVideoMetadata(data.bunnyVideoGuid);
              if (meta.status === 4 || meta.length > 0) {
                currentStatus = "ready";
                duration = Math.round(meta.length || 0);
                doc.ref.update({ status: "ready", duration }).catch(() => {});
              } else if (meta.status === 5) {
                currentStatus = "failed";
                doc.ref.update({ status: "failed" }).catch(() => {});
              } else {
                // If Bunny has received the video (status 3 / encoding), mark as processing
                currentStatus = "processing";
                doc.ref.update({ status: "processing" }).catch(() => {});
              }
            } catch (metaErr) {
              // Fallback to ready if created > 2 minutes ago
              const createdAt = data.createdAt ? (data.createdAt as any).toDate?.() || new Date(data.createdAt as any) : new Date();
              if (Date.now() - new Date(createdAt).getTime() > 120000) {
                currentStatus = "ready";
                doc.ref.update({ status: "ready" }).catch(() => {});
              }
            }
          }

          return {
            id: doc.id,
            title: data.title,
            description: data.description,
            bunnyVideoGuid: data.bunnyVideoGuid || "",
            status: currentStatus,
            duration: duration,
            order: data.order,
            isFreePreview: data.isFreePreview,
            uploadedAt: data.uploadedAt || data.createdAt,
            createdAt: data.createdAt,
          };
        })
      );

      res.status(200).json({ videos });
    } catch (error) {
      console.error(
        `[admin/courses GET /${courseId}/playlists/${playlistId}/videos] Error:`,
        error
      );
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to fetch videos.",
      });
    }
  }
);

// ─── POST /admin/courses/:id/playlists/:playlistId/videos/:videoId/complete-upload ───

/**
 * Notifies server that browser direct upload finished.
 * Verifies video metadata with Bunny Stream and updates Firestore status to 'ready'.
 */
router.post(
  "/:id/playlists/:playlistId/videos/:videoId/complete-upload",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id: courseId, playlistId, videoId } = req.params;

    try {
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

      const data = videoSnap.data() as VideoDoc;
      let newStatus = "ready";
      let duration = data.duration || 0;

      if (data.bunnyVideoGuid) {
        try {
          const meta = await getBunnyVideoMetadata(data.bunnyVideoGuid);
          if (meta.length) {
            duration = Math.round(meta.length);
          }
          if (meta.status === 5) {
            newStatus = "failed";
          }
        } catch (err) {
          console.warn(`[complete-upload] Metadata fetch warning for ${data.bunnyVideoGuid}:`, err);
        }
      }

      await videoRef.update({
        status: newStatus,
        duration,
      });

      res.status(200).json({
        message: "Video upload marked complete.",
        status: newStatus,
        duration,
      });
    } catch (error) {
      console.error(
        `[admin/courses POST /${courseId}/playlists/${playlistId}/videos/${videoId}/complete-upload] Error:`,
        error
      );
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to complete upload.",
      });
    }
  }
);

// ─── POST /admin/courses/:id/playlists/:playlistId/videos/initiate-upload ────

/**
 * Direct Browser Upload (0 MB Firebase Bandwidth):
 * Initiates a video slot in Bunny Stream and creates a Firestore VideoDoc with status='uploading'.
 * Returns the uploadUrl and AccessKey so the browser can PUT the 1GB+ file directly to Bunny Stream.
 */
router.post(
  "/:id/playlists/:playlistId/videos/initiate-upload",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id: courseId, playlistId } = req.params;
    const { title, description, order, isFreePreview } = req.body;

    if (!title || order == null) {
      res.status(400).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Missing required fields: title, order.",
      });
      return;
    }

    try {
      const courseRef = db.collection("courses").doc(courseId);
      const playlistRef = courseRef.collection("playlists").doc(playlistId);

      const [courseSnap, playlistSnap] = await Promise.all([
        courseRef.get(),
        playlistRef.get(),
      ]);

      if (!courseSnap.exists) {
        res.status(404).json({ code: ErrorCodes.NOT_FOUND, message: "Course not found." });
        return;
      }
      if (!playlistSnap.exists) {
        res.status(404).json({ code: ErrorCodes.NOT_FOUND, message: "Playlist not found." });
        return;
      }

      console.log(`[Direct Upload Initiate] Step 1: Creating Bunny video for "${title}"...`);
      const bunnyVideoGuid = await createBunnyVideo(title.trim());

      const libraryId = process.env.BUNNY_LIBRARY_ID;
      const apiKey = process.env.BUNNY_STREAM_API_KEY;

      if (!libraryId || !apiKey) {
        res.status(500).json({
          code: ErrorCodes.INTERNAL_ERROR,
          message: "Bunny Stream library configuration missing on server.",
        });
        return;
      }

      const now = new Date();
      const videoData: VideoDoc = {
        title: title.trim(),
        description: (description || "").trim(),
        bunnyVideoGuid,
        order: Number(order),
        isFreePreview: Boolean(isFreePreview ?? false),
        status: "uploading",
        courseId,
        playlistId,
        uploadedAt: now as unknown as FirebaseFirestore.Timestamp,
        createdAt: now as unknown as FirebaseFirestore.Timestamp,
      };

      let videoId: string;
      await db.runTransaction(async (transaction) => {
        const videoRef = playlistRef.collection("videos").doc();
        videoId = videoRef.id;
        transaction.set(videoRef, videoData);
        transaction.update(playlistRef, {
          totalVideos: admin.firestore.FieldValue.increment(1),
        });
        transaction.update(courseRef, {
          totalVideos: admin.firestore.FieldValue.increment(1),
        });
      });

      console.log(`[Direct Upload Initiate] Step 2: Created Firestore video doc (${videoId!}) with status='uploading'. Returning direct upload authorization.`);

      res.status(201).json({
        videoId: videoId!,
        uploadUrl: `https://video.bunnycdn.com/library/${libraryId}/videos/${bunnyVideoGuid}`,
        apiKey,
        ...videoData,
      });
    } catch (error) {
      console.error(`[admin/courses POST /${courseId}/playlists/${playlistId}/videos/initiate-upload] Error:`, error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to initiate direct video upload.",
      });
    }
  }
);

// ─── POST /admin/courses/:id/playlists/:playlistId/videos/upload ──────────────

/**
 * Option B: Admin Direct Video Upload to Bunny Stream.
 * Accepts a multipart/form-data upload containing fields (title, description, order, isFreePreview) and a video file.
 * 1. Creates a video entry in Bunny Stream -> receives videoGuid
 * 2. Uploads the binary stream to Bunny Stream
 * 3. Immediately saves VideoDoc in Firestore with status="processing" and returns 201 Created.
 */
router.post(
  "/:id/playlists/:playlistId/videos/upload",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id: courseId, playlistId } = req.params;

    try {
      const courseRef = db.collection("courses").doc(courseId);
      const playlistRef = courseRef.collection("playlists").doc(playlistId);

      const [courseSnap, playlistSnap] = await Promise.all([
        courseRef.get(),
        playlistRef.get(),
      ]);

      if (!courseSnap.exists) {
        res.status(404).json({ code: ErrorCodes.NOT_FOUND, message: "Course not found." });
        return;
      }
      if (!playlistSnap.exists) {
        res.status(404).json({ code: ErrorCodes.NOT_FOUND, message: "Playlist not found." });
        return;
      }

      // Parse multipart upload using Busboy
      const busboy = Busboy({ headers: req.headers });
      const fields: Record<string, string> = {};
      let fileBuffer: Buffer | null = null;

      busboy.on("field", (fieldname, val) => {
        fields[fieldname] = val;
      });

      const filePromises: Promise<void>[] = [];

      busboy.on("file", (_fieldname, fileStream) => {
        const chunks: Buffer[] = [];
        const p = new Promise<void>((resolve, reject) => {
          fileStream.on("data", (chunk: Buffer) => chunks.push(chunk));
          fileStream.on("end", () => {
            fileBuffer = Buffer.concat(chunks);
            resolve();
          });
          fileStream.on("error", reject);
        });
        filePromises.push(p);
      });

      busboy.on("finish", async () => {
        try {
          await Promise.all(filePromises);

          const title = fields.title?.trim();
          const description = (fields.description || "").trim();
          const order = Number(fields.order || 1);
          const isFreePreview = fields.isFreePreview === "true" || fields.isFreePreview === "1";

          if (!title || !fileBuffer) {
            res.status(400).json({
              code: ErrorCodes.INTERNAL_ERROR,
              message: "Missing required video file or title field.",
            });
            return;
          }

          console.log(`[Admin Video Upload] Step 1: Creating Bunny video for "${title}"...`);
          const videoGuid = await createBunnyVideo(title);

          console.log(`[Admin Video Upload] Step 2: Uploading binary buffer (${fileBuffer.length} bytes) to Bunny GUID ${videoGuid}...`);
          await uploadBunnyVideo(videoGuid, fileBuffer);

          const now = new Date();
          const videoData: VideoDoc = {
            title,
            description,
            bunnyVideoGuid: videoGuid,
            order,
            isFreePreview,
            status: "processing",
            courseId,
            playlistId,
            uploadedAt: now as unknown as FirebaseFirestore.Timestamp,
            createdAt: now as unknown as FirebaseFirestore.Timestamp,
          };

          let videoId: string;
          await db.runTransaction(async (transaction) => {
            const videoRef = playlistRef.collection("videos").doc();
            videoId = videoRef.id;
            transaction.set(videoRef, videoData);
            transaction.update(playlistRef, {
              totalVideos: admin.firestore.FieldValue.increment(1),
            });
            transaction.update(courseRef, {
              totalVideos: admin.firestore.FieldValue.increment(1),
            });
          });

          console.log(`[Admin Video Upload] Step 3: Video doc created (${videoId!}) with status='processing'. Returning 201.`);
          res.status(201).json({ id: videoId!, ...videoData });
        } catch (uploadErr) {
          console.error("[Admin Video Upload] Processing error:", uploadErr);
          res.status(500).json({
            code: ErrorCodes.INTERNAL_ERROR,
            message: "Failed to upload video to Bunny Stream.",
          });
        }
      });

      if ((req as any).rawBody) {
        busboy.end((req as any).rawBody);
      } else {
        req.pipe(busboy);
      }
    } catch (error) {
      console.error(`[admin/courses POST /${courseId}/playlists/${playlistId}/videos/upload] Error:`, error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to initiate video upload.",
      });
    }
  }
);

// ─── POST /admin/courses/:id/playlists/:playlistId/videos (Legacy / Manual GUID) ──

router.post(
  "/:id/playlists/:playlistId/videos",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id: courseId, playlistId } = req.params;
    const { title, description, bunnyVideoGuid, vimeoId, order, isFreePreview } = req.body;
    const finalGuid = (bunnyVideoGuid || vimeoId || "").trim();

    if (!title || !description || !finalGuid || order == null) {
      res.status(400).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Missing required fields: title, description, bunnyVideoGuid, order.",
      });
      return;
    }

    try {
      const courseRef = db.collection("courses").doc(courseId);
      const playlistRef = courseRef.collection("playlists").doc(playlistId);

      const [courseSnap, playlistSnap] = await Promise.all([
        courseRef.get(),
        playlistRef.get(),
      ]);

      if (!courseSnap.exists) {
        res.status(404).json({ code: ErrorCodes.NOT_FOUND, message: "Course not found." });
        return;
      }
      if (!playlistSnap.exists) {
        res.status(404).json({ code: ErrorCodes.NOT_FOUND, message: "Playlist not found." });
        return;
      }

      const now = new Date();
      const videoData: VideoDoc = {
        title: title.trim(),
        description: description.trim(),
        bunnyVideoGuid: finalGuid,
        order: Number(order),
        isFreePreview: Boolean(isFreePreview ?? false),
        status: "ready",
        courseId,
        playlistId,
        uploadedAt: now as unknown as FirebaseFirestore.Timestamp,
        createdAt: now as unknown as FirebaseFirestore.Timestamp,
      };

      let videoId: string;
      await db.runTransaction(async (transaction) => {
        const videoRef = playlistRef.collection("videos").doc();
        videoId = videoRef.id;
        transaction.set(videoRef, videoData);
        transaction.update(playlistRef, {
          totalVideos: admin.firestore.FieldValue.increment(1),
        });
        transaction.update(courseRef, {
          totalVideos: admin.firestore.FieldValue.increment(1),
        });
      });

      res.status(201).json({ id: videoId!, ...videoData });
    } catch (error) {
      console.error(`[admin/courses POST /${courseId}/playlists/${playlistId}/videos] Error:`, error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to add video.",
      });
    }
  }
);

// ─── PUT /admin/courses/:id/playlists/:playlistId/videos/:videoId ─────────────

/**
 * Updates a video's metadata.
 * Body: { title?, description?, bunnyVideoGuid?, order?, isFreePreview? }
 */
router.put(
  "/:id/playlists/:playlistId/videos/:videoId",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id: courseId, playlistId, videoId } = req.params;
    const { title, description, bunnyVideoGuid, vimeoId, order, isFreePreview } = req.body;

    const updates: Partial<Record<string, unknown>> = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (bunnyVideoGuid !== undefined || vimeoId !== undefined) {
      updates.bunnyVideoGuid = (bunnyVideoGuid || vimeoId).trim();
    }
    if (order !== undefined) updates.order = Number(order);
    if (isFreePreview !== undefined) updates.isFreePreview = Boolean(isFreePreview);

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "No valid fields provided to update.",
      });
      return;
    }

    try {
      const videoRef = db
        .collection("courses")
        .doc(courseId)
        .collection("playlists")
        .doc(playlistId)
        .collection("videos")
        .doc(videoId);

      const videoSnap = await videoRef.get();
      if (!videoSnap.exists) {
        res.status(404).json({ code: ErrorCodes.NOT_FOUND, message: "Video not found." });
        return;
      }

      await videoRef.update(updates);

      res.status(200).json({ message: "Video updated successfully." });
    } catch (error) {
      console.error(
        `[admin/courses PUT /${courseId}/playlists/${playlistId}/videos/${videoId}] Error:`,
        error
      );
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to update video.",
      });
    }
  }
);

// ─── POST /admin/courses/:id/playlists/:playlistId/videos/:videoId/replace ───

/**
 * Replace Video Flow:
 * Uploads a replacement video file to Bunny Stream.
 * Keeps the OLD video active until the NEW replacement video is fully encoded and ready.
 */
router.post(
  "/:id/playlists/:playlistId/videos/:videoId/replace",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id: courseId, playlistId, videoId } = req.params;

    try {
      const videoRef = db
        .collection("courses")
        .doc(courseId)
        .collection("playlists")
        .doc(playlistId)
        .collection("videos")
        .doc(videoId);

      const videoSnap = await videoRef.get();
      if (!videoSnap.exists) {
        res.status(404).json({ code: ErrorCodes.NOT_FOUND, message: "Video not found." });
        return;
      }

      const oldVideo = videoSnap.data() as VideoDoc;
      const oldGuid = oldVideo.bunnyVideoGuid;

      const busboy = Busboy({ headers: req.headers });
      let fileBuffer: Buffer | null = null;
      const filePromises: Promise<void>[] = [];

      busboy.on("file", (_fieldname, fileStream) => {
        const chunks: Buffer[] = [];
        const p = new Promise<void>((resolve, reject) => {
          fileStream.on("data", (chunk: Buffer) => chunks.push(chunk));
          fileStream.on("end", () => {
            fileBuffer = Buffer.concat(chunks);
            resolve();
          });
          fileStream.on("error", reject);
        });
        filePromises.push(p);
      });

      busboy.on("finish", async () => {
        try {
          await Promise.all(filePromises);

          if (!fileBuffer) {
            res.status(400).json({
              code: ErrorCodes.INTERNAL_ERROR,
              message: "Missing replacement video file.",
            });
            return;
          }

          console.log(`[Replace Video] Step 1: Creating replacement Bunny video for "${oldVideo.title}"...`);
          const newGuid = await createBunnyVideo(`${oldVideo.title} (Replacement)`);

          console.log(`[Replace Video] Step 2: Uploading replacement binary buffer to Bunny GUID ${newGuid}...`);
          await uploadBunnyVideo(newGuid, fileBuffer);

          // Update video doc: set new bunnyVideoGuid, mark status as processing. Delete old video only after new is ready.
          await videoRef.update({
            bunnyVideoGuid: newGuid,
            status: "processing",
            uploadedAt: new Date(),
          });

          // Asynchronously clean up old video
          if (oldGuid && oldGuid !== newGuid) {
            deleteBunnyVideo(oldGuid).catch((err) =>
              console.error(`[Replace Video] Error deleting old video ${oldGuid}:`, err)
            );
          }

          console.log(`[Replace Video] Step 3: Replacement initiated. New GUID: ${newGuid}`);
          res.status(200).json({ message: "Replacement video uploaded and processing.", newGuid });
        } catch (err) {
          console.error("[Replace Video] Error processing replacement upload:", err);
          res.status(500).json({
            code: ErrorCodes.INTERNAL_ERROR,
            message: "Failed to upload replacement video.",
          });
        }
      });

      if ((req as any).rawBody) {
        busboy.end((req as any).rawBody);
      } else {
        req.pipe(busboy);
      }
    } catch (error) {
      console.error(`[Replace Video] Error:`, error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to initiate replacement upload.",
      });
    }
  }
);

// ─── DELETE /admin/courses/:id/playlists/:playlistId/videos/:videoId ──────────

/**
 * Deletes a video from Bunny Stream and Firestore, decrementing counters.
 */
router.delete(
  "/:id/playlists/:playlistId/videos/:videoId",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id: courseId, playlistId, videoId } = req.params;

    try {
      const courseRef = db.collection("courses").doc(courseId);
      const playlistRef = courseRef.collection("playlists").doc(playlistId);
      const videoRef = playlistRef.collection("videos").doc(videoId);

      const videoSnap = await videoRef.get();
      if (!videoSnap.exists) {
        res.status(404).json({ code: ErrorCodes.NOT_FOUND, message: "Video not found." });
        return;
      }

      const videoData = videoSnap.data() as VideoDoc;
      const bunnyGuid = videoData.bunnyVideoGuid;

      await db.runTransaction(async (transaction) => {
        transaction.delete(videoRef);
        transaction.update(playlistRef, {
          totalVideos: admin.firestore.FieldValue.increment(-1),
        });
        transaction.update(courseRef, {
          totalVideos: admin.firestore.FieldValue.increment(-1),
        });
      });

      // ── Check if any OTHER video document still references this bunnyVideoGuid ──
      if (bunnyGuid) {
        const otherReferencesSnap = await db
          .collectionGroup("videos")
          .where("bunnyVideoGuid", "==", bunnyGuid)
          .limit(1)
          .get();

        if (otherReferencesSnap.empty) {
          deleteBunnyVideo(bunnyGuid).catch((err) =>
            console.error(`[Delete Video] Failed to delete Bunny video ${bunnyGuid}:`, err)
          );
          console.log(`[Delete Video] No other references — deleted from Bunny: ${bunnyGuid}`);
        } else {
          console.log(`[Delete Video] Other course(s) still reference ${bunnyGuid} — Bunny file preserved.`);
        }
      }

      res.status(200).json({ message: "Video deleted successfully." });
    } catch (error) {
      console.error(`[admin/courses DELETE /${courseId}/playlists/${playlistId}/videos/${videoId}] Error:`, error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to delete video.",
      });
    }
  }
);

export default router;
