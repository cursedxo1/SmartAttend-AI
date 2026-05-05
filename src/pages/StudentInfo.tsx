import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '@/src/services/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, Clock, Calendar, CheckCircle2, ChevronLeft, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export const StudentInfo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      try {
        const u = await dbService.getUser(id);
        if (u) {
          setProfile(u);
          // Simplified enrollment fetch for demo
          const allCourses = await dbService.getCourses();
          setCourses(allCourses || []);
        }
      } catch (err) {
        toast.error("Profile not found");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <div className="p-20 text-center">Loading Information...</div>;
  if (!profile) return <div className="p-20 text-center">User not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 py-8 space-y-8">
      <Button variant="ghost" className="mb-4 gap-2" onClick={() => navigate('/')}>
        <ChevronLeft className="w-4 h-4" /> Back to Dashboard
      </Button>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-5xl font-black tracking-tight">{profile.displayName}</h1>
            <p className="text-gray-500 font-mono mt-2">{profile.studentId || "NO-ID-ASSIGNED"}</p>
          </motion.div>

          <Card className="border-none shadow-xl bg-blue-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Attendance Status
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="text-xs text-blue-100 uppercase font-bold mb-1">Overall Presence</p>
                <p className="text-3xl font-black">94%</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="text-xs text-blue-100 uppercase font-bold mb-1">Lectures Attended</p>
                <p className="text-3xl font-black">158</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2"><Clock className="w-4 h-4" /> Last Seen</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-bold">{new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Enrollment Date</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-bold">{new Date(profile.createdAt).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="w-full md:w-80 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Enrolled Courses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {courses.map(course => (
                <div key={course.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center group cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="text-sm font-bold">{course.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{course.code}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">95%</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button className="w-full h-12 gap-2 bg-black hover:bg-gray-800">
            <Download className="w-4 h-4" /> Export My Report
          </Button>
        </div>
      </div>
    </div>
  );
};
