import apiClient from './client';
import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  order: number;
  isPublished: boolean;
  totalPlaylists: number;
  totalVideos: number;
  createdAt: { _seconds: number };
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  order: number;
  totalVideos: number;
  createdAt: { _seconds: number };
}

export interface Video {
  id: string;
  title: string;
  description: string;
  bunnyVideoGuid: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  duration?: number;
  order: number;
  isFreePreview: boolean;
  uploadedAt?: { _seconds: number };
  createdAt: { _seconds: number };
}

// ─── Courses ──────────────────────────────────────────────────────────────────

export const getCourses = async (): Promise<Course[]> => {
  const res = await apiClient.get('/admin/courses');
  return res.data.courses;
};

export const createCourse = async (data: {
  title: string;
  description: string;
  thumbnail: string;
  order: number;
}): Promise<Course> => {
  const res = await apiClient.post('/admin/courses', data);
  return res.data;
};

export const updateCourse = async (
  id: string,
  data: Partial<{ title: string; description: string; thumbnail: string; order: number; isPublished: boolean }>
): Promise<void> => {
  await apiClient.put(`/admin/courses/${id}`, data);
};

// ─── Playlists ────────────────────────────────────────────────────────────────

export const getCoursePlaylists = async (courseId: string): Promise<Playlist[]> => {
  const res = await apiClient.get(`/admin/courses/${courseId}/playlists`);
  return res.data.playlists;
};

export const createPlaylist = async (
  courseId: string,
  data: { title: string; description: string; order: number }
): Promise<Playlist> => {
  const res = await apiClient.post(`/admin/courses/${courseId}/playlists`, data);
  return res.data;
};

export const updatePlaylist = async (
  courseId: string,
  playlistId: string,
  data: Partial<{ title: string; description: string; order: number }>
): Promise<void> => {
  await apiClient.put(`/admin/courses/${courseId}/playlists/${playlistId}`, data);
};

export const deletePlaylist = async (courseId: string, playlistId: string): Promise<void> => {
  await apiClient.delete(`/admin/courses/${courseId}/playlists/${playlistId}`);
};

// ─── Videos ───────────────────────────────────────────────────────────────────

export const getPlaylistVideos = async (courseId: string, playlistId: string): Promise<Video[]> => {
  const res = await apiClient.get(`/admin/courses/${courseId}/playlists/${playlistId}/videos`);
  return res.data.videos;
};

export const initiateDirectUpload = async (
  courseId: string,
  playlistId: string,
  data: { title: string; description: string; order: number; isFreePreview: boolean }
): Promise<{ videoId: string; bunnyVideoGuid: string; uploadUrl: string; apiKey: string }> => {
  const res = await apiClient.post(
    `/admin/courses/${courseId}/playlists/${playlistId}/videos/initiate-upload`,
    data
  );
  return res.data;
};

export const uploadVideoDirectToBunny = async (
  uploadUrl: string,
  apiKey: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> => {
  await axios.put(uploadUrl, file, {
    headers: {
      AccessKey: apiKey,
      'Content-Type': 'application/octet-stream',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress?.(percent);
      }
    },
  });
};

export const uploadVideo = async (
  courseId: string,
  playlistId: string,
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<Video> => {
  const res = await apiClient.post(
    `/admin/courses/${courseId}/playlists/${playlistId}/videos/upload`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.(percent);
        }
      },
    }
  );
  return res.data;
};

export const replaceVideo = async (
  courseId: string,
  playlistId: string,
  videoId: string,
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<void> => {
  await apiClient.post(
    `/admin/courses/${courseId}/playlists/${playlistId}/videos/${videoId}/replace`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.(percent);
        }
      },
    }
  );
};

export const createVideo = async (
  courseId: string,
  playlistId: string,
  data: { title: string; description: string; bunnyVideoGuid: string; order: number; isFreePreview: boolean }
): Promise<Video> => {
  const res = await apiClient.post(
    `/admin/courses/${courseId}/playlists/${playlistId}/videos`,
    data
  );
  return res.data;
};

export const updateVideo = async (
  courseId: string,
  playlistId: string,
  videoId: string,
  data: Partial<{ title: string; description: string; bunnyVideoGuid: string; order: number; isFreePreview: boolean }>
): Promise<void> => {
  await apiClient.put(
    `/admin/courses/${courseId}/playlists/${playlistId}/videos/${videoId}`,
    data
  );
};

export const deleteVideo = async (
  courseId: string,
  playlistId: string,
  videoId: string
): Promise<void> => {
  await apiClient.delete(
    `/admin/courses/${courseId}/playlists/${playlistId}/videos/${videoId}`
  );
};
