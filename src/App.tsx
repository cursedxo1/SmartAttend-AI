import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Navigation } from './components/Navigation';
import { Toaster } from 'sonner';
import { Home } from './pages/Home';
import { FaceLogin } from './pages/FaceLogin';
import { TeacherPortal } from './pages/TeacherPortal';
import { AdminPortal } from './pages/AdminPortal';
import { StudentDashboard, RegisterFace } from './pages/StudentPortal';
import { StudentInfo } from './pages/StudentInfo';
import { RefreshCw } from 'lucide-react';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: 'teacher' | 'student' }) {
  const { user, loading, isTeacher, isStudent } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="animate-spin text-blue-600" /></div>;
  if (!user) return <Navigate to="/" />;
  
  if (role === 'teacher' && !isTeacher) return <Navigate to="/" />;
  if (role === 'student' && !isStudent) return <Navigate to="/" />;

  return <>{children}</>;
}

function AppContent() {
  const { loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <RefreshCw className="animate-spin text-blue-600 w-8 h-8" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navigation />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scan" element={<FaceLogin />} />
          <Route 
            path="/teacher" 
            element={
              <ProtectedRoute role="teacher">
                <TeacherPortal />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute role="teacher">
                <AdminPortal />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student" 
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/student/:id" element={<StudentInfo />} />
          <Route 
            path="/register" 
            element={
              <ProtectedRoute>
                <RegisterFace />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
