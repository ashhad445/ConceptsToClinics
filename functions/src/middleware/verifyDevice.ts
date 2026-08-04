import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";

/**
 * verifyDevice middleware
 *
 * Reads the `x-device-id` header and compares it against the
 * `registeredDeviceId` stored in the user's Firestore document.
 *
 * This middleware relies on verifySession having run first (userDoc attached).
 *
 * - If account is locked → 403 ACCOUNT_LOCKED
 * - If device ID matches → proceed
 * - If device ID differs → 403 DEVICE_MISMATCH
 *
 * Note: Device locking itself happens in the login handler.
 * This middleware only enforces the check on content routes.
 */
export const verifyDevice = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const deviceId = req.headers["x-device-id"] as string | undefined;

  if (!deviceId) {
    res.status(401).json({
      code: "UNAUTHORIZED",
      message: "Missing x-device-id header.",
    });
    return;
  }

  const userDoc = req.userDoc;

  if (!userDoc) {
    // Should not happen if verifySession ran first
    res.status(401).json({
      code: "UNAUTHORIZED",
      message: "User session not verified.",
    });
    return;
  }

  if (userDoc.deviceStatus === "locked") {
    res.status(403).json({
      code: "ACCOUNT_LOCKED",
      message: "Your account has been locked due to an unauthorised login attempt. Please contact your instructor to restore access.",
    });
    return;
  }

  if (userDoc.registeredDeviceId && userDoc.registeredDeviceId !== deviceId) {
    res.status(403).json({
      code: "DEVICE_MISMATCH",
      message: "Device ID does not match the registered device.",
    });
    return;
  }

  next();
};
