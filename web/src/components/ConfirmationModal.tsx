'use client';

import React from 'react';

interface CartItem {
  _id?: string;
  cartItemId?: string;
  baseName?: string;
  name?: string;
  שם?: string;
  selectedAttributes?: Record<string, { value: string; price?: number }>;
  quantity: number;
  unitPrice?: number;
  price?: number;
  comment?: string;
}

interface ConfirmationModalProps {
  cartItems: CartItem[];
  finalTotalPrice: number;
  shippingCost: number;
  craneUnloadCost: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  cartItems,
  finalTotalPrice,
  shippingCost,
  craneUnloadCost,
  onConfirm,
  onCancel
}: ConfirmationModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      {/* Modal Content */}
      <div className="bg-white w-11/12 max-w-md p-6 rounded-lg shadow-xl text-center transform scale-95 animate-fadeIn">
        <h2 className="text-2xl font-bold text-gray-800">אישור הזמנה</h2>
        <p className="text-gray-600 mt-2">האם אתה בטוח שאתה רוצה לסיים את ההזמנה?</p>

        {/* Order Summary */}
        <div className="mt-4 bg-gray-100 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700">סיכום הזמנה:</h3>
          <div className="mt-2 space-y-2 text-right text-sm text-gray-700">
            {cartItems.map((item) => (
              <div key={item._id || item.cartItemId} className="border-b border-gray-300 pb-2">
                <p className="font-bold">{item.baseName || item.name || item.שם || "מוצר ללא שם"}</p>
                {/* Selected attributes */}
                {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                  <p className="text-xs text-gray-500">
                    {Object.entries(item.selectedAttributes).map(([key, value]) => `${key}: ${value.value}`).join(" | ")}
                  </p>
                )}
                <p>כמות: {item.quantity}</p>
                <p>מחיר ליחידה: ₪{(item.unitPrice?.toFixed(2) || item.price?.toFixed(2) || 0)}</p>
                <p>סה"כ: ₪{((item.unitPrice || item.price || 0) * item.quantity).toFixed(2)}</p>
                {item.comment && <p className="italic text-gray-500">הערה: {item.comment}</p>}
              </div>
            ))}

            {/* Shipping */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-400 pt-2">
                <p>משלוח: ₪{shippingCost?.toFixed(2) || 0}</p>
                {craneUnloadCost > 0 && (
                  <p>פריקת מנוף: ₪{craneUnloadCost}</p>
                )}
              </div>
            )}
          </div>

          <p className="text-xl font-bold text-red-500 mt-2">סה"כ לתשלום: ₪{finalTotalPrice.toFixed(2)}</p>
        </div>

        {/* Confirm and Cancel buttons */}
        <div className="mt-6 flex justify-center gap-4">
          <button
            className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 transition"
            onClick={onConfirm}
          >
            כן, אני בטוח
          </button>
          <button
            className="px-6 py-2 bg-red-600 text-white font-semibold rounded-md shadow-md hover:bg-red-700 transition"
            onClick={onCancel}
          >
            לא, חזור
          </button>
        </div>
      </div>
    </div>
  );
}
