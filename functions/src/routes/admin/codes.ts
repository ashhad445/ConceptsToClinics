import { Router, Response } from "express";
import * as crypto from "crypto";
import { db } from "../../config/firebase";
import { verifyToken } from "../../middleware/verifyToken";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { AuthenticatedRequest, SignupCodeDoc, ErrorCodes } from "../../types";

const router = Router();

// All routes require verifyToken + verifyAdmin
router.use(verifyToken, verifyAdmin);

// ─── Helper: Generate signup code in AX7K-29QP format ────────────────────────

const generateCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1 to avoid confusion
  const part = (len: number) =>
    Array.from({ length: len }, () =>
      chars[crypto.randomInt(chars.length)]
    ).join("");
  return `${part(4)}-${part(4)}`;
};

// ─── POST /admin/codes/generate ───────────────────────────────────────────────

/**
 * Generates a new signup code granting access to one or more courses.
 *
 * Body: { grantsCourses: string[], expiresAt?: ISO date string }
 *
 * Validates all courseIds exist in Firestore before creating the code.
 */
router.post(
  "/generate",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { email, grantsCourses, expiresAt } = req.body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      res.status(400).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "A valid email is required.",
      });
      return;
    }

    if (!grantsCourses || !Array.isArray(grantsCourses) || grantsCourses.length === 0) {
      res.status(400).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "grantsCourses must be a non-empty array of course IDs.",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      // Validate all courseIds exist
      const courseChecks = await Promise.all(
        grantsCourses.map((id: string) => db.collection("courses").doc(id).get())
      );

      const missingCourses = courseChecks
        .filter((snap) => !snap.exists)
        .map((snap) => snap.id);

      if (missingCourses.length > 0) {
        res.status(400).json({
          code: ErrorCodes.NOT_FOUND,
          message: `The following course IDs do not exist: ${missingCourses.join(", ")}`,
        });
        return;
      }

      // Generate a unique code (retry if collision — extremely rare)
      let code = generateCode();
      let attempts = 0;
      while (attempts < 5) {
        const existing = await db.collection("signupCodes").doc(code).get();
        if (!existing.exists) break;
        code = generateCode();
        attempts++;
      }

      const now = new Date();
      const codeDoc: SignupCodeDoc = {
        createdAt: now as unknown as FirebaseFirestore.Timestamp,
        expiresAt: expiresAt
          ? (new Date(expiresAt) as unknown as FirebaseFirestore.Timestamp)
          : null,
        usedBy: null,
        usedAt: null,
        isActive: true,
        grantsCourses,
        boundEmail: normalizedEmail,
      };

      await db.collection("signupCodes").doc(code).set(codeDoc);

      console.log(`[admin/codes/generate] Code created: ${code} → email: ${normalizedEmail}, courses: ${grantsCourses.join(", ")}`);

      res.status(201).json({ code, boundEmail: normalizedEmail, grantsCourses });
    } catch (error) {
      console.error("[admin/codes/generate] Error:", error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to generate signup code.",
      });
    }
  }
);

// ─── GET /admin/codes ─────────────────────────────────────────────────────────

/**
 * Returns all signup codes with their usage status.
 * Ordered by creation date descending (newest first).
 */
router.get(
  "/",
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const codesSnap = await db
        .collection("signupCodes")
        .orderBy("createdAt", "desc")
        .get();

      // Fetch display names for used codes (to show "used by: John" in dashboard)
      const usedUids = codesSnap.docs
        .map((doc) => (doc.data() as SignupCodeDoc).usedBy)
        .filter((uid): uid is string => uid !== null);

      const userNameMap: Record<string, string> = {};
      if (usedUids.length > 0) {
        const userSnaps = await Promise.all(
          [...new Set(usedUids)].map((uid) => db.collection("users").doc(uid).get())
        );
        userSnaps.forEach((snap) => {
          if (snap.exists) {
            userNameMap[snap.id] = snap.data()?.displayName ?? snap.data()?.email ?? snap.id;
          }
        });
      }

      const codes = codesSnap.docs.map((doc) => {
        const data = doc.data() as SignupCodeDoc;
        return {
          code: doc.id,
          grantsCourses: data.grantsCourses,
          boundEmail: data.boundEmail,
          isActive: data.isActive,
          createdAt: data.createdAt,
          expiresAt: data.expiresAt,
          usedBy: data.usedBy,
          usedByName: data.usedBy ? (userNameMap[data.usedBy] ?? null) : null,
          usedAt: data.usedAt,
        };
      });

      res.status(200).json({ codes });
    } catch (error) {
      console.error("[admin/codes GET] Error:", error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to fetch signup codes.",
      });
    }
  }
);

// ─── DELETE /admin/codes/:code ────────────────────────────────────────────────

/**
 * Soft-deletes a signup code by setting isActive: false.
 * Only works on unused codes.
 */
router.delete(
  "/:code",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const code = req.params.code.toUpperCase();

    try {
      const codeRef = db.collection("signupCodes").doc(code);
      const codeSnap = await codeRef.get();

      if (!codeSnap.exists) {
        res.status(404).json({
          code: ErrorCodes.NOT_FOUND,
          message: "Signup code not found.",
        });
        return;
      }

      await codeRef.update({ isActive: false });

      res.status(200).json({ message: `Code ${code} deactivated.` });
    } catch (error) {
      console.error(`[admin/codes DELETE /${code}] Error:`, error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to deactivate signup code.",
      });
    }
  }
);

export default router;
