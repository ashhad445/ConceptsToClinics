import * as admin from "firebase-admin";
import { Router, Response } from "express";
import { db, auth } from "../../config/firebase";
import { verifyToken } from "../../middleware/verifyToken";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { AuthenticatedRequest, UserDoc, CourseDoc, ProgressDoc, ErrorCodes } from "../../types";

const router = Router();

// All routes require verifyToken + verifyAdmin
router.use(verifyToken, verifyAdmin);

// ─── GET /admin/students ──────────────────────────────────────────────────────

/**
 * Returns all student user documents.
 * Used for the students table in the admin dashboard.
 */
router.get(
  "/",
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const studentsSnap = await db
        .collection("users")
        .orderBy("createdAt", "desc")
        .get();

      const firestoreUsersMap: Record<string, boolean> = {};
      const firestoreEmailsSet = new Set<string>();

      const studentsFromFirestore = studentsSnap.docs.map((doc) => {
        const data = doc.data() as UserDoc;
        firestoreUsersMap[doc.id] = true;
        if (data.email) firestoreEmailsSet.add(data.email.toLowerCase());
        return {
          id: doc.id,
          email: data.email,
          displayName: data.displayName,
          studentId: data.studentId ?? null,
          deviceStatus: data.deviceStatus,
          subscriptionActive: data.subscriptionActive,
          subscriptionExpiry: data.subscriptionExpiry,
          enrolledCourses: data.enrolledCourses || [],
          courseExpiries: data.courseExpiries || {},
          signupCodeUsed: data.signupCodeUsed || "N/A",
          createdAt: data.createdAt,
          isAuthOnly: false,
        };
      });

      // Also list Firebase Auth users to catch accounts created in Firebase Auth
      const authUsersResult = await auth.listUsers();
      const authOnlyStudents: any[] = [];

      authUsersResult.users.forEach((authUser: any) => {
        const authEmail = authUser.email?.toLowerCase();
        if (authEmail && !firestoreEmailsSet.has(authEmail) && !firestoreUsersMap[authUser.uid]) {
          authOnlyStudents.push({
            id: authUser.uid,
            email: authUser.email,
            displayName: authUser.displayName || "Auth Account",
            studentId: "AUTH-ONLY",
            deviceStatus: "active",
            subscriptionActive: false,
            subscriptionExpiry: null,
            enrolledCourses: [],
            courseExpiries: {},
            signupCodeUsed: "N/A",
            createdAt: authUser.metadata.creationTime
              ? new Date(authUser.metadata.creationTime)
              : new Date(),
            isAuthOnly: true,
          });
        }
      });

      const allStudents = [...studentsFromFirestore, ...authOnlyStudents];

      res.status(200).json({ students: allStudents });
    } catch (error) {
      console.error("[admin/students GET] Error:", error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to fetch students.",
      });
    }
  }
);

// ─── GET /admin/students/:id ──────────────────────────────────────────────────

/**
 * Returns a single student's user document plus all their progress records.
 */
router.get(
  "/:id",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const studentId = req.params.id;

    try {
      const studentSnap = await db.collection("users").doc(studentId).get();

      if (!studentSnap.exists) {
        res.status(404).json({
          code: ErrorCodes.NOT_FOUND,
          message: "Student not found.",
        });
        return;
      }

      const studentData = studentSnap.data() as UserDoc;

      // Fetch all progress docs across all courses for this student
      const progressSnap = await db
        .collection("users")
        .doc(studentId)
        .collection("progress")
        .get();

      const playlistCache: Record<string, string> = {};
      const videoCache: Record<string, string> = {};

      const progress = await Promise.all(
        progressSnap.docs.map(async (doc) => {
          const pData = doc.data() as ProgressDoc;
          let playlistTitle = pData.playlistTitle || null;
          let videoTitle = pData.videoTitle || null;

          if (!playlistTitle && pData.courseId && pData.playlistId) {
            const cacheKey = `${pData.courseId}_${pData.playlistId}`;
            if (playlistCache[cacheKey]) {
              playlistTitle = playlistCache[cacheKey];
            } else {
              try {
                const plSnap = await db
                  .collection("courses")
                  .doc(pData.courseId)
                  .collection("playlists")
                  .doc(pData.playlistId)
                  .get();
                if (plSnap.exists) {
                  playlistTitle = plSnap.data()?.title || null;
                  if (playlistTitle) playlistCache[cacheKey] = playlistTitle;
                }
              } catch (e) {}
            }
          }

          if (!videoTitle && pData.courseId && pData.videoId) {
            const cacheKey = `${pData.courseId}_${pData.videoId}`;
            if (videoCache[cacheKey]) {
              videoTitle = videoCache[cacheKey];
            } else {
              try {
                let vSnap;
                if (pData.playlistId) {
                  vSnap = await db
                    .collection("courses")
                    .doc(pData.courseId)
                    .collection("playlists")
                    .doc(pData.playlistId)
                    .collection("videos")
                    .doc(pData.videoId)
                    .get();
                }
                if (!vSnap || !vSnap.exists) {
                  vSnap = await db
                    .collection("courses")
                    .doc(pData.courseId)
                    .collection("videos")
                    .doc(pData.videoId)
                    .get();
                }
                if (vSnap.exists) {
                  videoTitle = vSnap.data()?.title || null;
                  if (videoTitle) videoCache[cacheKey] = videoTitle;
                }
              } catch (e) {}
            }
          }

          return {
            id: doc.id,
            videoId: pData.videoId,
            videoTitle: videoTitle || null,
            courseId: pData.courseId,
            playlistId: pData.playlistId || null,
            playlistTitle: playlistTitle || null,
            watchedSeconds: pData.watchedSeconds || 0,
            totalSeconds: pData.totalSeconds || 0,
            percentComplete: pData.percentComplete || 0,
            isCompleted: pData.isCompleted || false,
            lastWatchedAt: pData.lastWatchedAt,
            firstWatchedAt: pData.firstWatchedAt,
          };
        })
      );

      res.status(200).json({
        student: {
          id: studentSnap.id,
          email: studentData.email,
          displayName: studentData.displayName,
          studentId: studentData.studentId ?? null,
          deviceStatus: studentData.deviceStatus,
          registeredDeviceId: studentData.registeredDeviceId,
          registeredDeviceName: studentData.registeredDeviceName ?? null,
          registeredDeviceFriendlyName: studentData.registeredDeviceFriendlyName ?? null,
          attemptedDeviceId: studentData.attemptedDeviceId || null,
          attemptedDeviceName: studentData.attemptedDeviceName || null,
          attemptedDeviceFriendlyName: studentData.attemptedDeviceFriendlyName || null,
          attemptedLoginAt: studentData.attemptedLoginAt || null,
          subscriptionActive: studentData.subscriptionActive,
          subscriptionExpiry: studentData.subscriptionExpiry,
          enrolledCourses: studentData.enrolledCourses || [],
          courseExpiries: studentData.courseExpiries || {},
          signupCodeUsed: studentData.signupCodeUsed,
          createdAt: studentData.createdAt,
        },
        progress,
      });
    } catch (error) {
      console.error(`[admin/students GET /${studentId}] Error:`, error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to fetch student.",
      });
    }
  }
);

// ─── PUT /admin/students/:id ──────────────────────────────────────────────────

/**
 * Updates a student's subscription status, expiry, or enrolled courses/courseExpiries.
 * Used for toggling subscriptions and manually adding/removing course access.
 *
 * Body: { subscriptionActive?, subscriptionExpiry?, enrolledCourses?, courseExpiries? }
 */
router.put(
  "/:id",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const studentId = req.params.id;
    const { subscriptionActive, subscriptionExpiry, enrolledCourses, courseExpiries } = req.body;

    try {
      const studentRef = db.collection("users").doc(studentId);
      const studentSnap = await studentRef.get();

      if (!studentSnap.exists) {
        res.status(404).json({
          code: ErrorCodes.NOT_FOUND,
          message: "Student not found.",
        });
        return;
      }

      const existingData = studentSnap.data() as UserDoc;
      const updates: Partial<Record<string, unknown>> = {};

      if (subscriptionActive !== undefined) {
        if (typeof subscriptionActive !== "boolean") {
          res.status(400).json({
            code: ErrorCodes.INTERNAL_ERROR,
            message: "subscriptionActive must be a boolean.",
          });
          return;
        }
        updates.subscriptionActive = subscriptionActive;
      }

      if (subscriptionExpiry !== undefined) {
        updates.subscriptionExpiry = subscriptionExpiry ? new Date(subscriptionExpiry) : null;
      }

      const now = new Date();
      let updatedExpiries: Record<string, any> = { ...(existingData.courseExpiries || {}) };

      if (courseExpiries !== undefined && typeof courseExpiries === "object" && courseExpiries !== null) {
        Object.keys(courseExpiries).forEach((cId) => {
          const val = courseExpiries[cId];
          if (val === null || val === "") {
            delete updatedExpiries[cId];
          } else {
            updatedExpiries[cId] = admin.firestore.Timestamp.fromDate(new Date(val));
          }
        });
        updates.courseExpiries = updatedExpiries;
      }

      if (enrolledCourses !== undefined) {
        if (!Array.isArray(enrolledCourses)) {
          res.status(400).json({
            code: ErrorCodes.INTERNAL_ERROR,
            message: "enrolledCourses must be an array of course IDs.",
          });
          return;
        }
        updates.enrolledCourses = enrolledCourses;

        // Auto-calculate expiries for newly added courses if not already explicitly set
        await Promise.all(
          enrolledCourses.map(async (cId: string) => {
            if (!updatedExpiries[cId]) {
              const cSnap = await db.collection("courses").doc(cId).get();
              if (cSnap.exists) {
                const cData = cSnap.data() as CourseDoc;
                const days = cData.durationDays != null ? cData.durationDays : 365;
                if (days > 0) {
                  const expDate = new Date(now.getTime() + days * 86400 * 1000);
                  updatedExpiries[cId] = admin.firestore.Timestamp.fromDate(expDate);
                }
              }
            }
          })
        );

        updates.courseExpiries = updatedExpiries;
      }

      if (Object.keys(updates).length === 0) {
        res.status(400).json({
          code: ErrorCodes.INTERNAL_ERROR,
          message: "No valid fields provided to update.",
        });
        return;
      }

      await studentRef.update(updates);

      console.log(`[admin/students PUT /${studentId}] Updated:`, Object.keys(updates));

      res.status(200).json({ message: "Student updated successfully." });
    } catch (error) {
      console.error(`[admin/students PUT /${studentId}] Error:`, error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to update student.",
      });
    }
  }
);

// ─── POST /admin/students/:id/reset-device ────────────────────────────────────

/**
 * Resets a student's device lock.
 * Clears registeredDeviceId, sessionToken, and sets deviceStatus to "active".
 * Student can log in fresh on any device after this.
 */
router.post(
  "/:id/reset-device",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const studentId = req.params.id;

    try {
      const studentRef = db.collection("users").doc(studentId);
      const studentSnap = await studentRef.get();

      if (!studentSnap.exists) {
        res.status(404).json({
          code: ErrorCodes.NOT_FOUND,
          message: "Student not found.",
        });
        return;
      }

      await studentRef.update({
        registeredDeviceId: null,
        registeredDeviceName: null,
        registeredDeviceFriendlyName: null,
        registeredDeviceAt: null,
        attemptedDeviceId: null,
        attemptedDeviceName: null,
        attemptedDeviceFriendlyName: null,
        attemptedLoginAt: null,
        deviceStatus: "active",
        sessionToken: null,
      });

      console.log(`[admin/students reset-device] Device reset for uid: ${studentId}`);

      res.status(200).json({
        message: "Device reset successful. Student can now log in on any device.",
      });
    } catch (error) {
      console.error(`[admin/students reset-device /${studentId}] Error:`, error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to reset device.",
      });
    }
  }
);

// ─── GET /admin/students/:id/progress ─────────────────────────────────────────

/**
 * Returns all progress documents across all courses for a student.
 * Used in the admin dashboard to see detailed video-by-video progress.
 */
router.get(
  "/:id/progress",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const studentId = req.params.id;

    try {
      const progressSnap = await db
        .collection("users")
        .doc(studentId)
        .collection("progress")
        .get();

      const progress = progressSnap.docs.map((doc) => {
        const data = doc.data() as ProgressDoc;
        return {
          videoId: doc.id,
          courseId: data.courseId,
          watchedSeconds: data.watchedSeconds,
          totalSeconds: data.totalSeconds,
          percentComplete: data.percentComplete,
          isCompleted: data.isCompleted,
          lastWatchedAt: data.lastWatchedAt,
          firstWatchedAt: data.firstWatchedAt,
        };
      });

      res.status(200).json({ progress });
    } catch (error) {
      console.error(`[admin/students GET /${studentId}/progress] Error:`, error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to fetch student progress.",
      });
    }
  }
);

// ─── DELETE /admin/students/:id ────────────────────────────────────────────────

/**
 * Deletes a student user account from both Firebase Auth and Firestore.
 */
router.delete(
  "/:id",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const studentId = req.params.id;

    try {
      // Delete from Firebase Auth if exists
      try {
        await auth.deleteUser(studentId);
      } catch (authErr: any) {
        if (authErr.code !== "auth/user-not-found") {
          console.warn(`[admin/students DELETE /${studentId}] Auth deletion note:`, authErr);
        }
      }

      // Delete from Firestore users collection if exists
      const userRef = db.collection("users").doc(studentId);
      const userSnap = await userRef.get();
      if (userSnap.exists) {
        await userRef.delete();
      }

      res.status(200).json({ message: "Student account deleted successfully." });
    } catch (error) {
      console.error(`[admin/students DELETE /${studentId}] Error:`, error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to delete student account.",
      });
    }
  }
);

export default router;
