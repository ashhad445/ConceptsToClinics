/**
 * Shared TypeScript types for the Tutor Platform backend.
 * All Firestore document shapes are defined here.
 */

// ─── Firestore Document Types ────────────────────────────────────────────────

export interface UserDoc {
  email: string;
  displayName: string;
  studentId: string;
  registeredDeviceId: string | null;
  registeredDeviceName: string | null;
  registeredDeviceFriendlyName: string | null;
  deviceStatus: "active" | "locked";
  sessionToken: string | null;
  subscriptionActive: boolean;
  subscriptionExpiry: FirebaseFirestore.Timestamp | null;
  signupCodeUsed: string;
  enrolledCourses: string[]; // array of courseIds
  createdAt: FirebaseFirestore.Timestamp;
  // ── Unauthorized attempt tracking ────────────────────────────
  attemptedDeviceId: string | null;
  attemptedDeviceName: string | null;
  attemptedDeviceFriendlyName: string | null;
  attemptedLoginAt: FirebaseFirestore.Timestamp | null;
}

export interface CourseDoc {
  title: string;
  description: string;
  thumbnail: string; // image URL
  order: number;
  isPublished: boolean;
  totalPlaylists: number; // number of playlists in this course
  totalVideos: number;   // sum of all videos across all playlists
  createdAt: FirebaseFirestore.Timestamp;
}

export interface PlaylistDoc {
  title: string;
  description: string;
  order: number;
  totalVideos: number; // number of videos in this playlist
  createdAt: FirebaseFirestore.Timestamp;
}

export interface VideoDoc {
  title: string;
  description: string;
  bunnyVideoGuid: string;
  order: number;
  isFreePreview: boolean;
  courseId: string;
  playlistId: string;
  status: "uploading" | "processing" | "ready" | "failed";
  duration?: number;
  uploadedAt?: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface SignupCodeDoc {
  createdAt: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp | null;
  usedBy: string | null; // uid of student
  usedAt: FirebaseFirestore.Timestamp | null;
  isActive: boolean;
  grantsCourses: string[]; // courseIds this code unlocks
  boundEmail: string; // lowercase, trimmed — the only email allowed to use this code
}

export interface ProgressDoc {
  videoId: string;
  courseId: string;
  playlistId?: string; // optional — populated for videos added after playlist refactor
  watchedSeconds: number;
  totalSeconds: number;
  percentComplete: number; // 0–100
  isCompleted: boolean; // true when percentComplete >= 90
  lastWatchedAt: FirebaseFirestore.Timestamp;
  firstWatchedAt: FirebaseFirestore.Timestamp;
}

// ─── Express Request Extensions ───────────────────────────────────────────────

import { Request } from "express";
import { DecodedIdToken } from "firebase-admin/auth";

/**
 * Augmented Express request — populated by middleware chain.
 */
export interface AuthenticatedRequest extends Request {
  /** Decoded Firebase ID token (set by verifyToken middleware) */
  decodedToken?: DecodedIdToken;
  /** Firestore user document (set by verifySession / verifyDevice middleware) */
  userDoc?: UserDoc;
  /** Firestore user document ID (uid) */
  uid?: string;
}

// ─── API Error Codes ──────────────────────────────────────────────────────────

export const ErrorCodes = {
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  DEVICE_MISMATCH_LOCKED: "DEVICE_MISMATCH_LOCKED",
  SESSION_INVALID: "SESSION_INVALID",
  DEVICE_MISMATCH: "DEVICE_MISMATCH",
  NOT_ENROLLED: "NOT_ENROLLED",
  SUBSCRIPTION_INACTIVE: "SUBSCRIPTION_INACTIVE",
  INVALID_SIGNUP_CODE: "INVALID_SIGNUP_CODE",
  CODE_ALREADY_USED: "CODE_ALREADY_USED",
  CODE_EXPIRED: "CODE_EXPIRED",
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
