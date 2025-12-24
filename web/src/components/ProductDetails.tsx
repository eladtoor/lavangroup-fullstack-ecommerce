'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { auth } from '@/lib/firebase';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { addToCart } from '@/lib/redux/slices/cartSlice';
import { saveCartToFirestore } from '@/utils/cartUtils';
import { cleanDescription } from '@/lib/utils/textUtils';

type ProductVariation = {
  attributes: Record<string, { value: string; price: number }>;
};

export type Product = {
  _id: string;
  שם: string;
  'תיאור קצר'?: string;
  תיאור?: string;
  תמונות?: string;
  'מחיר רגיל': number;
  'מק"ט'?: string;
  סוג: 'simple' | 'variable';
  variations?: ProductVariation[];
  quantities?: number[];
  materialGroup?: 'Colors and Accessories' | 'Powders' | 'Gypsum and Tracks';
  allowComments?: boolean;
  [key: string]: any;
};

const materialGroupTranslations = {
  'Colors and Accessories': 'צבעים ומוצרים נלווים',
  Powders: 'אבקות (דבקים וטייח)',
  'Gypsum and Tracks': 'גבס ומסלולים',
} as const;

function isProbablyUrl(value?: string) {
  if (!value) return false;
  return /^https?:\/\//i.test(value);
}

export default function ProductDetails({
  product,
  mode,
  priority = false,
  onClose,
}: {
  product: Product;
  mode: 'modal' | 'page';
  priority?: boolean;
  onClose?: () => void;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((state) => state.user?.user);
  const cartItems = useAppSelector((state) => state.cart?.cartItems || []);

  const isDigitalCatalog = isProbablyUrl(product['תיאור']);

  const productMaterialGroup = useMemo(() => {
    if (!product.materialGroup) return null;
    return materialGroupTranslations[product.materialGroup] || product.materialGroup;
  }, [product.materialGroup]);

  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(
    product.quantities && product.quantities.length > 0 ? null : 1
  );
  const [updatedPrice, setUpdatedPrice] = useState(product['מחיר רגיל'] || 0);
  const [totalPrice, setTotalPrice] = useState(product['מחיר רגיל'] || 0);
  const [originalPrice, setOriginalPrice] = useState(product['מחיר רגיל'] || 0);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [disableAddToCart, setDisableAddToCart] = useState(
    Boolean(product.quantities && product.quantities.length > 0)
  );
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [craneUnload, setCraneUnload] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');

  // Save cart to Firestore whenever it changes
  useEffect(() => {
    if (cartItems.length > 0) {
      saveCartToFirestore(cartItems);
    }
  }, [cartItems]);

  const calculateTotalPrice = (attrs: Record<string, string>, quantity: number | null) => {
    const effectiveQuantity = quantity || 1;
    let updatedPriceTemp = product['מחיר רגיל'] || 0;

    const discountInfo = user?.productDiscounts?.find(
      (d: any) => d.productId === product._id
    );
    const discount = discountInfo ? parseFloat(discountInfo.discount) : 0;
    setDiscountPercentage(discount);
    setHasDiscount(discount > 0);

    if (product.variations && product.variations.length > 0) {
      for (const variation of product.variations) {
        const attributes = variation.attributes;
        let match = true;

        for (const [key, selectedValue] of Object.entries(attrs)) {
          if (!attributes || !attributes[key] || attributes[key].value !== selectedValue) {
            match = false;
            break;
          }
        }

        if (match) {
          for (const attribute of Object.values(attributes || {})) {
            if (attribute && attribute.price) {
              updatedPriceTemp += Number(attribute.price);
            }
          }
          break;
        }
      }
    }

    const finalPrice = updatedPriceTemp - (updatedPriceTemp * discount) / 100;
    setOriginalPrice(updatedPriceTemp);
    setUpdatedPrice(finalPrice);
    setTotalPrice(finalPrice * effectiveQuantity);
  };

  // Init defaults for variable products
  useEffect(() => {
    if (product && Array.isArray(product.variations) && product.variations.length > 0) {
      const attributeOptions: Record<string, Set<string>> = {};
      const defaultAttributes: Record<string, string> = {};

      product.variations.forEach((variation) => {
        const attributes = variation.attributes;
        if (attributes && typeof attributes === 'object') {
          for (const [key, { value }] of Object.entries(attributes)) {
            if (!attributeOptions[key]) {
              attributeOptions[key] = new Set();
            }
            attributeOptions[key].add(value);
          }
        }
      });

      Object.entries(attributeOptions).forEach(([attributeName, values]) => {
        defaultAttributes[attributeName] = [...values][0];
      });

      setSelectedAttributes(defaultAttributes);
      calculateTotalPrice(defaultAttributes, selectedQuantity);
    } else {
      calculateTotalPrice({}, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const renderVariationAttributes = () => {
    if (!product.variations || product.variations.length === 0) return null;

    const attributeOptions: Record<string, Set<string>> = {};

    product.variations.forEach((variation) => {
      const attributes = variation.attributes;
      if (attributes && typeof attributes === 'object') {
        for (const [key, { value }] of Object.entries(attributes)) {
          if (!attributeOptions[key]) {
            attributeOptions[key] = new Set();
          }
          attributeOptions[key].add(value);
        }
      }
    });

    return Object.entries(attributeOptions).map(([attributeName, values]) => (
      <div key={attributeName} className="mt-4 w-full">
        <h3 className="font-semibold text-gray-800 mb-2 w-full">{attributeName}:</h3>
        <div className="flex gap-3 flex-wrap w-full">
          {[...values].map((value) => (
            <label
              key={value}
              className={`px-4 py-2 border rounded-md cursor-pointer transition-all duration-300 ${
                selectedAttributes[attributeName] === value
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <input
                type="radio"
                name={attributeName}
                value={value}
                checked={selectedAttributes[attributeName] === value}
                onChange={() => {
                  setSelectedAttributes((prev) => {
                    const next = { ...prev, [attributeName]: value };
                    calculateTotalPrice(next, selectedQuantity);
                    return next;
                  });
                }}
                className="hidden"
              />
              {value}
            </label>
          ))}
        </div>
      </div>
    ));
  };

  const handleQuantityChange = (quantity: number) => {
    setSelectedQuantity(quantity);
    setDisableAddToCart(false);
    calculateTotalPrice(selectedAttributes, quantity);
  };

  const handleClose = () => {
    if (onClose) return onClose();
    router.back();
  };

  const handleAddToCart = () => {
    if (!auth.currentUser) {
      toast.error('יש להתחבר כדי להוסיף מוצרים לעגלה');
      return;
    }

    if (product.quantities && product.quantities.length > 0 && !selectedQuantity) {
      toast.error('אנא בחר כמות לפני הוספה לעגלה.');
      return;
    }

    if (product.materialGroup === 'Gypsum and Tracks' && craneUnload === null) {
      toast.error('אנא בחר האם דרושה פריקת מנוף.');
      return;
    }

    const hasComment = Boolean(product.allowComments && comment.trim() !== '');
    let uniqueId = product._id;

    if (product.variations && Object.keys(selectedAttributes).length > 0) {
      const attributesString = Object.entries(selectedAttributes)
        .map(([key, value]) => `${key}:${value}`)
        .join('|');
      uniqueId += `|${attributesString}`;
    }

    if (hasComment) {
      uniqueId += `|comment:${comment}`;
    }

    const selectedAttributeString = Object.entries(selectedAttributes)
      .map(([, value]) => value)
      .join(' - ');

    const fullProductName = selectedAttributeString
      ? `${product.שם} - ${selectedAttributeString}`
      : product.שם;

    const enrichedSelectedAttributes: Record<string, { value: string; price: number }> = {};

    if (product.variations && Array.isArray(product.variations)) {
      for (const variation of product.variations) {
        const match = Object.entries(selectedAttributes).every(([key, value]) => {
          return variation.attributes?.[key]?.value === value;
        });

        if (match) {
          Object.entries(selectedAttributes).forEach(([key, value]) => {
            const price = parseFloat(String(variation.attributes?.[key]?.price || 0));
            enrichedSelectedAttributes[key] = { value, price };
          });
          break;
        }
      }
    } else {
      Object.entries(selectedAttributes).forEach(([key, value]) => {
        enrichedSelectedAttributes[key] = { value, price: 0 };
      });
    }

    const cleanCartItem = {
      _id: product._id,
      productId: product._id,
      sku: product['מק"ט'] || '',
      name: fullProductName,
      baseName: product.שם,
      cartItemId: uniqueId,
      quantity: selectedQuantity || 1,
      price: totalPrice,
      unitPrice: updatedPrice,
      packageSize: selectedQuantity || 1,
      selectedAttributes: enrichedSelectedAttributes,
      comment: hasComment ? comment : '',
      image: product.תמונות || '',
      craneUnload: product.materialGroup === 'Gypsum and Tracks' ? craneUnload : null,
      quantities: product.quantities || [],
      materialGroup: product.materialGroup || '',
    };

    dispatch(addToCart(cleanCartItem));
    setComment('');
    toast.success('המוצר נוסף לעגלה בהצלחה');

    if (mode === 'modal') {
      handleClose();
    }
  };

  const content = (
    <div className={mode === 'modal' ? 'bg-white w-11/12 max-w-md p-4 sm:p-6 rounded-lg shadow-lg relative max-h-[80vh] sm:max-h-[90vh] overflow-y-auto z-[1100]' : ''}>
      {mode === 'modal' && (
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-xl"
          onClick={handleClose}
          aria-label="סגור חלון מוצר"
          title="סגור"
        >
          &times;
        </button>
      )}

      <h1 className={mode === 'modal' ? 'text-xl sm:text-2xl font-bold text-gray-800 text-center' : 'text-2xl md:text-3xl font-bold text-gray-900 mb-3'}>
        {product.שם}
      </h1>

      {product.תמונות && (
        <div className={mode === 'modal' ? 'relative w-28 h-28 sm:w-32 sm:h-32 mx-auto mt-4' : 'relative w-full h-72 md:h-96 bg-gray-50 rounded-lg overflow-hidden mb-4'}>
          <Image
            src={
              product.תמונות && typeof product.תמונות === 'string' && product.תמונות.includes('cloudinary.com') && product.תמונות.includes('/upload/')
                ? mode === 'modal'
                  ? product.תמונות.replace(/\/upload\/([^\/]*\/)?/, '/upload/f_auto,q_auto:good,w_128,h_128,c_limit/')
                  : product.תמונות.replace(/\/upload\/([^\/]*\/)?/, '/upload/f_auto,q_auto:best,w_800,c_limit/')
                : product.תמונות
            }
            alt={`${product.שם}${product['תיאור קצר'] ? ' - ' + product['תיאור קצר'].slice(0, 100) : ''} | לבן גרופ`}
            title={product.שם}
            fill
            priority={priority}
            className={mode === 'modal' ? 'object-contain rounded-none sm:rounded-full' : 'object-contain p-6'}
            sizes={mode === 'modal' ? '(max-width: 640px) 112px, 128px' : '(max-width: 768px) 100vw, 800px'}
          />
        </div>
      )}

      {productMaterialGroup && (
        <div className={mode === 'modal' ? 'mt-3 text-center' : 'mb-4'}>
          <span className="inline-flex items-center rounded-full bg-gray-900 text-white px-3 py-1 text-sm">
            {productMaterialGroup}
          </span>
        </div>
      )}

      {isDigitalCatalog ? (
        <p className="text-center text-blue-600 mt-2">
          <a
            href={product['תיאור']}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            title={`פתח קטלוג: ${product.שם}`}
          >
            לחץ כאן לצפייה בקטלוג
          </a>
        </p>
      ) : (
        <p className={mode === 'modal' ? 'text-center text-gray-600 mt-2' : 'text-gray-700 mb-4'}>
          {cleanDescription(product['תיאור'] || product['תיאור קצר'], mode === 'modal' ? 200 : 500)}
        </p>
      )}

      {!isDigitalCatalog && (
        <>
          {/* Price */}
          <div className={mode === 'modal' ? 'mt-3 sm:mt-4 text-center' : 'mb-4'}>
            {hasDiscount ? (
              <>
                <p className="text-gray-500 line-through">
                  ₪{(originalPrice * (selectedQuantity || 1)).toFixed(2)}{' '}
                  {selectedQuantity ? (
                    <span className="text-sm text-gray-600">עבור {selectedQuantity} יחידות</span>
                  ) : (
                    <span className="text-sm text-gray-600">ליחידה</span>
                  )}
                </p>
                <p className="text-2xl font-bold text-red-500">
                  ₪{totalPrice.toFixed(2)}{' '}
                  {selectedQuantity ? (
                    <span className="text-sm text-gray-600">עבור {selectedQuantity} יחידות</span>
                  ) : (
                    <span className="text-sm text-gray-600">ליחידה</span>
                  )}
                </p>
                <div className="text-sm text-red-600 font-semibold mt-1">{discountPercentage}% הנחה</div>
              </>
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                ₪{totalPrice.toFixed(2)}{' '}
                {selectedQuantity ? (
                  <span className="text-sm text-gray-600">עבור {selectedQuantity} יחידות</span>
                ) : (
                  <span className="text-sm text-gray-600">ליחידה</span>
                )}
              </p>
            )}
          </div>

          {/* Attributes */}
          {product.סוג === 'variable' && (
            <div className={mode === 'modal' ? 'mt-3 sm:mt-4' : 'mb-4'}>
              <h3 className="font-semibold text-gray-800 text-center mb-2">בחר מאפיין:</h3>
              <div className="flex flex-wrap justify-center gap-3">{renderVariationAttributes()}</div>
            </div>
          )}

          {/* Quantity */}
          {product.quantities && product.quantities.length > 0 && (
            <div className={mode === 'modal' ? 'mt-3 sm:mt-4 text-center' : 'mb-4'}>
              <h3 className="font-semibold text-gray-800">בחר כמות:</h3>
              <div className="flex gap-2 mt-2 flex-wrap justify-center">
                {product.quantities.map((quantity) => (
                  <label
                    key={quantity}
                    className={`px-4 py-2 border rounded-md cursor-pointer transition ${
                      selectedQuantity === quantity ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="quantity"
                      value={quantity}
                      checked={selectedQuantity === quantity}
                      onChange={() => handleQuantityChange(quantity)}
                      className="hidden"
                    />
                    {quantity}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Crane Unload */}
          {product.materialGroup === 'Gypsum and Tracks' && (
            <div className={mode === 'modal' ? 'mt-3 sm:mt-4 text-center' : 'mb-4'}>
              <h3 className="font-semibold text-gray-800">פריקת מנוף:</h3>
              <div className="flex gap-2 mt-2 justify-center">
                <label
                  className={`px-4 py-2 border rounded-md cursor-pointer transition ${
                    craneUnload === true ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="craneUnload"
                    checked={craneUnload === true}
                    onChange={() => setCraneUnload(true)}
                    className="hidden"
                  />
                  כן
                </label>
                <label
                  className={`px-4 py-2 border rounded-md cursor-pointer transition ${
                    craneUnload === false ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="craneUnload"
                    checked={craneUnload === false}
                    onChange={() => setCraneUnload(false)}
                    className="hidden"
                  />
                  לא
                </label>
              </div>
            </div>
          )}

          {/* Comment */}
          {product.allowComments && (
            <div className={mode === 'modal' ? 'mt-3 sm:mt-4' : 'mb-4'}>
              <h3 className="font-semibold text-gray-800 text-center mb-2">הערה להזמנה (אופציונלי):</h3>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 text-gray-800"
                placeholder="כתוב הערה..."
                rows={3}
              />
            </div>
          )}

          {/* Actions */}
          <div className={mode === 'modal' ? 'mt-4' : 'mt-6'}>
            <button
              onClick={handleAddToCart}
              disabled={disableAddToCart}
              className={`w-full py-3 rounded-md font-bold transition ${
                disableAddToCart ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              title="הוסף לעגלה"
            >
              הוסף לעגלה
            </button>
          </div>
        </>
      )}
    </div>
  );

  if (mode === 'page') {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 md:p-8">
        {content}
      </div>
    );
  }

  // modal
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 sm:bg-opacity-50 flex items-center justify-center z-[1000] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {content}
    </div>
  );
}


