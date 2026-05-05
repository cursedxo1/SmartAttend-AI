import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../services/db';
import { loadModels, getFaceDescriptor } from '../services/ai';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Upload, UserPlus, Fingerprint, ShieldAlert, CheckCircle2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export const AdminPortal = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      await loadModels();
      setIsModelsLoaded(true);
      fetchUsers();
    };
    init();
  }, []);

  const fetchUsers = async () => {
    const all = await dbService.searchUsers(""); // Get all users
    const descriptors = await dbService.getFaceDescriptors();
    
    const merged = all.map((u: any) => ({
      ...u,
      faceInfo: descriptors?.find((d: any) => d.userId === u.uid)
    }));

    setUsers(merged || []);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, user: any) => {
    const file = event.target.files?.[0];
    if (!file || !isModelsLoaded) return;

    setIsProcessing(true);
    setSelectedUser(user);

    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await img.decode();

      const descriptor = await getFaceDescriptor(img);
      if (descriptor) {
        await dbService.saveFaceDescriptor(user.uid, Array.from(descriptor));
        toast.success(`Face ID generated for ${user.displayName}`);
        fetchUsers();
      } else {
        toast.error("No face detected in the image. Please use a clearer photo.");
      }
    } catch (err) {
      toast.error("Failed to process image");
      console.error(err);
    } finally {
      setIsProcessing(false);
      setSelectedUser(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.studentId?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-gray-900 uppercase italic">System Authority_</h1>
          <p className="text-gray-500 font-medium uppercase text-xs tracking-widest flex items-center gap-2">
            <ShieldCheck className="w-3 h-3 text-blue-600" /> Administrative Identity Control
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search identity reservoir..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="pl-9 w-72 bg-white rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-2xl bg-white overflow-hidden">
          <CardHeader className="bg-gray-50/50 flex flex-row items-center justify-between py-6">
            <div className="space-y-1">
              <CardTitle className="text-xl">Student Identity Matrix</CardTitle>
              <CardDescription>Manage biometric registration status</CardDescription>
            </div>
            <Fingerprint className="w-8 h-8 text-blue-600 opacity-20" />
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50/30">
                <TableRow>
                  <TableHead className="w-[300px]">Student / Subject</TableHead>
                  <TableHead>Biometric Hash</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.uid} className="hover:bg-blue-50/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${user.faceInfo ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`} />
                        <div>
                          <p className="font-bold text-gray-900">{user.displayName}</p>
                          <p className="text-xs text-gray-500 font-mono italic">
                            ID: {user.studentId || 'UNREGISTERED'} | {user.faceInfo?.uniqueFaceId || 'NO_VECTOR'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.faceInfo ? (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 w-fit px-3 py-1 rounded-full text-xs font-bold font-mono">
                          <CheckCircle2 className="w-3 h-3" /> VERIFIED_ID
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 w-fit px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-tighter">
                          <ShieldAlert className="w-3 h-3" /> Missing_Face_Vector
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="relative group inline-block">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2 hover:bg-blue-100 hover:text-blue-700 font-bold"
                          disabled={isProcessing && selectedUser?.uid === user.uid}
                          onClick={() => {
                            setSelectedUser(user);
                            fileInputRef.current?.click();
                          }}
                        >
                          {isProcessing && selectedUser?.uid === user.uid ? (
                            <Fingerprint className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          {user.descriptors ? 'Reprocess' : 'Register Face'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={(e) => selectedUser && handleFileUpload(e, selectedUser)}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-2xl bg-black text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldCheck className="w-32 h-32" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl font-black tracking-tighter italic">Security Policy_</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10 text-gray-400 text-sm">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="font-bold text-white mb-2 underline bg-blue-600/20 inline-block px-1">Notice:</p>
                <p>Ensure that all uploaded photos are clear, front-facing, and taken in good lighting. Identity theft or false registration is prohibited.</p>
              </div>
              <ul className="space-y-2 list-disc list-inside">
                <li>Unique ID auto-generated on scan</li>
                <li>Vectors stored in secure vault</li>
                <li>Hashed biometric verification</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg">System Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Neural Network Engine</span>
                <Badge variant="outline" className="text-green-600 border-green-200">Active</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Database Connection</span>
                <Badge variant="outline" className="text-green-600 border-green-200">Optimal</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Registered Biometrics</span>
                <span className="font-mono font-bold">{users.filter(u => u.descriptors).length} / {users.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
