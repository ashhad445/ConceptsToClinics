import { UserDoc } from "../types";

/**
 * Checks if a student has active, non-expired access to a specific course.
 */
export const isCourseAccessActive = (
  userDoc: UserDoc,
  courseId: string
): { active: boolean; reason?: string } => {
  if (!userDoc.subscriptionActive) {
    return { active: false, reason: "Your subscription is not active. Please contact your instructor." };
  }

  const now = new Date();

  // Check global subscription expiry
  if (userDoc.subscriptionExpiry) {
    const globalExpiryDate =
      typeof (userDoc.subscriptionExpiry as any).toDate === "function"
        ? (userDoc.subscriptionExpiry as any).toDate()
        : new Date(userDoc.subscriptionExpiry as any);

    if (globalExpiryDate < now) {
      return { active: false, reason: "Your subscription has expired. Please contact your instructor." };
    }
  }

  // Check enrollment
  const enrolled = userDoc.enrolledCourses || [];
  if (!enrolled.includes(courseId)) {
    return { active: false, reason: "You are not enrolled in this course." };
  }

  // Check per-course expiry
  if (userDoc.courseExpiries && userDoc.courseExpiries[courseId]) {
    const rawCourseExpiry = userDoc.courseExpiries[courseId];
    if (rawCourseExpiry) {
      const courseExpiryDate =
        typeof (rawCourseExpiry as any).toDate === "function"
          ? (rawCourseExpiry as any).toDate()
          : new Date(rawCourseExpiry as any);

      if (courseExpiryDate < now) {
        return { active: false, reason: "Your access to this course has expired." };
      }
    }
  }

  return { active: true };
};
