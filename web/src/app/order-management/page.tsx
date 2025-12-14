'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collectionGroup, query, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppSelector } from '@/lib/redux/hooks';
import RoleProtectedRoute from '@/components/RoleProtectedRoute';
import Breadcrumbs from '@/components/Breadcrumbs';

interface OrderItem {
  name: string;
  baseName?: string;
  quantity: number;
  unitPrice: number;
  price: number;
  comment?: string;
}

interface Order {
  id: string;
  userId: string;
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
  customerEmail?: string;
  customerName?: string;
  payments?: number;
}

export default function OrderManagement() {
  return (
    <RoleProtectedRoute allowedRoles={['admin']}>
      <OrderManagementContent />
    </RoleProtectedRoute>
  );
}

function OrderManagementContent() {
  const router = useRouter();
  const user = useAppSelector((state) => state.user?.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'creditLine' | 'online'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchAllOrders();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [statusFilter, paymentFilter, orders]);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);

      // Fetch all purchases from all users using collectionGroup (without orderBy to avoid index requirement)
      const purchasesQuery = query(collectionGroup(db, 'purchases'));

      const querySnapshot = await getDocs(purchasesQuery);

      const fetchedOrders: Order[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const orderData = docSnapshot.data();
        const orderRef = docSnapshot.ref;
        const userId = orderRef.parent.parent?.id || '';

        // Debug logging (dev only)
        if (process.env.NODE_ENV !== 'production') {
          console.log('📊 Order Management - Raw order data from Firestore:', {
            orderId: docSnapshot.id,
            userId,
            cartItemsCount: orderData.cartItems?.length || 0,
            firstCartItem: orderData.cartItems?.[0] || null,
            totalPrice: orderData.totalPrice,
            isCreditLine: orderData.isCreditLine,
            paymentMethod: orderData.paymentMethod,
          });
        }

        // Fetch user data to get email and name
        let customerEmail = '';
        let customerName = '';

        if (userId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();

              // Debug logging (dev only)
              if (process.env.NODE_ENV !== 'production') {
                console.log('User data fields for userId:', userId, Object.keys(userData));
              }

              customerEmail = userData.email || userData.Email || '';
              // Try multiple possible name fields
              customerName = userData.fullName ||
                           userData.companyName ||
                           userData.FullName ||
                           userData.CompanyName ||
                           userData.name ||
                           userData.displayName ||
                           (customerEmail ? customerEmail.split('@')[0] : '') || // Use email username as fallback
                           'משתמש';
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        }

        fetchedOrders.push({
          id: docSnapshot.id,
          userId,
          customerEmail,
          customerName,
          ...orderData,
        } as Order);
      }

      // Sort orders by date on the client side (newest first)
      fetchedOrders.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Descending order (newest first)
      });

      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error fetching all orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = orders;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply payment method filter
    if (paymentFilter !== 'all') {
      if (paymentFilter === 'creditLine') {
        filtered = filtered.filter(order => order.isCreditLine === true);
      } else if (paymentFilter === 'online') {
        // Treat anything that is NOT explicitly credit-line as "online"
        filtered = filtered.filter(order => order.isCreditLine !== true);
      }
    }

    setFilteredOrders(filtered);
  };

  const handleUpdateStatus = async (order: Order, newStatus: string) => {
    if (!order.userId || !order.id) {
      alert('לא ניתן לעדכן הזמנה זו');
      return;
    }

    try {
      setUpdatingOrderId(order.id);

      const orderRef = doc(db, 'users', order.userId, 'purchases', order.id);
      await updateDoc(orderRef, {
        status: newStatus
      });

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === order.id ? { ...o, status: newStatus } : o
        )
      );

      // Get status label in Hebrew
      const statusLabels: Record<string, string> = {
        pending: 'ממתין',
        processing: 'בטיפול',
        shipped: 'נשלח',
        completed: 'הושלם',
        cancelled: 'בוטל'
      };

      alert(`סטטוס ההזמנה עודכן ל: ${statusLabels[newStatus] || newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('שגיאה בעדכון סטטוס ההזמנה');
    } finally {
      setUpdatingOrderId(null);
    }
  };

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
      processing: { label: 'בטיפול', color: 'bg-blue-500' },
      shipped: { label: 'נשלח', color: 'bg-purple-500' },
      completed: { label: 'הושלם', color: 'bg-green-500' },
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

  const getOrderCounts = () => {
    return {
      all: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      creditLine: orders.filter(o => o.isCreditLine === true).length,
      online: orders.filter(o => o.isCreditLine !== true).length,
    };
  };

  const counts = getOrderCounts();

  const breadcrumbItems = [
    { label: 'דף הבית', href: '/' },
    { label: 'ניהול הזמנות' }
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
      <h1 className="text-4xl font-bold mb-8 text-center">ניהול הזמנות</h1>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-md border-t-4 border-blue-500">
          <p className="text-gray-600 text-sm">סה"כ הזמנות</p>
          <p className="text-3xl font-bold text-gray-800">{counts.all}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-t-4 border-yellow-500">
          <p className="text-gray-600 text-sm">ממתינות</p>
          <p className="text-3xl font-bold text-yellow-600">{counts.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-t-4 border-purple-500">
          <p className="text-gray-600 text-sm">נשלחו</p>
          <p className="text-3xl font-bold text-purple-600">{counts.shipped}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-t-4 border-green-500">
          <p className="text-gray-600 text-sm">הושלמו</p>
          <p className="text-3xl font-bold text-green-600">{counts.completed}</p>
        </div>
      </div>

      {/* Payment Method Filter */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-3">סינון לפי סוג תשלום:</h3>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setPaymentFilter('all')}
            className={`px-5 py-2 rounded-lg font-semibold transition ${
              paymentFilter === 'all'
                ? 'bg-gray-700 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            הכל ({counts.all})
          </button>
          <button
            onClick={() => setPaymentFilter('creditLine')}
            className={`px-5 py-2 rounded-lg font-semibold transition ${
              paymentFilter === 'creditLine'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            מסגרת אשראי ({counts.creditLine})
          </button>
          <button
            onClick={() => setPaymentFilter('online')}
            className={`px-5 py-2 rounded-lg font-semibold transition ${
              paymentFilter === 'online'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            תשלום מקוון ({counts.online})
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">סינון לפי סטטוס:</h3>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-5 py-2 rounded-lg font-semibold transition ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            הכל ({counts.all})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-5 py-2 rounded-lg font-semibold transition ${
              statusFilter === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ממתין ({counts.pending})
          </button>
          <button
            onClick={() => setStatusFilter('processing')}
            className={`px-5 py-2 rounded-lg font-semibold transition ${
              statusFilter === 'processing'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            בטיפול ({counts.processing})
          </button>
          <button
            onClick={() => setStatusFilter('shipped')}
            className={`px-5 py-2 rounded-lg font-semibold transition ${
              statusFilter === 'shipped'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            נשלח ({counts.shipped})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-5 py-2 rounded-lg font-semibold transition ${
              statusFilter === 'completed'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            הושלם ({counts.completed})
          </button>
          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`px-5 py-2 rounded-lg font-semibold transition ${
              statusFilter === 'cancelled'
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            בוטל ({counts.cancelled})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-xl text-gray-600">אין הזמנות להצגה</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-300 rounded-lg shadow-md overflow-hidden"
            >
              {/* Order Header */}
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-gray-800">
                        הזמנה #{order.purchaseId?.substring(0, 8)}
                      </h2>
                      {getStatusBadge(order.status)}
                    </div>

                    {/* Customer Info */}
                    <div className="text-gray-700 mb-2">
                      <p className="font-semibold">
                        <i className="fas fa-user ml-2"></i>
                        {order.customerName || 'לא זמין'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <i className="fas fa-envelope ml-2"></i>
                        {order.customerEmail || 'לא זמין'}
                      </p>
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

                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="text-sm text-gray-600">סה"כ</p>
                      <p className="text-2xl font-bold text-red-600">
                        ₪{(order.totalPrice || 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      {/* Status Dropdown */}
                      <div className="flex flex-col">
                        <label className="text-sm text-gray-600 mb-1">שנה סטטוס:</label>
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order, e.target.value)}
                          disabled={updatingOrderId === order.id}
                          className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition disabled:bg-gray-200 disabled:cursor-not-allowed whitespace-nowrap text-right"
                        >
                          <option value="pending">ממתין</option>
                          <option value="processing">בטיפול</option>
                          <option value="shipped">נשלח</option>
                          <option value="completed">הושלם</option>
                          <option value="cancelled">בוטל</option>
                        </select>
                        {updatingOrderId === order.id && (
                          <span className="text-sm text-blue-600 mt-1">מעדכן...</span>
                        )}
                      </div>

                      <button
                        onClick={() => toggleOrderDetails(order.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                      >
                        <i className={`fas fa-chevron-${expandedOrderId === order.id ? 'up' : 'down'} ml-2`}></i>
                        {expandedOrderId === order.id ? 'הסתר פרטים' : 'הצג פרטים'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Details (Expandable) */}
              {expandedOrderId === order.id && (
                <div className="border-t border-gray-200 bg-gray-50 p-6">
                  {/* Products List */}
                  <h3 className="text-lg font-bold mb-4">פרטי מוצרים:</h3>
                  <div className="space-y-3 mb-6">
                    {(order.cartItems || []).map((item, index) => {
                      // Debug logging (dev only)
                      if (process.env.NODE_ENV !== 'production') {
                        console.log(`📦 Rendering cart item ${index} for order ${order.id}:`, {
                          name: item.name,
                          baseName: item.baseName,
                          quantity: item.quantity,
                          unitPrice: item.unitPrice,
                          price: item.price,
                          calculatedTotal: (item.unitPrice || item.price || 0) * (item.quantity || 0),
                        });
                      }

                      return (
                        <div
                          key={index}
                          className="bg-white p-4 rounded-lg border border-gray-200"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">
                                {item.baseName || item.name}
                              </p>
                              {item.comment && (
                                <p className="text-sm text-gray-600 italic mt-1 bg-yellow-50 p-2 rounded">
                                  💬 הערת לקוח: {item.comment}
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
                      );
                    })}
                  </div>

                  {/* Shipping Address */}
                  {order.shippingAddress && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold mb-3">כתובת למשלוח:</h3>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-gray-700 font-semibold">
                          <i className="fas fa-map-marker-alt ml-2"></i>
                          {order.shippingAddress.city}, {order.shippingAddress.street}
                        </p>
                        <p className="text-gray-600 text-sm mt-1">
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
