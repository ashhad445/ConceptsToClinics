import { Response, NextFunction } from "express";
import { auth } from "../config/firebase";
import { AuthenticatedRequest } from "../types";

/**
 * verifyToken middleware
 *
 * Extracts the Firebase ID token from the `Authorization: Bearer <token>` header,
 * verifies it against Firebase Auth, and attaches the decoded token to `req.decodedToken`.
 *
 * Applied to ALL protected routes.
 */
export const verifyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      code: "UNAUTHORIZED",
      message: "Missing or malformed Authorization header. Expected: Bearer <idToken>",
    });
    return;
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.decodedToken = decodedToken;
    req.uid = decodedToken.uid;
    next();
  } catch (error) {
    console.error("[verifyToken] Token verification failed:", error);
    res.status(401).json({
      code: "UNAUTHORIZED",
      message: "Invalid or expired ID token.",
    });
  }
};
