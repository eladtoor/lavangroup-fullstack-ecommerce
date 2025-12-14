import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

// Update user data in Firestore
export const updateUserDataInFirestore = async (uid: string, updatedData: any) => {
  if (!uid || !updatedData) {
    console.error('UID or updated data is missing. Cannot update user data.');
    return;
  }

  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, updatedData, { merge: true });
  } catch (error) {
    console.error('Error updating user data in Firestore:', error);
  }
};
