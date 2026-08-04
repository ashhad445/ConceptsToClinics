import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { UploadProvider } from './context/UploadContext';
import { FloatingUploadManager } from './components/FloatingUploadManager';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import StudentsPage from './pages/StudentsPage';
import StudentDetailPage from './pages/StudentDetailPage';
import CodesPage from './pages/CodesPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <UploadProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1E293B',
              color: '#F1F5F9',
              border: '1px solid #263347',
              fontSize: '13.5px',
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#1E293B' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#1E293B' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
          <Route path="/students/:id" element={<ProtectedRoute><StudentDetailPage /></ProtectedRoute>} />
          <Route path="/codes" element={<ProtectedRoute><CodesPage /></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
          <Route path="/courses/:id" element={<ProtectedRoute><CourseDetailPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/students" replace />} />
        </Routes>
        <FloatingUploadManager />
      </UploadProvider>
    </BrowserRouter>
  );
};

export default App;
