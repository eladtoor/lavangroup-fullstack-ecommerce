'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
interface OrderData {
  purchaseId: string;
  cartItems: any[];
  totalPrice: number;
  shippingCost: number;
  craneUnloadCost: number;
  shippingAddress: {
    city: string;
    street: string;
    apartment: string;
    floor: string;
    entrance: string;
  };
}

export default function OrderConfirmation() {
  const router = useRouter();
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  useEffect(() => {
    // Get order data from localStorage (set by CartPage before navigation)
    const savedOrderData = localStorage.getItem('orderData');
    if (savedOrderData) {
      setOrderData(JSON.parse(savedOrderData));
      // Clear it after loading
      localStorage.removeItem('orderData');
    }
  }, []);

  const breadcrumbItems = [
    { label: 'דף הבית', href: '/' },
    { label: 'העגלה שלי', href: '/cart' },
    { label: 'אישור הזמנה' }
  ];

  if (!orderData) {
    return (
      <>
        <div className="max-w-lg mx-auto mt-32 mb-12 p-12 text-center">
          <p>שגיאה: אין מידע על ההזמנה</p>
        </div>
        </>
    );
  }

  return (
    <>
      <div className="max-w-lg mx-auto mt-32 mb-12 p-12 text-center bg-white shadow-md rounded-lg">
        <Breadcrumbs items={breadcrumbItems} />
        <h1 className="text-green-600 text-2xl font-bold">תודה על ההזמנה שלך!</h1>
        <p className="mt-4 text-lg">מספר הזמנה: <strong>{orderData.purchaseId}</strong></p>
        <h3 className="mt-6 text-xl font-semibold">פרטי הזמנה:</h3>

        {/* Shipping Address */}
        <div className="mt-6 text-right text-gray-700">
          <h4 className="font-semibold text-lg mb-2">כתובת למשלוח:</h4>
          <p>עיר: {orderData.shippingAddress.city || 'לא צויין'}</p>
          <p>רחוב: {orderData.shippingAddress.street || 'לא צויין'}</p>
          <p>דירה: {orderData.shippingAddress.apartment || 'לא צויין'}</p>
          <p>קומה: {orderData.shippingAddress.floor || 'לא צויין'}</p>
          <p>כניסה: {orderData.shippingAddress.entrance || 'לא צויין'}</p>
        </div>

        {/* Product List */}
        <div className="mt-4 space-y-4 text-right">
          {orderData.cartItems.map((item, index) => (
            <div key={index} className="border-b border-gray-300 pb-2">
              <p className="font-bold">{item.baseName || item.name || 'מוצר ללא שם'}</p>
              {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                <p className="text-xs text-gray-500">
                  {Object.entries(item.selectedAttributes).map(
                    ([key, value]: [string, any]) => `${key}: ${value.value}`
                  ).join(' | ')}
                </p>
              )}
              <p>כמות: {item.quantity}</p>
              <p>מחיר ליחידה: ₪{(item.unitPrice?.toFixed(2) || item.price?.toFixed(2) || 0)}</p>
              <p>סה"כ: ₪{((item.unitPrice || item.price || 0) * item.quantity).toFixed(2)}</p>
              {item.comment && <p className="italic text-gray-500">הערה: {item.comment}</p>}
            </div>
          ))}
        </div>

        {/* Cost Summary */}
        <div className="mt-6 border-t border-gray-400 pt-4 text-right text-lg text-gray-700">
          {(() => {
            const vatRate = 0.18;
            const totalWithVAT = orderData.totalPrice;
            const vatAmount = totalWithVAT * vatRate / (1 + vatRate);
            const totalBeforeVAT = totalWithVAT - vatAmount;

            return (
              <>
                {orderData.shippingCost > 0 && (
                  <p>משלוח: ₪{orderData.shippingCost.toFixed(2)}</p>
                )}
                {orderData.craneUnloadCost > 0 && (
                  <p>פריקת מנוף: ₪{orderData.craneUnloadCost.toFixed(2)}</p>
                )}
                <p>סה"כ לפני מע"מ: ₪{totalBeforeVAT.toFixed(2)}</p>
                <p>מע"מ (18%): ₪{vatAmount.toFixed(2)}</p>
                <p className="font-bold text-red-600">סה"כ לתשלום: ₪{totalWithVAT.toFixed(2)}</p>
              </>
            );
          })()}
        </div>

        <button
          className="mt-6 bg-green-600 text-white py-2 px-6 rounded-md text-lg cursor-pointer hover:bg-green-700 transition"
          onClick={() => router.push('/')}
        >
          חזרה לעמוד הראשי
        </button>
      </div>
      </>
  );
}
