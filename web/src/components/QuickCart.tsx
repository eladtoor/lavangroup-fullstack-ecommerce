'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { setCartItems } from '@/lib/redux/slices/cartSlice';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { saveCartToFirestore } from '@/utils/cartUtils';
import { Product } from '@/lib/redux/reducers/productReducer';

interface PurchaseItem {
  _id: string;
  name?: string;
  sku?: string;
  price?: number;
  quantity?: number;
  packageSize?: number;
  quantities?: number;
  comment?: string;
  materialGroup?: string;
  selectedAttributes?: Record<string, any>;
  craneUnload?: boolean | null;
}

export default function QuickCart() {
  const user = useAppSelector((state) => state.user?.user);
  const products = useAppSelector((state) => state.products?.products || []);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [recentPurchases, setRecentPurchases] = useState<PurchaseItem[]>([]);

  useEffect(() => {
    if (user?.uid) {
      fetchLastPurchase();
    }
  }, [user]);

  const fetchLastPurchase = async () => {
    try {
      const purchasesRef = collection(db, 'users', user!.uid, 'purchases');
      const q = query(purchasesRef, orderBy('date', 'desc'), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const lastPurchase = querySnapshot.docs[0].data();
        setRecentPurchases(lastPurchase.cartItems || []);
      }
    } catch (error) {
      console.error('Error fetching last purchase:', error);
    }
  };

  const mergeProductData = (product: PurchaseItem) => {
    const productDetails: Product | undefined = products.find((p: Product) => p._id === product._id);
    const quantity = product.quantity || 1;
    const unitPrice = product.price || productDetails?.['מחיר רגיל'] || 0;
    const price = unitPrice * quantity;

    return {
      ...product,
      productId: product._id,
      image: productDetails?.תמונות || '/default-image.jpg',
      unitPrice,
      price,
      sku: product.sku || productDetails?.['מק"ט'] || 'לא זמין',
      name: product.name || productDetails?.שם || 'ללא שם',
      quantity,
      packageSize: product.packageSize || product.quantities || 1,
      materialGroup: product.materialGroup || productDetails?.materialGroup || '',
      selectedAttributes: product.selectedAttributes || {},
      craneUnload: product.craneUnload !== undefined ? product.craneUnload : null,
      cartItemId: `${product._id}-${Date.now()}`,
    };
  };

  const handleAddAllToCart = async () => {
    const mergedCartItems = recentPurchases.map((product) => mergeProductData(product));
    dispatch(setCartItems(mergedCartItems));
    await saveCartToFirestore(mergedCartItems);
    router.push('/cart');
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6 my-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">עגלה מהירה</h2>
      {recentPurchases.length === 0 ? (
        <p className="text-gray-600">אין לך רכישות קודמות.</p>
      ) : (
        <div>
          <ul className="divide-y divide-gray-200">
            {recentPurchases.map((item) => {
              const mergedItem = mergeProductData(item);
              return (
                <li key={mergedItem.cartItemId} className="flex items-center justify-between py-3">
                  <div className="flex items-center">
                    <img
                      src={mergedItem.image}
                      alt={`${mergedItem.name} - עגלת קניות מהירה | לבן גרופ`}
                      title={mergedItem.name}
                      className="w-16 h-16 object-cover rounded-md mr-4"
                    />
                    <div>
                      <h3 className="text-sm font-semibold">{mergedItem.name}</h3>
                      <p className="text-gray-500">מק"ט: {mergedItem.sku}</p>
                      <p className="text-gray-500">כמות אחרונה: {mergedItem.quantity}</p>
                      {mergedItem.comment && <p className="text-sm text-gray-600">הערות: {mergedItem.comment}</p>}
                      <p className="text-sm text-gray-600">מחיר ליחידה: ₪{mergedItem.unitPrice.toFixed(2)}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <button
            className="mt-4 w-full bg-green-600 text-white py-2 rounded-md font-semibold hover:bg-green-700 transition"
            onClick={handleAddAllToCart}
          >
            הוסף את כל המוצרים לעגלה ועבור לעגלה
          </button>
        </div>
      )}
    </div>
  );
}
