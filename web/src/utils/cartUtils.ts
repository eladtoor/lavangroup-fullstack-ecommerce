import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { CartItem } from "@/lib/redux/slices/cartSlice";

export const saveCartToFirestore = async (cartItems: CartItem[]) => {
  const user = auth.currentUser;
  if (!user) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn("No user is logged in. Cannot save cart to Firestore.");
    }
    return;
  }

  const cartRef = doc(db, "carts", user.uid);
  try {
    await setDoc(cartRef, { cartItems });
  } catch (error) {
    console.error("Error saving cart to Firestore:", error);
  }
};

export const loadCartFromFirestore = async (): Promise<CartItem[]> => {
  const user = auth.currentUser;
  if (!user) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn("No user is logged in. Cannot load cart from Firestore.");
    }
    return [];
  }

  const cartRef = doc(db, "carts", user.uid);
  try {
    const cartSnap = await getDoc(cartRef);

    if (cartSnap.exists()) {
      return cartSnap.data().cartItems || [];
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error loading cart from Firestore:", error);
    return [];
  }
};
