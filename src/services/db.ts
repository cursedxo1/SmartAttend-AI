import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  setDoc,
  deleteDoc,
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const dbService = {
  async getCourses(teacherId?: string) {
    const path = 'courses';
    try {
      const q = teacherId 
        ? query(collection(db, path), where('teacherId', '==', teacherId))
        : collection(db, path);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
  },

  async createCourse(data: any) {
    const path = 'courses';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...data,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  async getEnrollments(courseId: string) {
    const path = 'enrollments';
    try {
      const q = query(collection(db, path), where('courseId', '==', courseId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
  },

  async enrollStudent(courseId: string, userId: string) {
    const path = 'enrollments';
    try {
      await setDoc(doc(db, path, `${courseId}_${userId}`), {
        courseId,
        userId,
        enrolledAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async saveAttendance(courseId: string, userId: string, date: string, status: string) {
    const path = 'attendanceRecords';
    try {
      const id = `${courseId}_${userId}_${date}`;
      await setDoc(doc(db, path, id), {
        courseId,
        userId,
        date,
        status,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async getAttendanceReport(courseId: string) {
    const path = 'attendanceRecords';
    try {
      const q = query(collection(db, path), where('courseId', '==', courseId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
  },

  async saveFaceDescriptor(userId: string, descriptors: number[]) {
    const path = 'faceDescriptors';
    try {
      // Generate a unique Face ID for this specific biometric capture
      const uniqueFaceId = `FACE_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      await setDoc(doc(db, path, userId), {
        userId,
        descriptors,
        uniqueFaceId,
        updatedAt: new Date().toISOString()
      });
      return uniqueFaceId;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async getFaceDescriptors() {
    const path = 'faceDescriptors';
    try {
      const snapshot = await getDocs(collection(db, path));
      return snapshot.docs.map(doc => doc.data());
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
  },

  async getUser(uid: string) {
    const path = `users/${uid}`;
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      return userDoc.exists() ? userDoc.data() : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
    }
  },

  async searchUsers(searchTerm: string) {
    const path = 'users';
    try {
      // Basic search (Firestore doesn't do fuzzy well, so we'll just get all and filter in app if small, or use prefix)
      // For this demo, let's just get all users and filter
      const snapshot = await getDocs(collection(db, path));
      const users = snapshot.docs.map(doc => doc.data());
      return users.filter((u: any) => 
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
  },
  async saveUser(uid: string, data: any) {
    const path = `users/${uid}`;
    try {
      await setDoc(doc(db, 'users', uid), data);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },
};
