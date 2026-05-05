import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { dbService } from '../services/db';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, CheckCircle2, AlertCircle, Camera, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { loadModels, getFaceDescriptor } from '@/src/services/ai';
import { useNavigate } from 'react-router-dom';

export const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ studentId: '', parentEmail: '' });

  useEffect(() => {
    if (profile) {
      setFormData({ 
        studentId: profile.studentId || '', 
        parentEmail: profile.parentEmail || '' 
      });
    }
  }, [profile]);

  const updateProfile = async () => {
    if (!user) return;
    await dbService.saveUser(user.uid, { ...profile, ...formData });
    setEditing(false);
    toast.success("Profile updated!");
  };

  const fetchData = async () => {
    if (user) {
      const all = await dbService.getCourses();
      setCourses(all || []);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black font-sans tracking-tight text-gray-900">Student Hub_</h1>
          <p className="text-gray-500 font-medium font-sans uppercase text-xs tracking-widest">Track your attendance and classes</p>
        </div>
        {!profile?.descriptors && (
          <Button variant="outline" className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => navigate('/register')}>
             <Camera className="w-4 h-4" /> Register Face
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-1 border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Profile</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
              {editing ? "Cancel" : "Edit"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>Student ID</Label>
                  <Input 
                    value={formData.studentId} 
                    onChange={e => setFormData(p => ({ ...p, studentId: e.target.value }))} 
                  />
                </div>
                <div className="space-y-1">
                  <Label>Parent Email</Label>
                  <Input 
                    type="email"
                    value={formData.parentEmail} 
                    onChange={e => setFormData(p => ({ ...p, parentEmail: e.target.value }))} 
                  />
                </div>
                <Button className="w-full" onClick={updateProfile}>Save Changes</Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Users className="text-gray-400" />
                  </div>
                  <div>
                    <p className="font-bold">{profile?.displayName}</p>
                    <p className="text-xs text-gray-500 font-mono tracking-tighter">{profile?.studentId || 'No ID Set'}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 uppercase font-bold">Details</p>
                  <p className="text-sm font-medium">Parent: {profile?.parentEmail || 'Not defined'}</p>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    Auth Verified
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${profile?.descriptors ? 'text-green-600' : 'text-amber-500'}`}>
                    {profile?.descriptors ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    Face Data: {profile?.descriptors ? 'Enabled' : 'Missing'}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList className="bg-gray-100 p-1">
              <TabsTrigger value="overview">My Courses</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {courses.length > 0 ? courses.map(course => (
                  <Card key={course.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/student/${user?.uid}`)}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{course.name}</CardTitle>
                      <CardDescription>{course.code}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">Enrolled</Badge>
                    </CardFooter>
                  </Card>
                )) : (
                  <div className="col-span-2 text-center py-12 border-2 border-dashed rounded-xl text-gray-400">
                    You are not enrolled in any courses yet.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export const RegisterFace = () => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadModels().then(() => setReady(true));
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(t => t.stop());
        }
    }
  }, []);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    if (videoRef.current) videoRef.current.srcObject = stream;
  };

  const capture = async () => {
    if (!videoRef.current || !user) return;
    setLoading(true);
    const descriptor = await getFaceDescriptor(videoRef.current);
    if (descriptor) {
      await dbService.saveFaceDescriptor(user.uid, Array.from(descriptor));
      toast.success("Face registered successfully!");
    } else {
      toast.error("No face detected. Please try again.");
    }
    setLoading(false);
  };

  return (
    <Card className="max-w-md mx-auto mt-12 border-none shadow-2xl">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Camera className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold font-sans">Biometric Registration</CardTitle>
        <CardDescription>Scan your face to enable automatic attendance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative border-2 border-dashed border-gray-200">
          <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
        </div>
        {!videoRef.current?.srcObject ? (
          <Button onClick={startCamera} className="w-full" variant="outline">Open Camera</Button>
        ) : (
          <Button onClick={capture} className="w-full bg-blue-600" disabled={loading || !ready}>
            {loading ? <RefreshCw className="animate-spin w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            {loading ? "Processing..." : "Capture & Register Face"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
