import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Fields that users are NOT allowed to modify themselves
// These can only be changed by admins through the admin panel
const PROTECTED_FIELDS = [
  'isAdmin',
  'userType',
  'role',
  'permissions',
  'createdAt',
  'uid',
];

// Fetch user data from Firestore
export const fetchUserDataFromFirestore = async (uid: string) => {
  if (!uid) {
    console.error('UID is missing. Cannot fetch user data.');
    return null;
  }

  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching user data from Firestore:', error);
    return null;
  }
};

/**
 * Sanitize user data by removing protected fields
 * This prevents privilege escalation attacks
 */
const sanitizeUserData = (data: Record<string, any>): Record<string, any> => {
  const sanitized = { ...data };

  for (const field of PROTECTED_FIELDS) {
    if (field in sanitized) {
      console.warn(`Attempted to modify protected field: ${field}`);
      delete sanitized[field];
    }
  }

  return sanitized;
};

/**
 * Update user data in Firestore
 * SECURITY: Protected fields (isAdmin, userType, etc.) are automatically removed
 * to prevent privilege escalation attacks
 */
export const updateUserDataInFirestore = async (uid: string, updatedData: any) => {
  if (!uid || !updatedData) {
    console.error('UID or updated data is missing. Cannot update user data.');
    return;
  }

  try {
    // Remove protected fields to prevent privilege escalation
    const safeData = sanitizeUserData(updatedData);

    // Add timestamp for tracking
    safeData.updatedAt = new Date().toISOString();

    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, safeData, { merge: true });
  } catch (error) {
    console.error('Error updating user data in Firestore:', error);
  }
};
