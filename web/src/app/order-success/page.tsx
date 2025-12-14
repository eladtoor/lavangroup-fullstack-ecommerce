'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useAppDispatch } from '@/lib/redux/hooks';
import { setCartItems } from '@/lib/redux/slices/cartSlice';
import { saveCartToFirestore } from '@/utils/cartUtils';
import Breadcrumbs from '@/components/Breadcrumbs';
interface SaleDetails {
  TransactionStatus: number;
  CustomerFirstName: string;
  CustomerLastName: string;
  EmailAddress: string;
  NumOfPayment: number;
  Amount: number;
  DocumentURL?: string;
  Items: Array<{
    ItemCatalog: string;
    Description: string;
    Quantity: number;
    UnitPrice: number;
  }>;
}

export default function OrderSuccess() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [saleDetails, setSaleDetails] = useState<SaleDetails | null>(null);

  const shouldSkipVerification = false;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        if (process.env.NODE_ENV !== 'production') console.warn('⚠️ No user logged in');
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    if (shouldSkipVerification) {
      if (process.env.NODE_ENV !== 'production') console.warn('⚠️ Skipping verification manually (dev mode)');
      setVerificationStatus('success');
      dispatch(setCartItems([]));
      saveCartToFirestore([]);
      return;
    }

    const verifyPayment = async () => {
      const privateToken = localStorage.getItem('SalePrivateToken');

      if (!privateToken) {
        console.error('❌ SalePrivateToken is missing from localStorage.');
        setVerificationStatus('failed');
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payment/sale-details`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ SalePrivateToken: privateToken })
        });

        const data = await response.json();
        setSaleDetails(data);

        if (data.TransactionStatus === 0) {
          setVerificationStatus('success');

          // Get cart data from localStorage
          const cartItemsStr = localStorage.getItem('cartItems');
          const finalTotalPrice = localStorage.getItem('finalTotalPrice');
          const shippingCost = localStorage.getItem('shippingCost');
          const craneUnloadCost = localStorage.getItem('craneUnloadCost');
          const shippingAddressStr = localStorage.getItem('shippingAddress');

          // Debug logging (dev only)
          if (process.env.NODE_ENV !== 'production') {
            console.log('📦 Order Success - LocalStorage data:', {
              cartItemsStr: cartItemsStr ? 'Found' : 'Missing',
              finalTotalPrice,
              shippingCost,
              craneUnloadCost,
              shippingAddressStr: shippingAddressStr ? 'Found' : 'Missing',
            });
          }

          // Parse cart items and ensure proper structure
          let cartItems = [];
          if (cartItemsStr) {
            try {
              const parsedItems = JSON.parse(cartItemsStr);
              if (process.env.NODE_ENV !== 'production') console.log('📦 Parsed cart items:', parsedItems);

              // Map cart items to ensure all required fields are present
              cartItems = parsedItems.map((item: any) => {
                const mappedItem = {
                  _id: item._id || item.productId,
                  sku: item.sku || item['מק"ט'] || '',
                  name: item.name || item.שם || '',
                  baseName: item.baseName || item.name || item.שם || '',
                  quantity: item.quantity || 1,
                  unitPrice: item.unitPrice || item.price || item['מחיר רגיל'] || 0,
                  price: item.price || item.unitPrice || item['מחיר רגיל'] || 0,
                  comment: item.comment || '',
                  selectedAttributes: item.selectedAttributes || {},
                };
                if (process.env.NODE_ENV !== 'production') console.log('📦 Mapped item:', mappedItem);
                return mappedItem;
              });
            } catch (error) {
              console.error('Error parsing cart items:', error);
              cartItems = [];
            }
          }

          if (process.env.NODE_ENV !== 'production') console.log('📦 Final cart items to save:', cartItems);

          const purchaseData = {
            purchaseId: privateToken,
            cartItems: cartItems.length > 0 ? cartItems : (data.Items || []),
            totalPrice: finalTotalPrice ? parseFloat(finalTotalPrice) : (data.Amount || 0),
            shippingCost: shippingCost ? parseFloat(shippingCost) : 0,
            craneUnloadCost: craneUnloadCost ? parseFloat(craneUnloadCost) : 0,
            shippingAddress: shippingAddressStr ? JSON.parse(shippingAddressStr) : {},
            date: new Date().toISOString(),
            status: 'completed',
            isCreditLine: false,
            paymentMethod: 'online',
            customer: {
              firstName: data.CustomerFirstName || '',
              lastName: data.CustomerLastName || '',
              email: data.EmailAddress || currentUser.email
            },
            payments: data.NumOfPayment || 1
          };

          if (process.env.NODE_ENV !== 'production') console.log('💾 Saving purchase data:', purchaseData);

          const purchasesRef = collection(db, 'users', currentUser.uid, 'purchases');
          await addDoc(purchasesRef, purchaseData);

          // Send confirmation emails
          try {
            if (process.env.NODE_ENV !== 'production') {
              console.log('📧 Attempting to send confirmation email for payment to:', currentUser.email);
            }
            const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/email/send-confirmation`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                toEmail: currentUser.email,
                orderData: purchaseData
              })
            });

            if (!emailResponse.ok) {
              const errorData = await emailResponse.json();
              console.error('❌ Email sending failed:', errorData);
            } else {
              if (process.env.NODE_ENV !== 'production') console.log('✅ Confirmation email sent successfully');
            }
          } catch (emailError) {
            console.error('❌ Error sending confirmation email:', emailError);
            // Don't block the order completion if email fails
          }

          // Clean up localStorage
          localStorage.removeItem('cartItems');
          localStorage.removeItem('finalTotalPrice');
          localStorage.removeItem('shippingCost');
          localStorage.removeItem('craneUnloadCost');
          localStorage.removeItem('shippingAddress');

          dispatch(setCartItems([]));
          saveCartToFirestore([]);
        } else {
          console.error('❌ Payment verification failed:', data);
          setVerificationStatus('failed');
        }
      } catch (error) {
        console.error('❌ Error verifying payment with SaleDetails:', error);
        setVerificationStatus('failed');
      }
    };

    verifyPayment();
  }, [dispatch, currentUser]);

  const breadcrumbItems = [
    { label: 'דף הבית', href: '/' },
    { label: 'העגלה שלי', href: '/cart' },
    { label: 'הזמנה בוצעה בהצלחה' }
  ];

  return (
    <>
      <div className="text-center p-6 mt-24">
        <Breadcrumbs items={breadcrumbItems} />
        {verificationStatus === 'pending' && <h1 className="text-2xl font-bold text-gray-700">🔄 מאמת תשלום...</h1>}

        {verificationStatus === 'success' && (
          <>
            <h1 className="text-3xl font-bold text-green-600">✅ התשלום הצליח!</h1>
            <p className="text-lg text-gray-700 mt-4">ההזמנה שלך נשמרה בהצלחה.</p>

            {/* Order Details Display */}
            {saleDetails && (
              <>
                <h2 className="text-xl font-bold mt-6">פרטי ההזמנה:</h2>
                <div className="mt-4 space-y-4 text-right">
                  {/* Order Details Table */}
                  <div className="mt-6 text-right">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-gray-300 p-2">תיאור</th>
                          <th className="border border-gray-300 p-2">כמות</th>
                          <th className="border border-gray-300 p-2">מחיר ליחידה</th>
                          <th className="border border-gray-300 p-2">סה"כ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {saleDetails.Items.filter(item => item.ItemCatalog !== 'SUMMARY_VAT').map((item, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 p-2">{item.Description}</td>
                            <td className="border border-gray-300 p-2 text-center">{item.Quantity}</td>
                            <td className="border border-gray-300 p-2 text-center">₪{item.UnitPrice.toFixed(2)}</td>
                            <td className="border border-gray-300 p-2 text-center">₪{(item.UnitPrice * item.Quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Cost Summary */}
                    <div className="mt-4 text-lg space-y-1 w-full flex flex-col items-center">
                      <div className="w-64 bg-gray-100 p-4 rounded-lg shadow">
                        {/* Total before VAT */}
                        <p>סה"כ ללא מע"מ: ₪{(saleDetails.Amount - (saleDetails.Items.find(item => item.ItemCatalog === 'SUMMARY_VAT')?.UnitPrice || 0)).toFixed(2)}</p>

                        {/* VAT line */}
                        {saleDetails.Items.find(item => item.ItemCatalog === 'SUMMARY_VAT') && (
                          <p>מע"מ (18%): ₪{saleDetails.Items.find(item => item.ItemCatalog === 'SUMMARY_VAT')!.UnitPrice.toFixed(2)}</p>
                        )}

                        {/* Total including VAT */}
                        <p className="font-bold text-red-600">סה"כ לתשלום: ₪{saleDetails.Amount.toFixed(2)}</p>
                      </div>
                      {saleDetails.DocumentURL && (
                        <a
                          href={saleDetails.DocumentURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded-md shadow-md hover:bg-green-700 transition"
                        >
                          הורד חשבונית PDF
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            <button
              onClick={() => router.push('/')}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition"
            >
              חזור לדף הבית
            </button>
          </>
        )}

        {verificationStatus === 'failed' && (
          <>
            <h1 className="text-3xl font-bold text-red-600">❌ התשלום נכשל</h1>
            <p className="text-lg text-gray-700 mt-4">אנא נסה שוב.</p>
            <button
              onClick={() => router.push('/cart')}
              className="mt-6 px-6 py-2 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 transition"
            >
              חזור לעגלה
            </button>
          </>
        )}
      </div>
      </>
  );
}
