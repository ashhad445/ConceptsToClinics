import { Router, Request, Response } from "express";
import { db } from "../config/firebase";
import { verifyToken } from "../middleware/verifyToken";
import { verifyAdmin } from "../middleware/verifyAdmin";
import { ErrorCodes } from "../types";

export const publicConfigRouter = Router();
export const adminConfigRouter = Router();

export interface VersionConfig {
  minRequiredVersion: string;
  latestVersion: string;
  downloadUrl: string;
  message: string;
}

const DEFAULT_CONFIG: VersionConfig = {
  minRequiredVersion: "1.0.0",
  latestVersion: "1.0.0",
  downloadUrl: "https://conceptstoclinics.com",
  message: "A required update for Concepts To Clinics is available. Please update the app to continue.",
};

// ─── GET /config/version (Public) ─────────────────────────────────────────────
publicConfigRouter.get("/version", async (_req: Request, res: Response): Promise<void> => {
  try {
    const configDoc = await db.collection("system").doc("config").get();
    if (!configDoc.exists) {
      // Initialize default configuration
      await db.collection("system").doc("config").set(DEFAULT_CONFIG);
      res.status(200).json(DEFAULT_CONFIG);
      return;
    }

    const data = configDoc.data() as Partial<VersionConfig>;
    res.status(200).json({
      minRequiredVersion: data.minRequiredVersion || "1.0.0",
      latestVersion: data.latestVersion || "1.0.0",
      downloadUrl: data.downloadUrl || DEFAULT_CONFIG.downloadUrl,
      message: data.message || DEFAULT_CONFIG.message,
    });
  } catch (error) {
    console.error("[GET /config/version] Error:", error);
    res.status(500).json({
      code: ErrorCodes.INTERNAL_ERROR,
      message: "Failed to fetch version configuration.",
    });
  }
});

// ─── PUT /admin/config/version (Admin Only) ──────────────────────────────────
adminConfigRouter.put(
  "/version",
  verifyToken,
  verifyAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { minRequiredVersion, latestVersion, downloadUrl, message } = req.body;

      const updateData: Partial<VersionConfig> = {};
      if (typeof minRequiredVersion === "string" && minRequiredVersion.trim()) {
        updateData.minRequiredVersion = minRequiredVersion.trim();
      }
      if (typeof latestVersion === "string" && latestVersion.trim()) {
        updateData.latestVersion = latestVersion.trim();
      }
      if (typeof downloadUrl === "string" && downloadUrl.trim()) {
        updateData.downloadUrl = downloadUrl.trim();
      }
      if (typeof message === "string" && message.trim()) {
        updateData.message = message.trim();
      }

      await db.collection("system").doc("config").set(updateData, { merge: true });

      const updatedSnap = await db.collection("system").doc("config").get();
      res.status(200).json({
        message: "Version configuration updated successfully.",
        config: updatedSnap.data(),
      });
    } catch (error) {
      console.error("[PUT /admin/config/version] Error:", error);
      res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Failed to update version configuration.",
      });
    }
  }
);
