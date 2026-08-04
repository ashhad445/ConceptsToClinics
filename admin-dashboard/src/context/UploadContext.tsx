import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { initiateDirectUpload, uploadVideoDirectToBunny, type Video } from '../api/courses';
import toast from 'react-hot-toast';

export interface UploadTask {
  id: string;
  title: string;
  courseId: string;
  playlistId: string;
  videoId?: string;
  file: File;
  progress: number;
  status: 'uploading' | 'encoding' | 'completed' | 'error';
  errorMessage?: string;
}

interface UploadContextType {
  tasks: UploadTask[];
  startUpload: (
    courseId: string,
    playlistId: string,
    title: string,
    description: string,
    order: number,
    isFreePreview: boolean,
    file: File,
    onSuccess?: (newVid: Video) => void
  ) => Promise<void>;
  dismissTask: (taskId: string) => void;
  clearCompleted: () => void;
  isMinimized: boolean;
  setIsMinimized: React.Dispatch<React.SetStateAction<boolean>>;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  const startUpload = async (
    courseId: string,
    playlistId: string,
    title: string,
    description: string,
    order: number,
    isFreePreview: boolean,
    file: File,
    onSuccess?: (newVid: Video) => void
  ) => {
    const taskId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTask: UploadTask = {
      id: taskId,
      title,
      courseId,
      playlistId,
      file,
      progress: 0,
      status: 'uploading',
    };

    setTasks((prev) => [...prev, newTask]);
    setIsMinimized(false);

    try {
      // Step 1: Initiate upload slot (~1KB lightweight API call)
      const initRes = await initiateDirectUpload(courseId, playlistId, {
        title,
        description,
        order,
        isFreePreview,
      });

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, videoId: initRes.videoId } : t))
      );

      const newVid: Video = {
        id: initRes.videoId,
        title,
        description,
        bunnyVideoGuid: initRes.bunnyVideoGuid,
        status: 'uploading',
        order,
        isFreePreview,
        createdAt: { _seconds: Math.floor(Date.now() / 1000) },
      };

      onSuccess?.(newVid);

      // Step 2: Upload binary file directly from browser to Bunny CDN
      await uploadVideoDirectToBunny(initRes.uploadUrl, initRes.apiKey, file, (percent) => {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, progress: percent } : t))
        );
      });

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'completed', progress: 100 } : t))
      );
      toast.success(`" ${title} " uploaded directly to Bunny Stream!`);
    } catch (err: any) {
      console.error(`Upload error for task ${taskId}:`, err);
      const msg = err.response?.data?.message || err.message || 'Upload failed.';
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'error', errorMessage: msg } : t))
      );
      toast.error(`Failed to upload " ${title} ": ${msg}`);
    }
  };

  const dismissTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const clearCompleted = () => {
    setTasks((prev) => prev.filter((t) => t.status !== 'completed'));
  };

  return (
    <UploadContext.Provider
      value={{
        tasks,
        startUpload,
        dismissTask,
        clearCompleted,
        isMinimized,
        setIsMinimized,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
};

export const useUploadManager = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUploadManager must be used within an UploadProvider');
  }
  return context;
};
