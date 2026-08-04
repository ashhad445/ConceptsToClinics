import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";

/**
 * verifyAdmin middleware
 *
 * Checks that the authenticated caller's UID matches the ADMIN_UID environment variable.
 * Must be applied AFTER verifyToken (relies on req.uid being set).
 *
 * Applied to ALL /admin/* routes.
 */
export const verifyAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const adminUid = process.env.ADMIN_UID;

  if (!adminUid) {
    console.error("[verifyAdmin] ADMIN_UID environment variable is not set.");
    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Server misconfiguration: ADMIN_UID not set.",
    });
    return;
  }

  if (!req.uid) {
    // Should never reach here if verifyToken ran first
    res.status(401).json({
      code: "UNAUTHORIZED",
      message: "Not authenticated.",
    });
    return;
  }

  if (req.uid !== adminUid) {
    console.warn(`[verifyAdmin] Unauthorised admin access attempt by UID: ${req.uid}`);
    res.status(403).json({
      code: "UNAUTHORIZED",
      message: "You do not have permission to access this resource.",
    });
    return;
  }

  next();
};
