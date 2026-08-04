import { onRequest } from "firebase-functions/v2/https";
import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import coursesRouter from "./routes/courses";
import videosRouter from "./routes/videos";
import progressRouter from "./routes/progress";
import adminRouter from "./routes/admin";
import webhooksRouter from "./routes/webhooks";

// Load .env for local development (no-op in production)
dotenv.config();

// ─── App Setup ────────────────────────────────────────────────────────────────

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Route Stubs (to be filled in Phase 2 onwards) ───────────────────────────

// Auth routes — Phase 2
app.use("/auth", authRouter);

// Content routes — Phase 3
app.use("/courses", coursesRouter);
app.use("/videos", videosRouter);
app.use("/progress", progressRouter);

// Admin routes — Phase 4
app.use("/admin", adminRouter);

// Webhooks
app.use("/webhooks", webhooksRouter);

// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ code: "NOT_FOUND", message: "Route not found." });
});

// ─── Export to Firebase Functions ─────────────────────────────────────────────

export const api = onRequest(
  { region: "asia-south1" }, // Closest region to Pakistan
  app
);
