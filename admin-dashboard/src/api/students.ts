import apiClient from './client';

export interface Student {
  id: string;
  email: string;
  displayName: string;
  studentId: string | null;
  deviceStatus: 'active' | 'locked';
  registeredDeviceId: string | null;
  registeredDeviceName: string | null;
  registeredDeviceFriendlyName: string | null;
  attemptedDeviceId: string | null;
  attemptedDeviceName: string | null;
  attemptedDeviceFriendlyName: string | null;
  attemptedLoginAt: { _seconds: number } | null;
  subscriptionActive: boolean;
  subscriptionExpiry: { _seconds: number } | null;
  enrolledCourses: string[];
  courseExpiries?: Record<string, { _seconds: number } | string | null>;
  signupCodeUsed: string;
  createdAt: { _seconds: number };
  isAuthOnly?: boolean;
}

export interface ProgressDoc {
  videoId: string;
  courseId: string;
  playlistId?: string | null;
  watchedSeconds: number;
  totalSeconds: number;
  percentComplete: number;
  isCompleted: boolean;
  lastWatchedAt: { _seconds: number } | null;
  firstWatchedAt: { _seconds: number } | null;
}

export const getStudents = async (): Promise<Student[]> => {
  const res = await apiClient.get('/admin/students');
  return res.data.students;
};

export const getStudent = async (id: string): Promise<{ student: Student; progress: ProgressDoc[] }> => {
  const res = await apiClient.get(`/admin/students/${id}`);
  return res.data;
};

export const updateStudent = async (
  id: string,
  data: {
    subscriptionActive?: boolean;
    subscriptionExpiry?: string | null;
    enrolledCourses?: string[];
    courseExpiries?: Record<string, string | null>;
  }
): Promise<void> => {
  await apiClient.put(`/admin/students/${id}`, data);
};

export const resetDevice = async (id: string): Promise<void> => {
  await apiClient.post(`/admin/students/${id}/reset-device`);
};

export const deleteStudent = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/students/${id}`);
};

export const getStudentProgress = async (id: string): Promise<ProgressDoc[]> => {
  const res = await apiClient.get(`/admin/students/${id}/progress`);
  return res.data.progress;
};
