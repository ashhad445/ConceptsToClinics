import { Response, NextFunction } from "express";
import { db } from "../config/firebase";
import { AuthenticatedRequest, UserDoc } from "../types";

/**
 * verifySession middleware
 *
 * Reads the `x-session-token` header and compares it against the
 * `sessionToken` field stored in the user's Firestore document.
 *
 * - If they match → request proceeds, userDoc attached to req.
 * - If they differ → 401 SESSION_INVALID (app should clear SecureStore and redirect to login).
 *
 * This is the mechanism that force-logs out the old device when a new device
 * triggers a lock — the new login overwrites sessionToken, so the old device's
 * next request gets a 401.
 *
 * Must be applied AFTER verifyToken.
 */
export const verifySession = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const sessionToken = req.headers["x-session-token"] as string | undefined;

  if (!sessionToken) {
    res.status(401).json({
      code: "SESSION_INVALID",
      message: "Missing x-session-token header.",
    });
    return;
  }

  if (!req.uid) {
    res.status(401).json({
      code: "UNAUTHORIZED",
      message: "Not authenticated.",
    });
    return;
  }

  try {
    const userSnap = await db.collection("users").doc(req.uid).get();

    if (!userSnap.exists) {
      res.status(404).json({
        code: "NOT_FOUND",
        message: "User document not found.",
      });
      return;
    }

    const userDoc = userSnap.data() as UserDoc;

    if (userDoc.sessionToken === null || userDoc.sessionToken !== sessionToken) {
      res.status(401).json({
        code: "SESSION_INVALID",
        message: "Session token is invalid or expired. Please log in again.",
      });
      return;
    }

    // Attach userDoc to request for downstream handlers
    req.userDoc = userDoc;
    next();
  } catch (error) {
    console.error("[verifySession] Firestore read failed:", error);
    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to verify session.",
    });
  }
};
