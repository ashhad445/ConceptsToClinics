# Tutor Platform — Full Project Brief
> This document contains the complete context, architecture, data models, and build instructions for an AI agent or developer to understand and build this project from scratch.

---

## Project Overview

A private video lecture platform for a single tutor (client: Aftab). The system prevents content piracy through device binding, screen capture prevention, and code-gated registration. Students pay the tutor directly — no in-app payments.

The system consists of three separate products:
1. **Android Mobile App** — students watch lectures
2. **Admin Dashboard** — tutor manages everything
3. **Marketing Website** — public-facing site to attract students

---

## Business Logic (Read This First)

- Tutor collects payment manually (bank transfer, cash, etc.)
- Tutor generates a unique signup code per student from the dashboard and selects which course(s) that code grants access to
- Student registers on the app using that code — codes are one-time use only
- On registration, the student's `enrolledCourses` array is populated from the code's `grantsCourses` field
- Student only sees and can access the specific courses they are enrolled in — not all courses
- Student's account is permanently bound to their first login device
- If a student attempts login from a different device, their account is immediately locked on ALL devices
- Tutor manually resets the device lock from the dashboard
- Tutor can also manually add or remove course enrollments from a student's profile at any time
- Tutor manages all video content via Vimeo and organizes it into courses in the dashboard

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | React Native (Bare Workflow), TypeScript |
| App Navigation | React Navigation v6 |
| App State | Zustand |
| Video Playback | Vimeo WebView embed (react-native-webview) |
| Screen Protection | react-native-screen-capture-prevent |
| Secure Storage | expo-secure-store |
| HTTP Client | Axios |
| Backend | Firebase Cloud Functions (Node.js, TypeScript) |
| Auth | Firebase Authentication (email/password) |
| Database | Firestore |
| Video Hosting | Vimeo Starter Plan |
| Admin Dashboard | React + Vite + TypeScript + Tailwind CSS |
| Dashboard Hosting | Vercel |
| Marketing Site | Next.js + Tailwind CSS |
| Marketing Hosting | Vercel |
| Contact Form | Formspree (no backend needed) |

---

## Project Structure (Three Separate Repos or Monorepo)

```
tutor-platform/
  mobile-app/        → React Native app for students
  admin-dashboard/   → React web app for tutor
  marketing-site/    → Next.js public marketing page
  functions/         → Firebase Cloud Functions (backend)
```

---

## Product 1 — Mobile App (React Native)

### Screens

```
SplashScreen
AuthStack/
  LoginScreen
  RegisterScreen        → requires signup code
  AccountLockedScreen   → shown when deviceStatus is "locked"
AppStack/
  HomeScreen            → list of ENROLLED courses only, with progress bars
  CourseScreen          → list of videos in a course
  VideoPlayerScreen     → Vimeo WebView player + FLAG_SECURE
  ProfileScreen         → student info, subscription status, logout
```

### Key Behaviours

**Registration:**
- Student enters name, email, password, and signup code
- App calls backend `POST /auth/register`
- Backend validates code, creates Firebase Auth user, saves user doc to Firestore
- Backend copies `grantsCourses` from the signup code into the user's `enrolledCourses` array
- Backend marks signup code as used (usedBy, usedAt, isActive: false)
- On success, app logs student in automatically

**Login:**
- Student enters email and password
- Firebase Auth handles credential check
- App gets Firebase ID token
- App retrieves deviceId from SecureStore (or generates and saves one if first time)
- App sends ID token + deviceId to backend `POST /auth/login`
- Backend performs device binding check (see Device Binding Logic below)
- On success, backend returns sessionToken
- App saves sessionToken to SecureStore

**Every API Request:**
- App sends Firebase ID token + sessionToken in request headers
- Backend verifies both on every protected route
- If sessionToken mismatch → return 401 → app clears SecureStore → forces back to LoginScreen
- This is how force logout works on the old device when a new device is attempted

**Home Screen — Enrolled Courses Only:**
- App calls `GET /courses` which returns ONLY courses the student is enrolled in
- Each course card shows title, thumbnail, and a progress bar
- Progress bar: `(completedVideos / course.totalVideos) * 100`
- Student cannot see or access any course they are not enrolled in

**Video Playback:**
- App requests stream access from backend `GET /videos/:id/stream`
- Backend checks: valid token + sessionToken match + subscriptionActive + deviceId match + student is enrolled in this video's course
- Backend returns Vimeo embed URL
- App renders Vimeo player inside WebView
- FLAG_SECURE is enabled on this screen only (blocks screenshots + screen recording)
- App sends progress update to backend every 15 seconds while playing
- App sends final progress update on pause or exit

**Progress Tracking:**
- Each video shows a checkmark when `isCompleted: true` (threshold: 90% watched)
- Video player resumes from `watchedSeconds` position on re-open

**Account Locked Screen:**
- Shown when backend returns `ACCOUNT_LOCKED` or `DEVICE_MISMATCH_LOCKED` error
- Message: "Your account has been locked due to an unauthorised login attempt. Please contact your instructor to restore access."
- No way to proceed from this screen except tutor reset

### Device ID Generation

```typescript
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const getDeviceId = async (): Promise<string> => {
  let id = await SecureStore.getItemAsync('deviceId');
  if (!id) {
    id = Crypto.randomUUID();
    await SecureStore.setItemAsync('deviceId', id);
  }
  return id;
};
```

---

## Product 2 — Admin Dashboard (React + Vite)

### Pages

```
/login                         → Firebase Auth, single admin account
/students                      → table of all students
/students/:id                  → student detail, enrolled courses, progress, device reset
/codes                         → list of all signup codes + usage status
/codes/generate                → generate new code, select which courses it grants
/courses                       → list of all courses
/courses/new                   → create course
/courses/:id                   → edit course, manage videos, reorder
```

### Key Features

**Student Management:**
- Table: name, email, subscription status, device status, last active
- Filter by: active, expired, locked
- Per student:
  - View enrolled courses list
  - Add or remove course enrollments manually (for when student pays for additional course later)
  - View progress per enrolled course
  - Reset device lock (one button)
  - Toggle subscriptionActive
  - Update subscriptionExpiry

**Signup Code Management:**
- Generate code button → tutor selects which course(s) the code grants access to → creates random alphanumeric code e.g. `AX7K-29QP`
- Table shows: code, courses granted, created date, expiry, used by (student name or "unused"), used date
- Can deactivate unused codes

**Course & Video Management:**
- Create course: title, description, thumbnail image URL
- Add videos to course: title, description, Vimeo video ID, order, free preview toggle
- Reorder videos via drag and drop (or up/down arrows)
- Publish/unpublish course toggle
- `totalVideos` field on course is kept in sync automatically when videos are added or removed

**Progress View (per student, per enrolled course):**
- Completion percentage per course
- Expandable: shows each video, whether completed, last watched date

**Device Reset:**
- Single button on student detail page
- Sets `registeredDeviceId: null`, `deviceStatus: "active"`, `sessionToken: null`
- Student can log in fresh on any device after this

### Admin Auth

- Single Firebase Auth account (tutor's email)
- Every dashboard API call sends Firebase ID token
- Backend verifies caller UID matches `ADMIN_UID` environment variable
- No roles system needed — one admin only

---

## Product 3 — Marketing Website (Next.js)

### Sections (Single Page)

```
Header / Nav           → logo, nav links, CTA button "Get Access"
Hero                   → headline, subheadline, CTA
About                  → tutor photo, bio, subjects taught, experience
Demo Video             → embedded YouTube video of sample lecture
Courses / Offerings    → what he teaches, format, pricing info
How It Works           → 3 steps: Pay → Get Code → Watch
Contact Form           → name, phone, message → Formspree → tutor's email
Footer                 → social links, copyright
```

### SEO Setup

```typescript
// app/layout.tsx
export const metadata = {
  title: "Aftab — Online Tutor Pakistan",
  description: "Learn [subjects] with expert tutor Aftab. Private online lectures with flexible access.",
}
```

- Submit to Google Search Console on launch
- Add sitemap.xml (Next.js generates this easily with next-sitemap)

### Contact Form

Use Formspree — no backend needed:
```html
<form action="https://formspree.io/f/YOUR_ID" method="POST">
  <input name="name" />
  <input name="phone" />
  <textarea name="message" />
  <button type="submit">Send</button>
</form>
```
Formspree emails the tutor directly on every submission. Free tier allows 50 submissions/month.

---

## Backend — Firebase Cloud Functions

### Environment Variables

```
ADMIN_UID=firebase_uid_of_tutor
VIMEO_ACCESS_TOKEN=vimeo_api_token
```

### Middleware (applied to protected routes)

- **verifyToken** — verifies Firebase ID token from Authorization header
- **verifyAdmin** — checks caller UID matches ADMIN_UID env var
- **verifySession** — checks x-session-token header matches Firestore sessionToken value
- **verifyDevice** — checks x-device-id header matches registeredDeviceId in Firestore

### API Endpoints

```
POST /auth/register
  body: { email, password, displayName, signupCode }
  - validate signupCode exists, isActive: true, usedBy: null
  - create Firebase Auth user via Admin SDK
  - write users/{uid} doc with enrolledCourses from code's grantsCourses field
  - mark signupCode: usedBy = uid, usedAt = now, isActive = false
  - return success

POST /auth/login
  headers: { Authorization: Bearer <idToken>, x-device-id: <deviceId> }
  - verify ID token via Firebase Admin SDK
  - fetch users/{uid} doc
  - if deviceStatus === "locked" → return 403 { code: "ACCOUNT_LOCKED" }
  - if registeredDeviceId === null:
      save deviceId, generate sessionToken, set deviceStatus: "active"
      return 200 + { sessionToken }
  - if deviceId matches registeredDeviceId:
      generate new sessionToken, save to Firestore
      return 200 + { sessionToken }
  - if deviceId does NOT match:
      set deviceStatus: "locked", set sessionToken: null
      return 403 { code: "DEVICE_MISMATCH_LOCKED" }

POST /auth/logout
  middleware: verifyToken
  - set sessionToken: null in Firestore

GET /courses
  middleware: verifyToken, verifySession, verifyDevice
  - check subscriptionActive and subscriptionExpiry > now
  - fetch users/{uid}.enrolledCourses array
  - fetch only courses whose ID is in enrolledCourses AND isPublished: true
  - return course list with id, title, description, thumbnail, totalVideos

GET /courses/:id/videos
  middleware: verifyToken, verifySession, verifyDevice
  - check subscription
  - verify courseId is in users/{uid}.enrolledCourses → else 403 NOT_ENROLLED
  - return videos subcollection ordered by `order` field

GET /videos/:id/stream
  middleware: verifyToken, verifySession, verifyDevice
  - check subscription
  - fetch video doc to get courseId
  - verify courseId is in users/{uid}.enrolledCourses → else 403 NOT_ENROLLED
  - return Vimeo embed URL: https://player.vimeo.com/video/{vimeoId}?autoplay=1&title=0&byline=0&portrait=0

POST /progress/update
  middleware: verifyToken, verifySession
  body: { videoId, courseId, watchedSeconds, totalSeconds }
  - verify courseId is in user's enrolledCourses
  - calculate percentComplete = (watchedSeconds / totalSeconds) * 100
  - upsert users/{uid}/progress/{videoId}
  - if percentComplete >= 90 and isCompleted was false → set isCompleted: true, set lastWatchedAt: now

GET /progress/:courseId
  middleware: verifyToken, verifySession
  - return all progress docs for this courseId under users/{uid}/progress

POST /admin/codes/generate
  middleware: verifyToken, verifyAdmin
  body: { grantsCourses: string[], expiresAt?: timestamp }
  - validate all courseIds in grantsCourses exist in Firestore
  - generate random alphanumeric code e.g. AX7K-29QP
  - write to signupCodes/{code}
  - return { code }

GET /admin/codes
  middleware: verifyToken, verifyAdmin
  - return all signup codes with usage info

DELETE /admin/codes/:code
  middleware: verifyToken, verifyAdmin
  - set isActive: false (soft delete)

GET /admin/students
  middleware: verifyToken, verifyAdmin
  - return all users docs

GET /admin/students/:id
  middleware: verifyToken, verifyAdmin
  - return user doc + all progress subcollection docs

PUT /admin/students/:id
  middleware: verifyToken, verifyAdmin
  body: { subscriptionActive?, subscriptionExpiry?, enrolledCourses? }
  - update user doc fields directly
  - used for toggling subscription and adding/removing course enrollments

POST /admin/students/:id/reset-device
  middleware: verifyToken, verifyAdmin
  - set registeredDeviceId: null
  - set deviceStatus: "active"
  - set sessionToken: null
  - student can log in fresh on any device after this

POST /admin/courses
  middleware: verifyToken, verifyAdmin
  body: { title, description, thumbnail, order }
  - create course doc with totalVideos: 0

PUT /admin/courses/:id
  middleware: verifyToken, verifyAdmin
  body: { title?, description?, thumbnail?, order?, isPublished? }
  - update course doc fields

POST /admin/courses/:id/videos
  middleware: verifyToken, verifyAdmin
  body: { title, description, vimeoId, order, isFreePreview }
  - add video to courses/{id}/videos subcollection
  - increment courses/{id}.totalVideos by 1

PUT /admin/courses/:id/videos/:videoId
  middleware: verifyToken, verifyAdmin
  - update video doc fields

DELETE /admin/courses/:id/videos/:videoId
  middleware: verifyToken, verifyAdmin
  - delete video doc
  - decrement courses/{id}.totalVideos by 1

GET /admin/students/:id/progress
  middleware: verifyToken, verifyAdmin
  - return all progress docs across all courses for this student
```

---

## Firestore Data Model

### `users/{uid}`
```
email: string
displayName: string
registeredDeviceId: string | null
deviceStatus: "active" | "locked"
sessionToken: string | null
subscriptionActive: boolean
subscriptionExpiry: timestamp | null
signupCodeUsed: string
enrolledCourses: string[]          // array of courseIds student has access to
createdAt: timestamp
```

### `users/{uid}/progress/{videoId}`
```
videoId: string
courseId: string
watchedSeconds: number
totalSeconds: number
percentComplete: number            // 0-100
isCompleted: boolean               // true when percentComplete >= 90
lastWatchedAt: timestamp
firstWatchedAt: timestamp
```

### `signupCodes/{code}`
```
createdAt: timestamp
expiresAt: timestamp | null
usedBy: string | null              // uid of student who used it
usedAt: timestamp | null
isActive: boolean
grantsCourses: string[]            // courseIds this code unlocks on registration
```

### `courses/{courseId}`
```
title: string
description: string
thumbnail: string                  // image URL
order: number                      // for sorting on admin dashboard
isPublished: boolean
totalVideos: number                // kept in sync when videos are added/removed
createdAt: timestamp
```

### `courses/{courseId}/videos/{videoId}`
```
title: string
description: string
vimeoId: string                    // Vimeo video ID e.g. "748291034"
order: number                      // for sorting within course
isFreePreview: boolean
createdAt: timestamp
```

---

## Device Binding — Complete Logic

```
LOGIN REQUEST RECEIVED
        │
        ▼
Verify Firebase ID token via Admin SDK
        │
        ▼
Fetch users/{uid} from Firestore
        │
        ▼
Is deviceStatus === "locked"?
  YES ──► return 403 { code: "ACCOUNT_LOCKED" }
  NO  ──► continue
        │
        ▼
Is registeredDeviceId null?
  YES ──► save incoming deviceId to Firestore
          generate random sessionToken, save to Firestore
          set deviceStatus: "active"
          return 200 + { sessionToken }
  NO  ──► continue
        │
        ▼
Does incoming deviceId === registeredDeviceId?
  YES ──► generate new sessionToken, save to Firestore
          return 200 + { sessionToken }
  NO  ──► set deviceStatus: "locked"
          set sessionToken: null
          return 403 { code: "DEVICE_MISMATCH_LOCKED" }
          (old device auto-logs out on its next API call via session check)
```

---

## Session Token Flow (Force Logout Mechanism)

```
Every protected API call from app:
  Headers: { Authorization: Bearer <idToken>, x-session-token: <token>, x-device-id: <deviceId> }
        │
        ▼
Backend fetches users/{uid}.sessionToken from Firestore
        │
        ▼
Incoming token === stored sessionToken?
  YES ──► proceed with request
  NO  ──► return 401 { code: "SESSION_INVALID" }
        │
        ▼
App receives 401
        │
        ▼
App clears SecureStore (removes sessionToken + deviceId)
        │
        ▼
App navigates to LoginScreen
(This is how the old device gets silently logged out when a new device triggers a lock)
```

---

## Course Enrollment Flow

```
TUTOR generates signup code:
  Selects course(s) from dropdown in dashboard
  Clicks Generate → code created with grantsCourses: ["courseId_1", "courseId_2"]
  Tutor sends code to student manually

STUDENT registers:
  Enters code during registration
  Backend copies grantsCourses → users/{uid}.enrolledCourses
  Student now sees only those courses on HomeScreen

TUTOR adds course later:
  Student pays for additional course
  Tutor goes to student detail page in dashboard
  Clicks "Add Course" → selects course → updates enrolledCourses array
  Student sees new course immediately on next app refresh
```

---

## Infrastructure & Costs

| Service | Plan | Monthly Cost | Who Pays |
|---|---|---|---|
| Firebase (Auth + Firestore + Functions) | Blaze (pay as you go, stays in free limits) | ~Rs. 0 | Client |
| Vimeo | Starter | ~Rs. 5,600 | Client |
| Vercel (dashboard + marketing site) | Free | Rs. 0 | — |
| Domain (.com.pk) | — | ~Rs. 170/month (Rs. 2,000/year) | Client |
| **Total** | | **~Rs. 5,800/month** | Client |

**Note:** Firebase Blaze plan requires a credit card but stays within free tier limits for this scale. Free tier includes 2M function invocations/month and 1GB Firestore storage.

---

## Domain & Hosting Setup

```
aftabtutor.com.pk          → Marketing site (Next.js on Vercel)
admin.aftabtutor.com.pk    → Admin dashboard (React on Vercel)
```

DNS records on Namecheap/Domains.pk:
```
A     @      76.76.21.21
CNAME www    cname.vercel-dns.com
CNAME admin  cname.vercel-dns.com
```

---

## Build Order (Follow This Exactly)

```
Phase 1 — Foundation
  1. Firebase project setup (Auth, Firestore, Functions)
  2. Create Firestore collections manually in Firebase console to visualise structure
  3. Set up Functions project with TypeScript
  4. Write and deploy verifyToken + verifyAdmin middleware

Phase 2 — Core Security (do NOT touch UI until this is rock solid)
  5. POST /auth/register with signup code validation + enrolledCourses population
  6. POST /auth/login with full device binding logic
  7. verifySession + verifyDevice middleware
  8. Test full device binding scenario end to end:
     - Register → login on device A → login on device B → verify both locked → admin reset → verify device A can log in again

Phase 3 — Content API
  9. GET /courses (enrollment filtered)
  10. GET /courses/:id/videos (enrollment check)
  11. GET /videos/:id/stream (enrollment check + Vimeo URL)
  12. POST /progress/update
  13. GET /progress/:courseId

Phase 4 — Admin API
  14. POST /admin/codes/generate (with grantsCourses selection)
  15. GET /admin/codes
  16. GET /admin/students + GET /admin/students/:id
  17. PUT /admin/students/:id (subscription + enrolledCourses management)
  18. POST /admin/students/:id/reset-device
  19. POST + PUT + DELETE /admin/courses + /admin/courses/:id/videos

Phase 5 — Mobile App
  20. Project setup (bare workflow, TypeScript)
  21. Navigation structure (AuthStack + AppStack)
  22. Auth screens: Login, Register (with signup code field), AccountLocked
  23. HomeScreen: fetch enrolled courses only, show progress bars
  24. CourseScreen: video list with completion checkmarks
  25. VideoPlayerScreen: Vimeo WebView + FLAG_SECURE enabled
  26. Progress update interval (every 15 seconds) + on pause/exit
  27. ProfileScreen: student info + logout

Phase 6 — Admin Dashboard
  28. Project setup (React + Vite + Tailwind)
  29. Login page (Firebase Auth)
  30. Students table with filters (active/expired/locked)
  31. Student detail: enrolled courses, progress view, device reset button, subscription toggle
  32. Add/remove course enrollment on student detail page
  33. Signup codes page: table + generate code modal with course selector
  34. Courses page: list, create, edit
  35. Course detail: video list, add/edit/delete/reorder videos

Phase 7 — Marketing Site
  36. Next.js project setup
  37. Single scrollable page with all sections
  38. Formspree contact form
  39. SEO metadata + sitemap
  40. Deploy to Vercel + connect domain via DNS

Phase 8 — Testing & Delivery
  41. Full student journey: register → browse enrolled courses only → watch video → check progress updates
  42. Verify non-enrolled courses are completely inaccessible (test API directly)
  43. Device lock scenario: second device login → both locked → admin reset → re-login
  44. Force logout: trigger lock, verify old device gets 401 on next request
  45. Screen capture prevention on real physical Android device
  46. Admin: add course to student mid-subscription → verify student sees it immediately
  47. Build signed APK for distribution to students
```

---

## What Is Not In Scope

- iOS version (Android only for now)
- In-app payments (tutor handles manually)
- Push notifications
- Student-to-tutor messaging
- Live streaming
- Automatic subscription renewal
- Play Store publishing (optional paid add-on)

---

## Key Packages (Mobile App)

```json
{
  "dependencies": {
    "react-native": "latest",
    "expo": "latest",
    "@react-navigation/native": "^6.0.0",
    "@react-navigation/stack": "^6.0.0",
    "react-native-webview": "^13.0.0",
    "react-native-screen-capture-prevent": "latest",
    "expo-secure-store": "latest",
    "expo-crypto": "latest",
    "expo-device": "latest",
    "zustand": "^4.0.0",
    "axios": "^1.0.0",
    "@react-native-firebase/app": "latest",
    "@react-native-firebase/auth": "latest"
  }
}
```

---

## Notes for AI Agent

- **Security is backend-only.** Never trust the client app for security decisions. All checks (enrollment, device, session, subscription) happen in Firebase Functions.
- **Enrollment check on every content request.** `GET /courses`, `GET /courses/:id/videos`, and `GET /videos/:id/stream` all verify the student's `enrolledCourses` array before returning data.
- **Vimeo token never leaves the server.** All Vimeo API calls happen in Firebase Functions only. The app only receives the final embed URL.
- **sessionToken vs Firebase ID token.** Firebase ID token = who you are (identity). sessionToken = which device session is active (custom field in Firestore). Both are checked on protected routes.
- **Progress updates are throttled.** Send every 15 seconds during playback + on pause/exit. Never on every second — too many Firestore writes.
- **FLAG_SECURE is screen-scoped.** Enable only on VideoPlayerScreen, not app-wide.
- **Vimeo embed URL format:** `https://player.vimeo.com/video/{vimeoId}?autoplay=1&title=0&byline=0&portrait=0`
- **Course progress is calculated on the fly.** Do not store a courseProgressPercent field. Calculate from `count(isCompleted: true) / course.totalVideos * 100` at query time.
- **totalVideos must stay in sync.** Increment on video create, decrement on video delete using Firestore transactions or batch writes.
- **enrolledCourses is the source of truth for access.** Even if a course is published and the student has an active subscription, they cannot see or access it unless their `enrolledCourses` array contains that courseId.
- **Use Firestore onSnapshot in admin dashboard** for real-time student table updates.
- **Do not use direct Firestore client SDK writes from the mobile app** for any security-sensitive operation. All writes go through Firebase Functions.
