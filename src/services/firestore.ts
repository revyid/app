import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ─── Generic CRUD Operations ────────────────────────────────────────

export async function getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as T;
  } catch (err) {
    console.error(`[Firestore] getDocument error:`, err);
    return null;
  }
}

export async function getDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  try {
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  } catch (err) {
    console.error(`[Firestore] getDocuments error:`, err);
    return [];
  }
}

export async function setDocument(
  collectionName: string,
  docId: string,
  data: DocumentData
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, { ...data, updatedAt: Timestamp.now() }, { merge: true });
    return true;
  } catch (err) {
    console.error(`[Firestore] setDocument error:`, err);
    return false;
  }
}

export async function addDocument(
  collectionName: string,
  data: DocumentData
): Promise<string | null> {
  try {
    const docRef = doc(collection(db, collectionName));
    await setDoc(docRef, { ...data, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
    return docRef.id;
  } catch (err) {
    console.error(`[Firestore] addDocument error:`, err);
    return null;
  }
}

export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
    return true;
  } catch (err) {
    console.error(`[Firestore] updateDocument error:`, err);
    return false;
  }
}

export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error(`[Firestore] deleteDocument error:`, err);
    return false;
  }
}

// ─── Real-time Listener ─────────────────────────────────────────────

export function onDocumentChange<T>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void
): () => void {
  const docRef = doc(db, collectionName, docId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as T);
    } else {
      callback(null);
    }
  });
}

export function onCollectionChange<T>(
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void
): () => void {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(q, (querySnapshot) => {
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    callback(data);
  });
}

// ─── Portfolio-specific Operations ──────────────────────────────────

export interface FirestoreProject {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  thumbnail: string;
  href?: string;
  category: string;
  color: string;
  icon: string;
  date: string;
  role: string;
  status: 'live' | 'wip' | 'archived';
  featured: boolean;
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export async function getProjects(): Promise<FirestoreProject[]> {
  return getDocuments<FirestoreProject>('projects', [
    orderBy('order', 'asc'),
  ]);
}

export async function getProject(id: string): Promise<FirestoreProject | null> {
  return getDocument<FirestoreProject>('projects', id);
}

export async function saveProject(project: Omit<FirestoreProject, 'id'> & { id?: string }): Promise<string | null> {
  if (project.id) {
    await updateDocument('projects', project.id, project);
    return project.id;
  }
  return addDocument('projects', { ...project, order: project.order ?? 0 });
}

export async function deleteProject(id: string): Promise<boolean> {
  return deleteDocument('projects', id);
}

// ─── Contact Messages ───────────────────────────────────────────────

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt?: Timestamp;
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  return getDocuments<ContactMessage>('contact_messages', [
    orderBy('createdAt', 'desc'),
    limit(50),
  ]);
}

export async function markMessageRead(id: string): Promise<boolean> {
  return updateDocument('contact_messages', id, { read: true });
}

export async function deleteMessage(id: string): Promise<boolean> {
  return deleteDocument('contact_messages', id);
}

// ─── Site Analytics (Firestore) ─────────────────────────────────────

export interface PageView {
  id: string;
  path: string;
  referrer?: string;
  userAgent?: string;
  ip?: string;
  createdAt?: Timestamp;
}

export async function trackPageView(view: Omit<PageView, 'id'>): Promise<string | null> {
  return addDocument('page_views', view);
}

export async function getPageViews(days: number = 30): Promise<PageView[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return getDocuments<PageView>('page_views', [
    orderBy('createdAt', 'desc'),
    limit(1000),
  ]);
}
