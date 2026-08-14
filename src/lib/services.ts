import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, DailyTask, CheckIn } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Check if a username is already taken in Firestore
 */
export async function checkUsernameExists(username: string): Promise<boolean> {
  const normalized = username.trim().toLowerCase();
  if (!normalized) return false;
  
  try {
    const q = query(collection(db, 'users'), where('username', '==', normalized));
    const querySnap = await getDocs(q);
    return !querySnap.empty;
  } catch (err) {
    console.warn('Error checking username existence:', err);
    return false;
  }
}

/**
 * Helper to auto-create / heal a missing user profile document in Firestore
 */
export async function createMissingUserProfile(
  uid: string,
  fallbackData?: {
    email?: string;
    username?: string;
    name?: string;
    whatTheyDo?: string;
  }
): Promise<UserProfile> {
  const currentUser = auth.currentUser;
  const email = fallbackData?.email || currentUser?.email || 'user@example.com';
  const rawName = fallbackData?.name || currentUser?.displayName || email.split('@')[0];
  const name = rawName.trim() || 'Member';
  
  let username = fallbackData?.username || email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!username) {
    username = `user_${uid.slice(0, 6)}`;
  }

  let isFirstUser = false;
  try {
    const snap = await getDocs(collection(db, 'users'));
    isFirstUser = snap.empty;
  } catch (e) {
    // ignore
  }

  const newProfile: UserProfile = {
    uid,
    username,
    email,
    name,
    whatTheyDo: fallbackData?.whatTheyDo || 'Accountability Member',
    isAdmin: isFirstUser,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'users', uid), newProfile);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
  }

  return newProfile;
}

/**
 * Sign up a new user
 * First user to register in the system receives isAdmin = true
 */
export async function signUpUser(params: {
  username: string;
  email: string;
  password: string;
  name: string;
  whatTheyDo: string;
}): Promise<UserProfile> {
  const normalizedUsername = params.username.trim().toLowerCase();
  
  // 1. Check username uniqueness
  const isTaken = await checkUsernameExists(normalizedUsername);
  if (isTaken) {
    throw new Error(`Username "@${params.username}" is already taken. Please choose another.`);
  }

  // 2. Create Auth Account or sign in if already exists
  let uid: string;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, params.email.trim(), params.password);
    uid = userCredential.user.uid;
  } catch (err: any) {
    if (err?.code === 'auth/email-already-in-use') {
      // Try to sign in with password to heal the user profile if missing
      try {
        const userCredential = await signInWithEmailAndPassword(auth, params.email.trim(), params.password);
        uid = userCredential.user.uid;
      } catch (signInErr) {
        throw new Error('An account with this email address already exists. Please sign in with your password.');
      }
    } else {
      throw err;
    }
  }

  // 3. Check existing profile or create new
  const existingProfile = await getUserProfile(uid);
  if (existingProfile) {
    return existingProfile;
  }

  return await createMissingUserProfile(uid, {
    email: params.email.trim(),
    username: normalizedUsername,
    name: params.name.trim(),
    whatTheyDo: params.whatTheyDo.trim()
  });
}

/**
 * Log in user using either Username OR Email
 * If username is supplied, look up the email in Firestore first.
 */
export async function logInUser(loginInput: string, password: string): Promise<UserProfile> {
  const trimmedInput = loginInput.trim();
  let emailToUse = trimmedInput;

  // Check if login input is a username (doesn't contain '@')
  if (!trimmedInput.includes('@')) {
    const normalizedUsername = trimmedInput.toLowerCase();
    try {
      const q = query(collection(db, 'users'), where('username', '==', normalizedUsername));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const userData = snap.docs[0].data() as UserProfile;
        emailToUse = userData.email;
      }
    } catch (err) {
      console.warn('Could not query email by username:', err);
    }
  }

  // Sign in with Firebase Auth using resolved email
  const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
  const uid = userCredential.user.uid;

  // Fetch Firestore profile or heal if missing
  let profile = await getUserProfile(uid);
  if (!profile) {
    profile = await createMissingUserProfile(uid, { email: emailToUse });
  }

  return profile;
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Fetch User Profile by UID
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${uid}`);
  }
  
  // Auto-heal missing profile for current authenticated user
  if (auth.currentUser && auth.currentUser.uid === uid) {
    return await createMissingUserProfile(uid);
  }

  return null;
}

/**
 * Lookup user profile by username
 */
export async function getUserByUsername(username: string): Promise<UserProfile | null> {
  const normalized = username.trim().toLowerCase();
  try {
    const q = query(collection(db, 'users'), where('username', '==', normalized));
    const snap = await getDocs(q);

    if (snap.empty) return null;
    return snap.docs[0].data() as UserProfile;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'users');
  }
}

/**
 * Search users matching username query
 */
export async function searchUsersByUsername(queryStr: string): Promise<UserProfile[]> {
  const normalized = queryStr.trim().toLowerCase();
  try {
    const snap = await getDocs(collection(db, 'users'));
    const allUsers = snap.docs.map(d => d.data() as UserProfile);

    if (!normalized) return allUsers;
    return allUsers.filter(u => 
      u.username?.includes(normalized) || u.name?.toLowerCase().includes(normalized)
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'users');
  }
}

/**
 * Fetch all members
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => d.data() as UserProfile);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'users');
  }
}

/**
 * Update user profile details (Name, Username, What They Do)
 */
export async function updateUserProfile(
  uid: string,
  updates: { name: string; username?: string; whatTheyDo: string }
): Promise<void> {
  const payload: Record<string, any> = {
    name: updates.name.trim(),
    whatTheyDo: updates.whatTheyDo.trim()
  };

  if (updates.username) {
    const normalizedUsername = updates.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!normalizedUsername) {
      throw new Error('Username cannot be empty or contain only invalid characters.');
    }

    const currentDoc = await getDoc(doc(db, 'users', uid));
    if (currentDoc.exists()) {
      const currentData = currentDoc.data() as UserProfile;
      if (currentData.username !== normalizedUsername) {
        const isTaken = await checkUsernameExists(normalizedUsername);
        if (isTaken) {
          throw new Error(`Username "@${normalizedUsername}" is already taken. Please choose another.`);
        }
        payload.username = normalizedUsername;
      }
    }
  }

  try {
    await updateDoc(doc(db, 'users', uid), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
  }
}

/**
 * Grant Admin Status to target user without affecting other admins
 */
export async function grantAdminStatus(targetUid: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', targetUid), { isAdmin: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`);
  }
}

/**
 * Revoke Admin Status from target user
 */
export async function revokeAdminStatus(targetUid: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', targetUid), { isAdmin: false });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`);
  }
}

/**
 * Set Admin Status (true or false) for target user
 */
export async function setAdminStatus(targetUid: string, isAdmin: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', targetUid), { isAdmin });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`);
  }
}

/**
 * Transfer Admin Status from current admin to new target user (Legacy)
 */
export async function transferAdminStatus(currentAdminUid: string, targetUid: string): Promise<void> {
  if (currentAdminUid === targetUid) return;

  try {
    // Revoke admin from current
    await updateDoc(doc(db, 'users', currentAdminUid), { isAdmin: false });
    // Grant admin to target
    await updateDoc(doc(db, 'users', targetUid), { isAdmin: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'users');
  }
}

/**
 * Create or Update Daily Task
 */
export async function setDailyTask(date: string, description: string, adminUid: string): Promise<DailyTask> {
  const taskDoc: DailyTask = {
    id: date,
    date,
    description: description.trim(),
    createdBy: adminUid,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'tasks', date), taskDoc);
    return taskDoc;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `tasks/${date}`);
  }
}

/**
 * Get Daily Task for a given date YYYY-MM-DD
 */
export async function getDailyTask(date: string): Promise<DailyTask | null> {
  try {
    const snap = await getDoc(doc(db, 'tasks', date));
    if (snap.exists()) {
      return snap.data() as DailyTask;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `tasks/${date}`);
  }
}

/**
 * Fetch all tasks
 */
export async function getAllTasks(): Promise<DailyTask[]> {
  try {
    const q = query(collection(db, 'tasks'), orderBy('date', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as DailyTask);
  } catch (err) {
    try {
      const snap = await getDocs(collection(db, 'tasks'));
      const tasks = snap.docs.map(d => d.data() as DailyTask);
      return tasks.sort((a, b) => a.date.localeCompare(b.date));
    } catch (innerErr) {
      handleFirestoreError(innerErr, OperationType.LIST, 'tasks');
    }
  }
}

/**
 * Record or update a user's CheckIn for a specific date
 */
export async function recordCheckIn(userId: string, date: string, status: 'done' | 'not_done'): Promise<CheckIn> {
  const checkInId = `${userId}_${date}`;
  const checkIn: CheckIn = {
    id: checkInId,
    userId,
    date,
    status,
    timestamp: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'checkins', checkInId), checkIn);
    return checkIn;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `checkins/${checkInId}`);
  }
}

/**
 * Fetch user's check-in history as a map { dateStr: status }
 */
export async function getUserCheckInMap(userId: string): Promise<Record<string, 'done' | 'not_done'>> {
  try {
    const q = query(collection(db, 'checkins'), where('userId', '==', userId));
    const snap = await getDocs(q);

    const history: Record<string, 'done' | 'not_done'> = {};
    snap.docs.forEach(docSnap => {
      const data = docSnap.data() as CheckIn;
      history[data.date] = data.status;
    });

    return history;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'checkins');
  }
}

/**
 * Fetch check-ins for all users on a specific date (for admin overview)
 */
export async function getCheckInsForDate(date: string): Promise<Record<string, 'done' | 'not_done'>> {
  try {
    const q = query(collection(db, 'checkins'), where('date', '==', date));
    const snap = await getDocs(q);

    const resultMap: Record<string, 'done' | 'not_done'> = {};
    snap.docs.forEach(docSnap => {
      const data = docSnap.data() as CheckIn;
      resultMap[data.userId] = data.status;
    });

    return resultMap;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'checkins');
  }
}
