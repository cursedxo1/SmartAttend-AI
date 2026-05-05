import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Camera, Users, ShieldCheck, GraduationCap, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '@/src/hooks/useAuth';
import { signInWithPopup, auth, googleProvider } from '@/src/lib/firebase';

export const Home = () => {
  const navigate = useNavigate();
  const { user, isTeacher } = useAuth();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#FAFAFA]">
      <section className="max-w-7xl mx-auto px-4 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" />
            AI-Powered Attendance System
          </div>
          <h1 className="text-6xl sm:text-7xl font-black tracking-tighter leading-[0.9] text-gray-900">
            Identity as the <br /> <span className="text-blue-600">New Key_</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-lg leading-relaxed">
            A frictionless, high-security attendance system that leverages advanced biometric recognition to eliminate friction in the classroom.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Button size="lg" className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-lg font-bold rounded-2xl gap-2 shadow-xl shadow-blue-200" onClick={() => navigate('/scan')}>
              <Camera className="w-5 h-5" /> Wait - Scan Here
            </Button>
            {!user ? (
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-2xl border-2" onClick={() => signInWithPopup(auth, googleProvider)}>
                Institutional Portal
              </Button>
            ) : (
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-2xl border-2 gap-2" onClick={() => navigate(isTeacher ? '/teacher' : `/student/${user.uid}`)}>
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 relative">
          <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100/50 to-transparent rounded-[3rem] -z-10 blur-2xl"></div>
          
          <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden mt-12 bg-white">
            <CardHeader className="p-8">
              <Users className="w-10 h-10 text-blue-600 mb-2" />
              <CardTitle className="text-2xl font-black">1.2k+</CardTitle>
              <CardDescription>Active Students</CardDescription>
            </CardHeader>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-black text-white">
            <CardHeader className="p-8">
              <GraduationCap className="w-10 h-10 text-blue-400 mb-2" />
              <CardTitle className="text-2xl font-black">98.5%</CardTitle>
              <CardDescription className="text-gray-400">Scan Accuracy</CardDescription>
            </CardHeader>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-blue-600 text-white col-span-2 p-1 relative group cursor-pointer">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544391682-c7004c2cb2e8?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center mix-blend-overlay opacity-30 group-hover:scale-105 transition-transform duration-700"></div>
             <CardHeader className="p-10 relative z-10">
               <CardTitle className="text-3xl font-black">Smart Automation</CardTitle>
               <CardDescription className="text-blue-100 text-lg">Parent notifications and automated PDF reports in one click.</CardDescription>
             </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
};
