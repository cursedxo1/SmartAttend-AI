import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { dbService } from '@/src/services/db';
import { exportAttendancePDF } from '@/src/services/pdf';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Search, Download, Plus, Users, ScrollText, Timer, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { FaceRecognition } from '@/src/components/FaceRecognition';
import { notifyParent } from '@/src/services/ai';

const AttendanceSession = ({ course, onBack }: { course: any, onBack: () => void }) => {
  const [presentStudents, setPresentStudents] = useState<string[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      const enrollments = await dbService.getEnrollments(course.id);
      if (enrollments) {
        const students = await Promise.all(enrollments.map((e: any) => dbService.getUser(e.userId)));
        setAllStudents(students.filter(Boolean));
      }
    };
    fetchStudents();
  }, [course.id]);

  const handleDetected = async (userId: string) => {
    if (!presentStudents.includes(userId)) {
      setPresentStudents(prev => [...prev, userId]);
      const date = new Date().toISOString().split('T')[0];
      await dbService.saveAttendance(course.id, userId, date, 'present');
      const student = allStudents.find(s => s.uid === userId);
      toast.success(`Present: ${student?.displayName || 'Student'}`);
    }
  };

  const finishSession = async () => {
    setIsFinishing(true);
    const date = new Date().toISOString().split('T')[0];
    const absentStudents = allStudents.filter(s => !presentStudents.includes(s.uid));
    
    try {
      for (const student of absentStudents) {
        await dbService.saveAttendance(course.id, student.uid, date, 'absent');
        if (student.parentEmail) {
          await notifyParent(student.parentEmail, student.displayName, course.name);
        }
      }
      
      toast.message("Session Finalized", {
        description: `${presentStudents.length} Present, ${absentStudents.length} Absent. Notifications dispatched to parents.`,
      });
      onBack();
    } catch (err) {
      toast.error("Error finalizing session");
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Exit Session
        </Button>
        <div className="text-center">
          <h2 className="text-2xl font-black">{course.name}</h2>
          <p className="text-xs text-gray-500 font-mono italic uppercase tracking-tighter">Live Biometric Feed_</p>
        </div>
        <div className="w-24"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <FaceRecognition courseId={course.id} onDetected={handleDetected} />
        
        <Card className="border-none shadow-2xl bg-white border-r-4 border-r-blue-600">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-blue-600" />
                Live Attendance Roll
              </CardTitle>
              <CardDescription>Scanning for registered profiles...</CardDescription>
            </div>
            <Timer className="w-6 h-6 text-gray-300" />
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] rounded-xl border border-gray-100 bg-gray-50/30 p-4">
              <div className="space-y-3">
                {allStudents.map(student => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={student.uid} 
                    className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100"
                  >
                    <div>
                      <p className="font-bold text-gray-900">{student.displayName}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{student.studentId || 'NO_ID'}</p>
                    </div>
                    {presentStudents.includes(student.uid) ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Present
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-300 border-dashed animate-pulse">
                        Waiting...
                      </Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg font-bold rounded-2xl shadow-xl shadow-blue-100" 
              onClick={finishSession}
              disabled={isFinishing}
            >
              {isFinishing ? "Finalizing Reports..." : "Close Session & Notify Parents"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export const TeacherPortal = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("courses");
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isTakingAttendance, setIsTakingAttendance] = useState(false);
  const [newCourse, setNewCourse] = useState({ name: '', code: '' });

  // Enrollment state
  const [studentSearch, setStudentSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedEnrollCourse, setSelectedEnrollCourse] = useState("");

  const fetchData = async () => {
    if (user) {
      const data = await dbService.getCourses(user.uid);
      setCourses(data || []);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await dbService.createCourse({ ...newCourse, teacherId: user.uid });
    setNewCourse({ name: '', code: '' });
    fetchData();
    toast.success("Course created!");
  };

  const handleExport = async (course: any) => {
    const records = await dbService.getAttendanceReport(course.id);
    const enrollments = await dbService.getEnrollments(course.id);
    const studentsData = await Promise.all((enrollments || []).map((e: any) => dbService.getUser(e.userId)));
    exportAttendancePDF(course.name, records || [], studentsData.filter(Boolean));
  };

  const handleStudentSearch = async () => {
    if (studentSearch.length < 2) return;
    const results = await dbService.searchUsers(studentSearch);
    setSearchResults(results || []);
  };

  const handleEnroll = async (studentId: string) => {
    if (!selectedEnrollCourse) {
      toast.error("Please select a course first");
      return;
    }
    await dbService.enrollStudent(selectedEnrollCourse, studentId);
    toast.success("Student enrolled!");
  };

  const handleDetected = async (userId: string) => {
    if (!selectedCourse) return;
    const date = new Date().toISOString().split('T')[0];
    await dbService.saveAttendance(selectedCourse.id, userId, date, 'present');
    // Fetch user for name
    const student = await dbService.getUser(userId);
    toast.success(`Present: ${student?.displayName || userId}`);
  };

  if (isTakingAttendance && selectedCourse) {
    return <AttendanceSession course={selectedCourse} onBack={() => setIsTakingAttendance(false)} />;
  }

  const filteredCourses = courses.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black font-sans tracking-tight text-gray-900 italic">Teacher Portal_</h1>
          <p className="text-gray-500 font-medium font-sans uppercase text-xs tracking-widest">Manage academic attendance and insights</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search courses..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-64 bg-white border-gray-200 focus:ring-blue-500 rounded-full"
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="courses">Course Management</TabsTrigger>
          <TabsTrigger value="enroll">Student Enrollment</TabsTrigger>
        </TabsList>
        
        <TabsContent value="courses">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="bg-gray-50/50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Active Courses
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCourses.map(course => (
                        <TableRow key={course.id} className="cursor-pointer hover:bg-gray-50 group">
                          <TableCell className="font-mono font-bold text-blue-600">{course.code}</TableCell>
                          <TableCell className="font-medium">{course.name}</TableCell>
                          <TableCell className="text-right flex items-center justify-end gap-2 pr-4">
                            <Button variant="ghost" size="sm" onClick={() => handleExport(course)}>
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => { setSelectedCourse(course); setIsTakingAttendance(true); }}
                            >
                              Start Session
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-none shadow-xl border-t-4 border-t-blue-600">
                <CardHeader>
                  <CardTitle className="text-xl">Add New Course</CardTitle>
                </CardHeader>
                <form onSubmit={handleCreateCourse}>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <Label>Course Code</Label>
                      <Input value={newCourse.code} onChange={e => setNewCourse(p => ({ ...p, code: e.target.value }))} required />
                    </div>
                    <div className="space-y-1">
                      <Label>Course Name</Label>
                      <Input value={newCourse.name} onChange={e => setNewCourse(p => ({ ...p, name: e.target.value }))} required />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full">Create Course</Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="enroll">
          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle>Enroll Students</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-1">
                  <Label>Target Course</Label>
                  <Select value={selectedEnrollCourse} onValueChange={setSelectedEnrollCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-[2] space-y-1">
                  <Label>Search Students</Label>
                  <div className="flex gap-2">
                    <Input placeholder="Search students..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
                    <Button onClick={handleStudentSearch}>Search</Button>
                  </div>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map(s => (
                    <TableRow key={s.uid}>
                      <TableCell>{s.displayName}</TableCell>
                      <TableCell>{s.studentId}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleEnroll(s.uid)}>Enroll</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
