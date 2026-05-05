import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isTeacher: false,
  isStudent: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          // Force teacher role for the owner email if it's not set
          if (user.email === 'chitranshpal933@gmail.com' && data.role !== 'teacher') {
            const updatedProfile = { ...data, role: 'teacher' };
            setProfile(updatedProfile);
          } else {
            setProfile(data);
          }
        } else {
          // New user defaults to student for safety, except for the owner
          const isOwner = user.email === 'chitranshpal933@gmail.com';
          const newProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: isOwner ? 'teacher' : 'student',
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'users', user.uid), newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'teacher' || user?.email === 'chitranshpal933@gmail.com',
    isTeacher: profile?.role === 'teacher' || user?.email === 'chitranshpal933@gmail.com',
    isStudent: profile?.role === 'student' && user?.email !== 'chitranshpal933@gmail.com',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
