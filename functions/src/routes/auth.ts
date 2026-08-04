import { Router, Response } from "express";
import * as crypto from "crypto";
import { auth, db, admin } from "../config/firebase";
import { verifyToken } from "../middleware/verifyToken";
import { registerRateLimiter, loginRateLimiter } from "../middleware/rateLimiter";
import { AuthenticatedRequest, UserDoc, SignupCodeDoc, ErrorCodes } from "../types";

const router = Router();

// ── Helpers ─────────────────────────────────────────────────────────────────────

const generateSessionToken = (): string =>
  crypto.randomBytes(32).toString("hex");

/**
 * Generates a guaranteed-unique CC-XXXXXX student ID.
 * Uses characters that avoid visual ambiguity (no 0/O, 1/I/L).
 */
const generateStudentId = async (firestore: FirebaseFirestore.Firestore): Promise<string> => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let unique = false;
  let studentId = '';

  while (!unique) {
    studentId = 'CC-';
    for (let i = 0; i < 6; i++) {
      studentId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await firestore
      .collection('users')
      .where('studentId', '==', studentId)
      .limit(1)
      .get();
    if (existing.empty) unique = true;
  }

  return studentId;
};

// ─── POST /auth/register ──────────────────────────────────────────────────────

/**
 * Registers a new student.
 *
 * Flow:
 *  1. Validate signupCode — must exist, be active, and unused.
 *  2. Check code has not expired.
 *  3. Create Firebase Auth user via Admin SDK.
 *  4. Write users/{uid} doc, copying grantsCourses → enrolledCourses.
 *  5. Mark signupCode as used.
 */
router.post("/register", registerRateLimiter, async (req, res): Promise<void> => {
  const { email, password, displayName, signupCode } = req.body;

  // ── Input validation ──────────────────────────────────────────────────────
  if (!email || !password || !displayName || !signupCode) {
    res.status(400).json({
      code: ErrorCodes.INVALID_SIGNUP_CODE,
      message: "Missing required fields: email, password, displayName, signupCode.",
    });
    return;
  }

  try {
    // ── 1. Validate signup code ───────────────────────────────────────────────
    const codeRef = db.collection("signupCodes").doc(signupCode.trim().toUpperCase());
    const codeSnap = await codeRef.get();

    if (!codeSnap.exists) {
      res.status(400).json({
        code: ErrorCodes.INVALID_SIGNUP_CODE,
        message: "Signup code is invalid.",
      });
      return;
    }

    const codeDoc = codeSnap.data() as SignupCodeDoc;

    if (!codeDoc.isActive) {
      res.status(400).json({
        code: ErrorCodes.INVALID_SIGNUP_CODE,
        message: "Signup code is no longer active.",
      });
      return;
    }

    if (codeDoc.usedBy !== null) {
      res.status(400).json({
        code: ErrorCodes.CODE_ALREADY_USED,
        message: "This signup code has already been used.",
      });
      return;
    }

    // ── Check email matches the code's bound email ──────────────────────
    const normalizedInputEmail = email.trim().toLowerCase();
    if (codeDoc.boundEmail && codeDoc.boundEmail !== normalizedInputEmail) {
      res.status(400).json({
        code: ErrorCodes.INVALID_SIGNUP_CODE,
        message: "This signup code is not valid for this email address.",
      });
      return;
    }

    // ── 2. Check expiry ───────────────────────────────────────────────────────
    if (codeDoc.expiresAt && codeDoc.expiresAt.toDate() < new Date()) {
      res.status(400).json({
        code: ErrorCodes.CODE_EXPIRED,
        message: "This signup code has expired.",
      });
      return;
    }

    // ── 3. Create Firebase Auth user ───────────────────────────────────
    const userRecord = await auth.createUser({
      email: email.trim().toLowerCase(),
      password,
      displayName: displayName.trim(),
    });

    const uid = userRecord.uid;
    const now = new Date();

    // ── 3b. Generate unique student ID ────────────────────────────────
    const studentId = await generateStudentId(db);

    // ── 4. Write users/{uid} document ───────────────────────────────
    const userDoc: UserDoc = {
      email: email.trim().toLowerCase(),
      displayName: displayName.trim(),
      studentId,
      registeredDeviceId: null,
      registeredDeviceName: null,
      registeredDeviceFriendlyName: null,
      deviceStatus: "active",
      sessionToken: null,
      subscriptionActive: true,
      subscriptionExpiry: null,
      signupCodeUsed: signupCode.trim().toUpperCase(),
      enrolledCourses: codeDoc.grantsCourses,
      createdAt: now as unknown as FirebaseFirestore.Timestamp,
      attemptedDeviceId: null,
      attemptedDeviceName: null,
      attemptedDeviceFriendlyName: null,
      attemptedLoginAt: null,
    };

    await db.collection("users").doc(uid).set(userDoc);

    // ── 5. Mark signup code as used ───────────────────────────────────────────
    await codeRef.update({
      usedBy: uid,
      usedAt: now,
      isActive: false,
    });

    console.log(`[register] New student registered: ${uid} (${email}) using code ${signupCode}`);

    res.status(201).json({
      message: "Registration successful. You can now log in.",
    });
  } catch (error: unknown) {
    console.error("[register] Error:", error);

    // Handle Firebase Auth errors (e.g. email already in use)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "auth/email-already-exists"
    ) {
      res.status(409).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "An account with this email already exists.",
      });
      return;
    }

    res.status(500).json({
      code: ErrorCodes.INTERNAL_ERROR,
      message: "Registration failed. Please try again.",
    });
  }
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────

/**
 * Logs in a student and handles device binding.
 *
 * Device binding logic:
 *  - Account locked → 403 ACCOUNT_LOCKED
 *  - No registered device → bind this device, issue sessionToken
 *  - Same device → refresh sessionToken
 *  - Different device → lock account, return 403 DEVICE_MISMATCH_LOCKED
 *
 * Uses verifyToken middleware to verify Firebase ID token first.
 */
router.post("/login", loginRateLimiter, verifyToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const deviceId = req.headers["x-device-id"] as string | undefined;
  const { deviceName, deviceFriendlyName } = req.body as {
    deviceName?: string;
    deviceFriendlyName?: string;
  };

  if (!deviceId) {
    res.status(400).json({
      code: ErrorCodes.UNAUTHORIZED,
      message: "Missing x-device-id header.",
    });
    return;
  }

  const uid = req.uid!;

  try {
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      res.status(404).json({
        code: ErrorCodes.NOT_FOUND,
        message: "User document not found. Please register first.",
      });
      return;
    }

    const userDoc = userSnap.data() as UserDoc;

    // ── Account locked check ──────────────────────────────────────────────────
    if (userDoc.deviceStatus === "locked") {
      res.status(403).json({
        code: ErrorCodes.ACCOUNT_LOCKED,
        message:
          "Your account has been locked due to an unauthorised login attempt. Please contact your instructor to restore access.",
      });
      return;
    }

    const sessionToken = generateSessionToken();

    // ── No device registered yet → bind this device ──────────────────────────────────
    if (userDoc.registeredDeviceId === null) {
      await userRef.update({
        registeredDeviceId: deviceId,
        registeredDeviceName: deviceName ?? null,
        registeredDeviceFriendlyName: deviceFriendlyName ?? null,
        sessionToken,
        deviceStatus: "active",
      });

      console.log(`[login] First login for uid ${uid}. Device bound: ${deviceId}`);

      res.status(200).json({ sessionToken, studentId: userDoc.studentId });
      return;
    }

    // ── Same device → refresh session ───────────────────────────────────────
    if (userDoc.registeredDeviceId === deviceId) {
      await userRef.update({ sessionToken });

      console.log(`[login] Session refreshed for uid ${uid}`);

      res.status(200).json({ sessionToken, studentId: userDoc.studentId });
      return;
    }

    // ── Different device → save attempted device info, then lock account ──────
    await userRef.update({
      deviceStatus: "locked",
      sessionToken: null,
      attemptedDeviceId: deviceId,
      attemptedDeviceName: deviceName ?? null,
      attemptedDeviceFriendlyName: deviceFriendlyName ?? null,
      attemptedLoginAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.warn(
      `[login] Device mismatch for uid ${uid}. Registered: ${userDoc.registeredDeviceId}, Attempted: ${deviceId}. Account locked.`
    );

    res.status(403).json({
      code: ErrorCodes.DEVICE_MISMATCH_LOCKED,
      message:
        "Login attempt from an unrecognised device. Your account has been locked. Please contact your instructor.",
    });
  } catch (error) {
    console.error("[login] Error:", error);
    res.status(500).json({
      code: ErrorCodes.INTERNAL_ERROR,
      message: "Login failed. Please try again.",
    });
  }
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────

/**
 * Logs out the student by invalidating their session token.
 * The mobile app should also clear SecureStore on its end.
 */
router.post("/logout", verifyToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const uid = req.uid!;

  try {
    await db.collection("users").doc(uid).update({ sessionToken: null });

    console.log(`[logout] Session cleared for uid ${uid}`);

    res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("[logout] Error:", error);
    res.status(500).json({
      code: ErrorCodes.INTERNAL_ERROR,
      message: "Logout failed. Please try again.",
    });
  }
});

export default router;
