import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User, Camera, GraduationCap, Home, ShieldCheck } from 'lucide-react';
import { signInWithPopup, googleProvider, auth, signOut } from '../lib/firebase';
import { useNavigate, useLocation } from 'react-router-dom';

export const Navigation: React.FC = () => {
  const { user, profile, isTeacher, isStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/', show: true },
    { id: 'portal', label: 'Portal', icon: GraduationCap, path: isTeacher ? '/teacher' : '/student', show: !!user },
    { id: 'scan', label: 'Smart Scan', icon: Camera, path: '/scan', show: true },
    { id: 'admin', label: 'Admin Center', icon: ShieldCheck, path: '/admin', show: isTeacher },
    { id: 'register', label: 'Biometrics', icon: User, path: '/register', show: isStudent },
  ];

  const login = () => signInWithPopup(auth, googleProvider);
  const logout = () => {
    signOut(auth);
    navigate('/');
  };

  return (
    <nav className="border-b bg-white sticky top-0 z-50 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between h-full items-center">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
              <Camera className="text-white w-5 h-5" />
            </div>
            <span className="font-black text-xl tracking-tighter">SmartAttend</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navItems.filter(item => item.show).map(item => (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors hover:text-blue-600 ${location.pathname === item.path ? 'text-blue-600' : 'text-gray-500'}`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-gray-900 leading-none">{profile?.displayName}</p>
                  <p className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">{profile?.role}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={logout} className="rounded-full hover:bg-red-50 hover:text-red-600 transition-colors">
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <Button onClick={login} className="rounded-full px-6 font-bold bg-black hover:bg-gray-800">Login</Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
