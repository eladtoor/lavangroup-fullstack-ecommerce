'use client';

import React from 'react';
import Image from 'next/image';

interface SelectedAttribute {
  value: string;
  price: number;
}

interface CartItemProps {
  item: {
    cartItemId: string;
    image?: string;
    שם: string;
    baseName?: string;
    sku?: string;
    selectedAttributesWithPrices?: Record<string, SelectedAttribute>;
    craneUnload?: boolean | null;
    comment?: string;
    unitPrice: number;
    quantity: number;
    quantities?: number[];
  };
  onIncrease: (cartItemId: string, packageSize: number) => void;
  onDecrease: (cartItemId: string, packageSize: number) => void;
  onRemove: (cartItemId: string) => void;
}

export default function CartItem({ item, onIncrease, onDecrease, onRemove }: CartItemProps) {
  const unitPrice = item.unitPrice || 0;
  const totalQuantity = item.quantity || 1;

  const handleIncreaseByPackage = (packageSize: number) => {
    onIncrease(item.cartItemId, packageSize);
  };

  const handleDecreaseByPackage = (packageSize: number) => {
    onDecrease(item.cartItemId, packageSize);
  };

  return (
    <div className="relative flex flex-col md:flex-row items-center justify-between bg-white shadow-lg rounded-lg p-4 mb-4 transition hover:shadow-xl">
      <button
        className="absolute top-4 left-4 text-gray-500 hover:text-primary text-3xl cursor-pointer transition"
        onClick={() => onRemove(item.cartItemId)}
        aria-label="הסר מהעגלה"
      >
        ×
      </button>

      <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
        <Image
          src={item.image || '/placeholder-product.png'}
          alt={`${item.שם || item.baseName} - עגלת קניות | לבן גרופ`}
          title={item.שם || item.baseName}
          fill
          className="object-cover rounded-lg border-2 border-gray-200"
          sizes="(max-width: 768px) 96px, 128px"
        />
      </div>

      <div className="flex-1 text-right px-4">
        <h4 className="text-lg font-bold text-gray-800">{item.baseName || item.שם}</h4>
        {item.sku && <p className="text-gray-600 text-sm">מק"ט: {item.sku}</p>}

        {/* Display selected attributes with prices */}
        {item.selectedAttributesWithPrices && typeof item.selectedAttributesWithPrices === 'object' && (
          <div className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
            {Object.entries(item.selectedAttributesWithPrices).map(([key, attr]) => (
              attr?.value ? (
                <p key={key}>
                  <strong>{key}:</strong> {attr.value}
                  {attr.price > 0 && (
                    <span className="text-xs text-gray-500"> (₪{attr.price.toFixed(2)})</span>
                  )}
                </p>
              ) : null
            ))}
          </div>
        )}

        {item.craneUnload !== null && item.craneUnload !== undefined && (
          <p className="text-sm text-gray-700 mt-2">
            <strong>פריקת מנוף:</strong> {item.craneUnload ? "כן" : "לא"}
          </p>
        )}

        {item.comment && (
          <p className="text-sm text-gray-700 bg-gray-100 p-2 rounded-md mt-2">
            <strong>הערה:</strong> {item.comment}
          </p>
        )}

        <p className="text-gray-800 font-semibold mt-2">מחיר ליחידה: ₪{unitPrice.toFixed(2)}</p>
        <p className="text-gray-700 font-medium">סה"כ כמות: {totalQuantity}</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        {item.quantities && item.quantities.length > 0 ? (
          item.quantities.map((packageSize) => (
            <div key={packageSize} className="flex flex-col items-center bg-blue-100 px-4 py-2 rounded-md shadow-md">
              <p className="text-sm font-medium">חבילה של {packageSize} יח'</p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  className="w-8 h-8 bg-gray-200 text-lg font-bold rounded-full hover:bg-blue-400 hover:text-white transition"
                  onClick={() => handleIncreaseByPackage(packageSize)}
                  aria-label={`הוסף ${packageSize} יחידות`}
                >
                  +
                </button>
                <span className="text-lg font-bold">{packageSize}</span>
                <button
                  className="w-8 h-8 bg-gray-200 text-lg font-bold rounded-full hover:bg-red-400 hover:text-white transition"
                  onClick={() => handleDecreaseByPackage(packageSize)}
                  aria-label={`הסר ${packageSize} יחידות`}
                >
                  -
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center gap-3 bg-gray-200 px-4 py-2 rounded-md">
            <button
              className="w-8 h-8 bg-gray-300 text-lg font-bold rounded-full hover:bg-red-500 hover:text-white transition"
              onClick={() => handleDecreaseByPackage(1)}
              aria-label="הסר יחידה אחת"
            >
              -
            </button>
            <input
              type="number"
              value={totalQuantity}
              readOnly
              className="w-10 text-center bg-transparent font-semibold"
              aria-label="כמות"
            />
            <button
              className="w-8 h-8 bg-gray-300 text-lg font-bold rounded-full hover:bg-blue-500 hover:text-white transition"
              onClick={() => handleIncreaseByPackage(1)}
              aria-label="הוסף יחידה אחת"
            >
              +
            </button>
          </div>
        )}
      </div>

      <p className="text-xl font-semibold text-gray-900 mt-2 md:mt-0 m-2">
        סה"כ מחיר: ₪{(unitPrice * totalQuantity).toFixed(2)}
      </p>
    </div>
  );
}
