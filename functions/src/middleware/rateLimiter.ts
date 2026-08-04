import rateLimit from "express-rate-limit";

/**
 * Rate limiter for registration attempts.
 * Prevents brute-forcing signup codes.
 * Limits by IP address.
 */
export const registerRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 registration attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: "TOO_MANY_REQUESTS",
    message: "Too many registration attempts. Please try again in 15 minutes.",
  },
});

/**
 * Rate limiter for login attempts.
 * Prevents credential stuffing / brute force login attempts.
 * Limits by IP address.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: "TOO_MANY_REQUESTS",
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
});
