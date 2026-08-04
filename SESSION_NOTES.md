# ConceptsToClinics — Session Notes
> Date: 2026-07-27
> Conversation ID: 74ba9752-292c-4557-9045-51d29dc72a96

---

## Project Overview

A private video lecture platform for a single tutor (Aftab). Prevents content piracy via device binding, session tokens, and code-gated registration. Students pay manually — no in-app payments.

**Four projects in workspace:**
1. **Android Mobile App (`mobile-app`)** — primary student lecture app (`com.mobileapp`)
2. **Playground Mobile App (`play-app`)** — duplicated app for testing UI themes side-by-side on device/emulator (`com.conceptstoclinics.playground` / `Concepts Play`)
3. **Admin Dashboard (`admin-dashboard`)** — tutor management panel (React + Vite + TypeScript)
4. **Marketing Website (`marketing-site`)** — public-facing site (Next.js App Router + Tailwind CSS v4)

**Full spec:** `e:\ConceptsToClinics\tutor-platform-project-brief.md`

---

## Key Credentials & Config

| Item | Value |
|---|---|
| Firebase Project (dev) | `concepts-to-clinics-dev` |
| Firebase Region | `asia-south1` |
| Functions URL | `https://asia-south1-concepts-to-clinics-dev.cloudfunctions.net/api` |
| Admin email | `ashhad.ather445@gmail.com` |
| Admin password | `Ashhad445` |
| Admin UID | `k2SIj5dxplZwGryebY9Gkhkv7b03` |
| Firebase Web API Key | `AIzaSyDnQXOjDrmoI1-jm0MnqRoG-VtcllcO5ZI` |
| Test student email | `teststudent@test.com` |
| Test student password | `Test1234!` |
| Test course ID | `mOb8Z204pH7SnmT2G86k` (Biology 101) |
| Test signup code | `TXM4-VYY5` (active, grants Biology 101) |

---

## Work Accomplished This Session

### 1. 📱 Playground App Scaffolding & Activity Launch Fix (`play-app`)
- Duplicated `mobile-app` into `e:\ConceptsToClinics\play-app` to allow testing UI designs side-by-side.
- Configured distinct `applicationId "com.conceptstoclinics.playground"` in `build.gradle` and app name `"Concepts Play"` in `app.json` and `strings.xml`.
- Updated `google-services.json` to declare `package_name: "com.conceptstoclinics.playground"` to pass `processDebugGoogleServices`.
- **Bug Fix**: Fixed ADB activity launch error (`Activity class does not exist`) by aligning Java package to `com.conceptstoclinics.playground.MainActivity` and clearing Gradle daemon in-memory task caches (`.\gradlew --stop`).

---

### 2. 🎨 Neumorphic Light Cream UI Theme & Layout Redesign (`play-app`)
- Created central design tokens in `play-app/src/constants/theme.ts` (`COLORS`, `SHADOWS`, `RADIUS`):
  - **Background**: Soft Warm Off-White / Cream (`#F8F7F4`).
  - **Surface Cards**: Pure Elevated White (`#FFFFFF`) with multi-layered soft elevation shadows (`0px 10px 25px rgba(0, 0, 0, 0.04)`).
  - **Action Accents**: Solid Pitch Black (`#000000`) for primary buttons, FAB play buttons, and active filter tabs.
  - **Pastel Accents**: Lavender (`#8B5CF6` / `#F3E8FF`), Emerald (`#10B981` / `#E6F4EA`), and Pink (`#EC4899`).
- **All 7 Screens Fully Redesigned**:
  1. `HomeScreen.tsx`: Neumorphic top header with notification bell + avatar, scrollable pill filter bar with counter badges (`All`, `In Progress`, `Completed`), pure white course cards with black floating play action button (FAB) & custom thumbnail image display.
  2. `CourseScreen.tsx`: Hero course card with stats & progress track, lecture list with circular status badges (emerald checkmark for completed, black play for pending).
  3. `ProfileScreen.tsx`: Large initial avatar card, active subscription badge, black sign-out pill button.
  4. `LoginScreen.tsx`: Circular brand badge, neumorphic card, black action button.
  5. `RegisterScreen.tsx`: Registration form card with tutor signup code callout pill badge.
  6. `VideoPlayerScreen.tsx`: Top WebView video player with bottom lecture details panel, compact header, auto-landscape fullscreen support.
  7. `AccountLockedScreen.tsx`: Security lock warning card with red dot indicator and tutor support contact button.

---

### 3. 🎬 Video Player Header & Auto-Landscape Fullscreen Video Mode
- **Compact Header**: Reduced top header title size on Video Player screen to compact `14px` semi-bold.
- **Auto-Fullscreen Mode**: Implemented dynamic orientation detection (`useWindowDimensions`):
  - **Portrait Mode**: Shows compact top header + lecture info card underneath.
  - **Landscape Mode**: Automatically **hides navigation header & status bar**, expanding video player to **100% width & 100% height true fullscreen**.
- Applied to both `play-app` and `mobile-app`.

---

### 4. 🖼️ Custom Course Picture Upload & Display (Admin + Mobile)
- **Built `ImageUploadInput.tsx`** in `admin-dashboard/src/components/ImageUploadInput.tsx`:
  - **File Picker & Drag-and-Drop**: Upload custom image files (`.png`, `.jpg`, `.webp`) directly from local disk. Auto-compresses via HTML5 Canvas (max 800px) to keep data payloads lightweight and fast.
  - **URL Input**: Paste any custom web image link.
  - **Medical Presets**: One-click curated covers (*Biology 101*, *Anatomy*, *Physiology*, *Clinical Surgery*).
  - **Live Image Preview**: Real-time thumbnail preview card with "Remove" and "Change" controls.
- **Integrated into Admin Dashboard**: Used inside **Create Course Modal** (`CoursesPage.tsx`) and **Edit Course Modal** (`CourseDetailPage.tsx`).
- **Updated Mobile & Playground Apps**: Updated `HomeScreen.tsx` in both apps to render custom course picture thumbnails with stateful error fallback (`imageErrors`).

---

### 5. ⚡ Instant Refresh & Course Visibility Fixes
- **`CourseScreen.tsx` API Fix**: Updated API function binding from `fetchCourseDetail` → `fetchCourseVideos(courseId)` to resolve lecture list loading error.
- **Instant Focus Refresh**: Added `useFocusEffect` hook to `HomeScreen.tsx` in both `play-app` and `mobile-app`. Pulling down or returning to the home screen auto-refreshes published courses from server instantly.
- **Draft Status Clarification**: Confirmed new courses start as **Draft (`isPublished: false`)** by default in Admin Dashboard. Publishing a course makes it visible to enrolled students immediately.

---

### 6. 🌐 Theme Alignment & Admin Dashboard Layout Fix
- **Unified Design System**: Aligned both **Admin Dashboard** (`admin-dashboard`) and **Marketing Website** (`marketing-site`) with the **Neumorphic Light Cream & Pure White Card Aesthetic** (`#F8F7F4` background, `#FFFFFF` surface cards with soft elevation, pitch-black `#000000` pill buttons, and soft lavender/emerald badge pills).
- **Admin Layout Fix**: Fully restored original page layout structures (`.grid-stats` 4-column row, `.table-container` surface card wrapper, `.filter-tabs` pill bar, `.search-wrap`, `.detail-grid` 2-column view, and utility classes).
- **Visual Verification**: Tested `/students`, `/codes`, `/students/:id`, and `/courses` in browser — verified 100% clean layout alignment.
- **Marketing Site Build**: Compiled cleanly via `npm run build` with 0 errors.

---

## File Structure Overview

```
e:\ConceptsToClinics\
  tutor-platform-project-brief.md   ← Full project spec
  SESSION_NOTES.md                  ← Comprehensive session records
  firebase.json                     ← Firebase config
  functions/                        ← Express + Cloud Functions backend
  admin-dashboard/                  ← Tutor Admin Dashboard (React + Vite)
    src/
      components/
        ImageUploadInput.tsx        ← Custom file uploader, URL input & presets
      pages/
        CoursesPage.tsx             ← Create course modal with uploader
        CourseDetailPage.tsx        ← Edit course modal with uploader
  marketing-site/                   ← Next.js App Router Marketing Site
  mobile-app/                       ← Original Android Mobile App (com.mobileapp)
  play-app/                         ← Playground Mobile App (com.conceptstoclinics.playground)
    src/
      constants/
        theme.ts                    ← Neumorphic light cream design system tokens
      screens/                      ← All 7 redesigned Neumorphic screens
```

---

## How to Run Workspace Applications

### 1. Run Playground Mobile App (on Emulator)
```bash
cd e:\ConceptsToClinics\play-app
$env:ANDROID_HOME = "E:\Android"; $env:ANDROID_SDK_ROOT = "E:\Android"
npm run android
```

### 2. Run Admin Dashboard
```bash
cd e:\ConceptsToClinics\admin-dashboard
npm run dev -- --port 3001
# Opens at http://localhost:3001
```

### 3. Run Marketing Website
```bash
cd e:\ConceptsToClinics\marketing-site
npx next dev -p 3002
# Opens at http://localhost:3002
```

### 4. Run Original Mobile App
```bash
cd e:\ConceptsToClinics\mobile-app
$env:ANDROID_HOME = "E:\Android"; $env:ANDROID_SDK_ROOT = "E:\Android"
npm run android
```

---

## Session — 2026-07-29 (Course → Playlist → Video Refactor)

### 7. 📚 Full Stack Course → Playlist → Video Architecture Refactor

Implemented a full hierarchy refactor across **all 5 packages** in one session.

#### Firestore Structure Change
- **Before:** `courses/{courseId}/videos/{videoId}`
- **After:** `courses/{courseId}/playlists/{playlistId}/videos/{videoId}`

#### New `CourseDoc` fields:
- `totalPlaylists: number` — number of playlists in the course
- `totalVideos: number` — sum of all videos across all playlists

#### New `PlaylistDoc` (at `courses/{courseId}/playlists/{playlistId}`):
```ts
{ title, description, order, totalVideos, createdAt }
```

#### `ProgressDoc` update:
- Added optional `playlistId?: string` field (backwards-compatible)

#### Backend Changes (`functions/src/routes/`)
- **`admin/courses.ts`**: Replaced old flat video endpoints with full playlist CRUD + nested video CRUD. Transactions keep `totalVideos` in sync on both playlist and course.
- **`courses.ts`**: `GET /:id/videos` → `GET /:id/playlists` (with per-playlist progress) + `GET /:id/playlists/:plId/videos`
- **`videos.ts`**: Stream endpoint still uses `collectionGroup("videos")` (unchanged collection name). Now extracts `playlistId` from path segment [3] and returns it.
- **`progress.ts`**: `POST /update` accepts + stores optional `playlistId`

#### Admin Dashboard Changes
- **`api/courses.ts`**: New `Playlist` type + `getCoursePlaylists`, `createPlaylist`, `updatePlaylist`, `deletePlaylist`, `getPlaylistVideos` + updated video CRUD with `playlistId` in paths
- **`CourseDetailPage.tsx`**: Replaced flat video table with collapsible playlist accordion. Playlists lazy-load videos on first expand. Full CRUD + reordering at both levels.
- **`StudentDetailPage.tsx`**: Added "Playlist" column to the Video Progress Detail table

#### Mobile App Changes (both `mobile-app` + `play-app`)
- `api/courses.ts`: `Playlist` type, `fetchCoursePlaylists`, `fetchPlaylistVideos`
- `api/progress.ts`: Optional `playlistId` in `ProgressUpdateParams`
- `navigation/types.ts`: New `Playlist` route; `VideoPlayer` params include `playlistId`
- `navigation/AppStack.tsx`: Registered new `PlaylistScreen`
- `screens/CourseScreen.tsx`: Shows playlists with per-playlist progress bars
- **[NEW]** `screens/PlaylistScreen.tsx`: Video list per playlist
- `screens/VideoPlayerScreen.tsx`: Passes `playlistId` to `updateProgress`

#### Build & Deployment Results
- `functions`: ✅ **Deployed to Firebase Cloud Functions** (`concepts-to-clinics-dev`, `asia-south1`)
- `admin-dashboard`: ✅ `tsc -b && vite build` — **0 errors, 419 modules**

---

## Session — 2026-07-30 / 2026-07-31

### 8. 🎨 Admin Dashboard & Mobile App Polish + Brand Integration

#### Admin Dashboard Fixes
- Fixed `package.json` dev script (`vite --port 3001`) to ensure server consistently binds to port `3001`.
- Enhanced page title headings to **22px Bold** (`font-weight: 800`).
- Applied custom neumorphic styling to `<select>` / `.form-select` drop-down controls and modal checkbox lists.
- Integrated brand logo (`logo.png`) as Favicon, Sidebar header logo, and Login portal image.

#### Mobile App Registration & Auth Fixes (`play-app`)
- Fixed payload key mismatch (`signupCode` instead of `code`) during student registration.
- Updated `registerStudent()` in `src/api/auth.ts` to execute full register → Firebase sign-in → device-bound session token login.

#### Android App Icons Setup
- Generated legacy mipmap PNG launcher icons across `mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, and `xxxhdpi` folders.
- Configured Android 8+ Adaptive Icon (`ic_launcher_foreground.png` + `#FFFFFF` background) using `Concepts to clinics app icon.png`.
- Updated icon resources for both `play-app` and `mobile-app`.

#### CTC Brand Palette & UI Refinement
- Updated `theme.ts` with brand palette extracted from logo:
  - **Primary Navy**: `#062458` (Buttons, headers, active avatars)
  - **Secondary Teal**: `#007584` (Progress bars, badges, links)
- Replaced text logo badge on `LoginScreen.tsx` with high-res `Concepts to clinics logo.png`.
- Removed unused lightning bolt (`⚡`) filter icon box on `HomeScreen.tsx` for cleaner pill filter layout.

---

## Session — 2026-08-01 (Unauthorized Device Audit, Student ID, Floating Watermark & Cloud APK)

### 9. 🛡️ Unauthorized Device Mismatch Audit System
- **`functions/src/types/index.ts`**: Added 4 attempted device fields (`attemptedDeviceId`, `attemptedDeviceName`, `attemptedDeviceFriendlyName`, `attemptedLoginAt`) to `UserDoc`.
- **`functions/src/routes/auth.ts`**: Updated `POST /auth/login` to capture incoming `deviceName` (e.g. `"Pixel 7a, Android 14"`) & `deviceFriendlyName`. On device mismatch lock, backend saves all 4 attempted fields + `admin.firestore.FieldValue.serverTimestamp()`.
- **`functions/src/routes/admin/students.ts`**:
  - `GET /admin/students/:id` exposes attempted device fields.
  - `POST /admin/students/:id/reset-device` clears all 8 device/session fields (registered + attempted metadata).
- **`admin-dashboard` (`StudentDetailPage.tsx`)**:
  - Added **"Unauthorized Login Attempt"** card (red border + indicator dot) displaying attempted device model, friendly name, device ID, and timestamp.
  - Updated reset handler to clear all 8 fields in local UI state.
- **`play-app` (`src/api/auth.ts`)**: Added `getDeviceInfo()` helper using `Platform.constants.Model` + OS version, passing them in the login body.

---

### 10. 🪪 Unique Student Short ID (`CC-XXXXXX`)
- **Backend Generator**: Implemented `generateStudentId()` in `functions/src/routes/auth.ts` generating collision-safe `CC-XXXXXX` IDs with unambiguous characters.
- **Registration**: Assigned at student creation on `users/{uid}` document (permanent, never changes).
- **Login Response**: `POST /auth/login` returns `studentId` alongside `sessionToken`.
- **Zustand Auth Store**: Updated `useAuthStore` in `play-app/src/store/authStore.ts` to store `studentId`.
- **Admin Dashboard**:
  - Added **"Student ID"** as 2nd column in `StudentsPage.tsx` table with monospace grey pill badge.
  - Search bar in `StudentsPage.tsx` searches across name, email, AND `studentId` simultaneously (case-insensitive).
  - Displayed prominent `CC-XXXXXX` badge under student name in `StudentDetailPage.tsx` header card.

---

### 11. 🌊 Floating Watermark Component (`FloatingWatermark.tsx`)
- **Created `FloatingWatermark.tsx` (`play-app/src/components/FloatingWatermark.tsx`)**:
  - Displays `"Student Name • CC-XXXXXX"`.
  - Animates smoothly using React Native `Animated.timing` with `Easing.inOut(Easing.ease)` drifting to a new random coordinate every 8 seconds.
  - Styled with subtle `opacity: 0.15`, monospace font, `pointerEvents="none"`, and `zIndex: 999`.
  - Added cleanup logic on unmount to cancel animations.
- **Integrated into `VideoPlayerScreen.tsx`**: Overlays video stream in both portrait and landscape views without impacting touch controls or screen recording protection (`FLAG_SECURE`).

---

### 12. 🚀 Standalone & Cloud APK Build Pipeline
- Configured Expo Application Services (`eas.json`) with `"distribution": "internal"` and `"buildType": "apk"` for direct standalone APK downloads.
- Created `.easignore` to exclude local native build folders (`android`, `ios`) and `package-lock.json`, enforcing clean Linux-native Expo Prebuild (CNG) on cloud runners.
- Aligned SDK 57 native dependencies in `package.json` (`react-native-gesture-handler@~2.32.0`, `react-native-safe-area-context@~5.7.0`, `react-native-webview@13.16.1`, `@expo/metro-config@~57.0.0`, `typescript@^5.3.3`).

---

## Session — 2026-08-01 (UI Fixes, Main App Sync, Tablet Emulator & Forgot Password Flow)

### 13. 📱 UI Polish & Main App Synchronization (`mobile-app`)
- **`ExpandableText.tsx`**: Updated layout measurement logic using a zero-height container (`height: 0, overflow: 'hidden'`) so `Show More ▼` / `Show Less ▲` renders reliably when text exceeds 2 lines.
- **Top Header Bar**: Removed unused bell notification icon from `HomeScreen.tsx` header row.
- **`FloatingWatermark.tsx`**: Added container boundary constraints (`boundedWidth`, `boundedHeight`) to keep the student watermark strictly inside the video box area with a 16s drift interval.
- **`RegisterScreen.tsx`**: Added **Confirm Password** input field with client-side matching validation + `KeyboardAvoidingView` height behavior for smooth Android keyboard scrolling.
- **Full Synchronization**: Reflected all updates, components, design system tokens (`constants/theme.ts`), and assets (`logo.png`) from `play-app` to `mobile-app`. TypeScript build (`npx tsc --noEmit`) verified 100% error-free across both projects.

### 14. 🎨 Admin Dashboard Brand Color Palette Matching (`admin-dashboard`)
- Aligned CSS variables in [`admin-dashboard/src/index.css`](file:///e:/ConceptsToClinics/admin-dashboard/src/index.css) to match the mobile app brand theme:
  - **Primary Accent (`--accent`)**: Deep Navy (`#062458`) for buttons, active sidebar items, focus rings, and avatar circles.
  - **Secondary Accent (`--teal`)**: Medical Teal (`#007584` / `#E0F4F6` background) for action pills and badges.
  - **Background (`--bg-base`)**: Soft Cream Off-White (`#F8F7F4`).
- Built production bundle (`npm run build`) with 0 errors.

### 15. 📐 Tablet Emulator Support (`emulator-5556`)
- Deployed the application to the tablet emulator (`emulator-5556`) alongside the phone emulator (`emulator-5554`).
- Verified wide-screen layout rendering, tablet landscape surface cards, and responsive inputs.

### 16. 🔐 Forgot Password Flow (`ForgotPasswordScreen.tsx`)
- **`screens/ForgotPasswordScreen.tsx`**:
  - Single email input field with auto-capitalization disabled.
  - **"Send Reset Link"** button calling `auth().sendPasswordResetEmail(trimmedEmail)` from `@react-native-firebase/auth`.
  - **Success State**: Displays check-email confirmation message (*"If an account exists for this email, a password reset link has been sent. Check your inbox and spam folder."*).
  - **Error Handling**: Formats `auth/user-not-found` & `auth/invalid-email` into *"Please enter a valid registered email address"*, and general failures into *"Something went wrong. Please try again."*
  - **Loading Indicator**: Renders `ActivityIndicator` during the request.
  - **"← Back to Login"** link navigating back to `LoginScreen`.
- **`LoginScreen.tsx`**: Added **"Forgot Password?"** text link right below the password field navigating to `ForgotPasswordScreen`.
- **Navigation**: Registered `ForgotPasswordScreen` in `AuthStack` (stack navigation only, no tab bar).

### 17. ⚡ Backend Video Stream Optimization & Rate Limiting (`functions`)
- **`GET /videos/:id/stream` Optimization**:
  - Added `courseId` & `playlistId` to `VideoDoc` interface ([`functions/src/types/index.ts`](file:///e:/ConceptsToClinics/functions/src/types/index.ts)).
  - Updated `POST /admin/courses/:id/playlists/:playlistId/videos` to write `courseId` & `playlistId` as explicit document fields ([`functions/src/routes/admin/courses.ts`](file:///e:/ConceptsToClinics/functions/src/routes/admin/courses.ts)).
  - Updated `GET /videos/:id/stream` ([`functions/src/routes/videos.ts`](file:///e:/ConceptsToClinics/functions/src/routes/videos.ts)) to take `courseId` & `playlistId` as query parameters and execute a **direct single-document lookup**, eliminating the full collection scan.
- **Rate Limiter Gateway ([`functions/src/middleware/rateLimiter.ts`](file:///e:/ConceptsToClinics/functions/src/middleware/rateLimiter.ts))**:
  - Implemented `registerRateLimiter` (5 attempts / 15m) and `loginRateLimiter` (10 attempts / 15m) using `express-rate-limit`.
  - Applied to `POST /register` and `POST /login` in [`functions/src/routes/auth.ts`](file:///e:/ConceptsToClinics/functions/src/routes/auth.ts) before token verification.

### 18. 🎬 Video Player Title Layout & Dual-App Synchronization (`mobile-app` & `play-app`)
- **Video Player Layout Update ([`VideoPlayerScreen.tsx`](file:///e:/ConceptsToClinics/mobile-app/src/screens/VideoPlayerScreen.tsx))**:
  - Updated portrait mode layout below the video player so that the video title (`standaloneTitle`) is rendered normally directly on the cream background above the card, while ONLY the lecture description remains inside the `metaCard`.
- **Mandatory Dual-App Sync Protocol**:
  - Applied and verified this layout change simultaneously across both `mobile-app` and `play-app`.
  - Established rule: All future UI, component, and API updates MUST be applied and verified in both `mobile-app` and `play-app` simultaneously.

### 19. 🌐 Published Courses Catalog & Locked Course WhatsApp Inquiry Flow (`functions`, `mobile-app`, `play-app`)
- **Backend API ([`functions/src/routes/courses.ts`](file:///e:/ConceptsToClinics/functions/src/routes/courses.ts))**:
  - Updated `GET /courses` to query **all published courses** (`.where("isPublished", "==", true)`).
  - Attached `isEnrolled: boolean` to each course in the response by checking `enrolledCourses.includes(doc.id)`.
  - Maintained strict enrollment verification on `GET /courses/:id/playlists` and `GET /videos/:id/stream`.
  - **Live Cloud Function Deployed**: Deployed to Firebase (`https://asia-south1-concepts-to-clinics-dev.cloudfunctions.net/api`) via `firebase deploy --only functions:api`.
- **Configurable Tutor Contact ([`src/constants/api.ts`](file:///e:/ConceptsToClinics/mobile-app/src/constants/api.ts))**:
  - Added `TUTOR_WHATSAPP_NUMBER` ("923000000000") constant to `api.ts` in both `mobile-app` and `play-app`.
- **Dual-Section Home Screen & Touch Handler ([`HomeScreen.tsx`](file:///e:/ConceptsToClinics/mobile-app/src/screens/HomeScreen.tsx))**:
  - Split course feed into **"My Courses"** (`isEnrolled: true`) and **"Explore More Courses"** (`isEnrolled: false`).
  - Enrolled course cards display full progress, play FAB, and tap-through to full course access.
  - Non-enrolled course cards display a `🔒 Locked` badge overlay, lock FAB, and `🔒 Contact Instructor to Enroll` footer.
  - Refactored card touch area (`isEnrolled: course.isEnrolled !== false`) and converted inner FAB button to a pass-through `View` badge to ensure 100% reliable tap navigation on Android.
- **Read-Only Locked Course Screen ([`CourseScreen.tsx`](file:///e:/ConceptsToClinics/mobile-app/src/screens/CourseScreen.tsx))**:
  - Accepts `isEnrolled` route parameter.
  - If `isEnrolled === false`: displays title, description, thumbnail, and total video count, but skips fetching playlists/videos.
  - Added a prominent **"💬 Contact Instructor to Enroll"** WhatsApp button using `Linking.openURL("https://wa.me/...")` with a pre-filled inquiry message.
- **Dual-App Synchronization**: Verified TypeScript compilation (`npx tsc --noEmit`) and live emulator execution on both `mobile-app` and `play-app`.

### 20. 🔐 Student Email-Bound Signup Code System (`functions`, `admin-dashboard`, `mobile-app`, `play-app`)
- **Firestore Schema & Type Updates ([`functions/src/types/index.ts`](file:///e:/ConceptsToClinics/functions/src/types/index.ts))**:
  - Added `boundEmail: string` to `SignupCodeDoc` interface (trimmed, lowercase string).
- **Admin Backend APIs ([`functions/src/routes/admin/codes.ts`](file:///e:/ConceptsToClinics/functions/src/routes/admin/codes.ts))**:
  - `POST /admin/codes/generate`: Accepts and validates required `email` parameter, normalizes to lowercase, and stores `boundEmail: normalizedEmail`.
  - `GET /admin/codes`: Includes `boundEmail` in returned signup code objects.
- **Student Registration Enforcement ([`functions/src/routes/auth.ts`](file:///e:/ConceptsToClinics/functions/src/routes/auth.ts))**:
  - `POST /auth/register`: Validates that student's registration email matches `codeDoc.boundEmail`. Returns HTTP 400 error message `"This signup code is not valid for this email address."` if mismatched.
  - Successfully deployed updated Cloud Function (`https://asia-south1-concepts-to-clinics-dev.cloudfunctions.net/api`) to live Firebase.
- **Admin Dashboard Updates ([`admin-dashboard/src/pages/CodesPage.tsx`](file:///e:/ConceptsToClinics/admin-dashboard/src/pages/CodesPage.tsx))**:
  - **Generate Code Modal**: Added required **Student Email (bound to code)** input field.
  - **Codes Table**: Added **Bound Email** column displaying `boundEmail` for each generated code.
  - Built production bundle (`npm run build`) with 0 errors.
- **Mobile Apps Surface Error ([`RegisterScreen.tsx`](file:///e:/ConceptsToClinics/mobile-app/src/screens/RegisterScreen.tsx))**:
  - Surfaced exact backend error message to students on failed registration attempt. Verified TypeScript compilation on both `mobile-app` and `play-app`.

### 21. 👥 Firebase Auth Accounts Sync & Admin Account Deletion (`functions`, `admin-dashboard`)
- **Root Cause Identified**:
  - `ashhad.ather445@gmail.com` was previously created directly in Firebase Auth (e.g. as the Admin / initial setup user).
  - When registration was attempted in the app using `ashhad.ather445@gmail.com`, Firebase Auth rejected creation with `"An account with this email already exists."` (`auth/email-already-in-use`).
  - Previously, `GET /admin/students` only queried the Firestore `users` collection. Because the account existed in Firebase Auth but did not have a document in the `users` collection, it did not appear in the Admin Portal.
- **Backend Sync Fix ([`functions/src/routes/admin/students.ts`](file:///e:/ConceptsToClinics/functions/src/routes/admin/students.ts))**:
  - Updated `GET /admin/students` to list all Firebase Auth accounts (`auth.listUsers()`) and cross-reference them with Firestore `users` documents.
  - Returns any Auth-only account with an `Auth Account` (`isAuthOnly: true`) indicator so the tutor can see all accounts registered in Firebase Auth.
  - Added **`DELETE /admin/students/:id`** endpoint to permanently remove an account from both Firebase Auth and Firestore.
  - Live deployed to Firebase Cloud Functions (`https://asia-south1-concepts-to-clinics-dev.cloudfunctions.net/api`).
- **Admin Dashboard Updates ([`admin-dashboard`](file:///e:/ConceptsToClinics/admin-dashboard))**:
  - Rendered **`Auth Account`** badge on the Students table for Auth-only accounts.
  - Added a **`Delete Account`** button with confirmation modal on `StudentDetailPage.tsx` to allow deleting any stuck or test email account with 1-click directly from the Admin Portal.
  - Verified production build (`npm run build`) with 0 errors.

### 22. 🎥 Vimeo Unlisted Videos & Embed Hash Support (`functions`, `admin-dashboard`, `mobile-app`, `play-app`)
- **Root Cause Identified**:
  - Vimeo unlisted videos require the **unlisted privacy hash** (`?h=...` or `1215063094/8738821432`).
  - Accessing an unlisted video embed URL without its `h` parameter returns a 403 Forbidden / Cloudflare verification block.
- **Backend URL Parser ([`functions/src/routes/videos.ts`](file:///e:/ConceptsToClinics/functions/src/routes/videos.ts))**:
  - Added `parseVimeoEmbedUrl()` helper function that automatically extracts the video ID and unlisted hash from:
    - Full Vimeo iframe HTML embed codes (`<iframe src="...">`)
    - Unlisted URLs (`https://vimeo.com/1215063094/8738821432` or `https://player.vimeo.com/video/1215063094?h=8738821432`)
    - Short inputs (`1215063094/8738821432` or `1215063094?h=8738821432`)
  - Live deployed to Firebase Cloud Functions (`https://asia-south1-concepts-to-clinics-dev.cloudfunctions.net/api`).
- **Mobile Apps Player Updates ([`VideoPlayerScreen.tsx`](file:///e:/ConceptsToClinics/mobile-app/src/screens/VideoPlayerScreen.tsx))**:
  - Added `referrerpolicy="no-referrer-when-downgrade"` to `<iframe>` and `baseUrl: 'https://vimeo.com'` to `WebView` source in both `mobile-app` and `play-app`.
- **Admin Dashboard Updates ([`CourseDetailPage.tsx`](file:///e:/ConceptsToClinics/admin-dashboard/src/pages/CourseDetailPage.tsx))**:
  - Updated video creation modal hints so tutors can paste the full Vimeo link, unlisted ID/hash, or full iframe HTML embed code directly.

### 23. 🚫 Long-Press Context Menu Disabling & Vimeo Branding Controls (`functions`, `mobile-app`, `play-app`)
- **Long-Press Menu Prevention ([`VideoPlayerScreen.tsx`](file:///e:/ConceptsToClinics/mobile-app/src/screens/VideoPlayerScreen.tsx))**:
  - Added CSS rule `-webkit-touch-callout: none !important; -webkit-user-select: none !important; user-select: none !important;` to embedded HTML player.
  - Intercepted `contextmenu` and `selectstart` events in HTML/JS with `e.preventDefault(); e.stopPropagation(); return false;` to block the tap-and-hold context menu.
  - Synchronized changes to both `mobile-app` and `play-app`.
- **Vimeo Player Parameters ([`functions/src/routes/videos.ts`](file:///e:/ConceptsToClinics/functions/src/routes/videos.ts))**:
  - Appended `badge=0`, `autopause=0`, and `vimeo_logo=0` query parameters to embed URLs returned by the backend.
  - Live deployed to Firebase Cloud Functions (`https://asia-south1-concepts-to-clinics-dev.cloudfunctions.net/api`).

---

## Next Steps / Active Tasks 🚀
- Download and test the standalone Android APK on a physical phone.
- Verify floating watermark drift and unauthorized login attempt logging on live Firebase project.











