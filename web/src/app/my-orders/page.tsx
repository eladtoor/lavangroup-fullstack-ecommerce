'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Breadcrumbs from '@/components/Breadcrumbs';

interface OrderItem {
  name: string;
  baseName?: string;
  quantity: number;
  unitPrice: number;
  price: number;
  comment?: string;
  selectedAttributes?: Record<string, any>;
}

interface Order {
  id: string;
  purchaseId: string;
  date: string;
  status: string;
  totalPrice: number;
  shippingCost?: number;
  craneUnloadCost?: number;
  cartItems: OrderItem[];
  shippingAddress?: {
    city: string;
    street: string;
    apartment: string;
    floor: string;
    entrance: string;
  };
  paymentMethod?: string;
  isCreditLine?: boolean;
  payments?: number;
}

export default function MyOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchOrders = async () => {
      try {
        const purchasesRef = collection(db, 'users', currentUser.uid, 'purchases');
        const q = query(purchasesRef, orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);

        const fetchedOrders: Order[] = [];
        querySnapshot.forEach((doc) => {
          fetchedOrders.push({
            id: doc.id,
            ...doc.data(),
          } as Order);
        });

        setOrders(fetchedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentUser]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      pending: { label: 'ממתין', color: 'bg-yellow-500' },
      completed: { label: 'הושלם', color: 'bg-green-500' },
      processing: { label: 'בטיפול', color: 'bg-blue-500' },
      cancelled: { label: 'בוטל', color: 'bg-red-500' },
    };

    const config = statusConfig[status] || { label: status, color: 'bg-gray-500' };

    return (
      <span className={`${config.color} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
        {config.label}
      </span>
    );
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const breadcrumbItems = [
    { label: 'דף הבית', href: '/' },
    { label: 'ההזמנות שלי' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-2xl text-gray-700">טוען הזמנות...</p>
      </div>
    );
  }

  return (
      <div className="min-h-screen container mx-auto px-4 py-8 pt-32 md:pt-36" dir="rtl">
      <Breadcrumbs items={breadcrumbItems} />
      <h1 className="text-4xl font-bold mb-8 text-center">ההזמנות שלי</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 mb-4">עדיין לא ביצעת הזמנות</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            התחל לקנות
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-300 rounded-lg shadow-md overflow-hidden"
            >
              {/* Order Header */}
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => toggleOrderDetails(order.id)}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-gray-800">
                        הזמנה #{order.purchaseId?.substring(0, 8)}
                      </h2>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-gray-600">
                      <i className="far fa-calendar-alt ml-2"></i>
                      {formatDate(order.date)}
                    </p>
                    {order.paymentMethod && (
                      <p className="text-gray-600 text-sm mt-1">
                        אמצעי תשלום: {order.isCreditLine ? 'מסגרת אשראי' : 'תשלום מקוון'}
                        {order.payments && order.payments > 1 && ` (${order.payments} תשלומים)`}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-left">
                      <p className="text-sm text-gray-600">סה"כ</p>
                      <p className="text-2xl font-bold text-red-600">
                        ₪{(order.totalPrice || 0).toFixed(2)}
                      </p>
                    </div>
                    <i
                      className={`fas fa-chevron-down text-gray-400 transition-transform duration-300 ${
                        expandedOrderId === order.id ? 'rotate-180' : ''
                      }`}
                    ></i>
                  </div>
                </div>
              </div>

              {/* Order Details (Expandable) */}
              {expandedOrderId === order.id && (
                <div className="border-t border-gray-200 bg-gray-50 p-6">
                  {/* Products List */}
                  <h3 className="text-lg font-bold mb-4">פרטי מוצרים:</h3>
                  <div className="space-y-3 mb-6">
                    {(order.cartItems || []).map((item, index) => (
                      <div
                        key={index}
                        className="bg-white p-4 rounded-lg border border-gray-200"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">
                              {item.baseName || item.name}
                            </p>
                            {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                              <p className="text-sm text-gray-500 mt-1">
                                {Object.entries(item.selectedAttributes)
                                  .map(([key, value]: [string, any]) => `${key}: ${value.value}`)
                                  .join(' | ')}
                              </p>
                            )}
                            {item.comment && (
                              <p className="text-sm text-gray-600 italic mt-1">
                                הערה: {item.comment}
                              </p>
                            )}
                          </div>
                          <div className="text-left">
                            <p className="text-gray-600">
                              {item.quantity || 0} x ₪{(item.unitPrice || item.price || 0).toFixed(2)}
                            </p>
                            <p className="font-bold text-gray-800">
                              ₪{((item.unitPrice || item.price || 0) * (item.quantity || 0)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Address */}
                  {order.shippingAddress && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold mb-3">כתובת למשלוח:</h3>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-gray-700">
                          {order.shippingAddress.city}, {order.shippingAddress.street}
                        </p>
                        <p className="text-gray-600 text-sm">
                          דירה: {order.shippingAddress.apartment}, קומה: {order.shippingAddress.floor}
                          {order.shippingAddress.entrance && `, כניסה: ${order.shippingAddress.entrance}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Price Breakdown */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold mb-3">פירוט מחיר:</h3>
                    <div className="space-y-2">
                      {order.shippingCost !== undefined && order.shippingCost > 0 && (
                        <div className="flex justify-between text-gray-700">
                          <span>משלוח:</span>
                          <span>₪{(order.shippingCost || 0).toFixed(2)}</span>
                        </div>
                      )}
                      {order.craneUnloadCost !== undefined && order.craneUnloadCost > 0 && (
                        <div className="flex justify-between text-gray-700">
                          <span>פריקת מנוף:</span>
                          <span>₪{(order.craneUnloadCost || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-700 pt-2 border-t">
                        <span>סה"כ ללא מע"מ:</span>
                        <span>₪{((order.totalPrice || 0) / 1.18).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>מע"מ (18%):</span>
                        <span>₪{((order.totalPrice || 0) - (order.totalPrice || 0) / 1.18).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold text-red-600 pt-2 border-t-2">
                        <span>סה"כ לתשלום:</span>
                        <span>₪{(order.totalPrice || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
