'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import CartItem from '@/components/CartItem';
import ConfirmationModal from '@/components/ConfirmationModal';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { increaseQuantity, decreaseQuantity, removeFromCart, setCartItems } from '@/lib/redux/slices/cartSlice';
import { loadCartFromFirestore, saveCartToFirestore } from '@/utils/cartUtils';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';

interface MaterialGroup {
  groupName: string;
  minPrice: number;
  transportationPrice: number;
}

interface Address {
  city: string;
  street: string;
  apartment: string;
  floor: string;
  entrance: string;
}

export default function CartPage() {
  const cartItems = useAppSelector((state) => state.cart?.cartItems || []);
  const user = useAppSelector((state) => state.user?.user);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [materialGroups, setMaterialGroups] = useState<MaterialGroup[]>([]);
  const [transportationCosts, setTransportationCosts] = useState(0);
  const [progressData, setProgressData] = useState<Record<string, any>>({});
  const [cartDiscount, setCartDiscount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [temporaryAddress, setTemporaryAddress] = useState<Address>({
    city: '',
    street: '',
    apartment: '',
    floor: '',
    entrance: ''
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const fullName = user?.name || 'לקוח אנונימי';
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || 'לקוח';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ' ';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setIsAuthenticated(true);

        // Reset the cart when user logs in
        dispatch(setCartItems([]));

        // Load new user's cart
        const cartFromFirestore = await loadCartFromFirestore();
        dispatch(setCartItems(cartFromFirestore));
      } else {
        setIsAuthenticated(false);
        router.push('/login');

        // Clear the cart on logout
        dispatch(setCartItems([]));
      }
    });

    return () => unsubscribe();
  }, [router, dispatch]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUserData = async () => {
      if (!auth.currentUser) return;

      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.address) {
            setTemporaryAddress({
              city: userData.address.city || '',
              street: userData.address.street || '',
              apartment: userData.address.apartment || '',
              floor: userData.address.floor || '',
              entrance: userData.address.entrance || ''
            });
          }
          if (userData.referredBy) {
            const agentRef = doc(db, 'users', userData.referredBy);
            const agentSnap = await getDoc(agentRef);
            if (agentSnap.exists()) {
              const agentData = agentSnap.data();
              setCartDiscount(agentData.cartDiscount || 0);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user data from Firestore:', error);
      }
    };

    const fetchCart = async () => {
      const cartFromFirestore = await loadCartFromFirestore();

      if (cartFromFirestore.length > 0) {
        dispatch(setCartItems(cartFromFirestore));
      }
    };

    const fetchMaterialGroups = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/materialGroups`);
        const data = await response.json();
        setMaterialGroups(data);
      } catch (error) {
        console.error('Error fetching material groups:', error);
      }
    };

    fetchUserData();
    fetchCart();
    fetchMaterialGroups();
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (materialGroups.length > 0) {
      const groupTotals: Record<string, number> = {};
      let totalTransportationCosts = 0;

      materialGroups.forEach((group) => {
        groupTotals[group.groupName] = 0;
      });

      cartItems.forEach((item: any) => {
        if (groupTotals[item.materialGroup] !== undefined) {
          groupTotals[item.materialGroup] += item.unitPrice * item.quantity;
        }
      });

      const progress: Record<string, any> = {};
      materialGroups.forEach((group) => {
        const totalInCart = groupTotals[group.groupName];
        const percentage = Math.min((totalInCart / group.minPrice) * 100, 100);

        if (totalInCart > 0 && percentage < 100) {
          totalTransportationCosts += group.transportationPrice;
        }
        progress[group.groupName] = {
          totalInCart,
          minPrice: group.minPrice,
          percentage,
        };
      });

      setProgressData(progress);
      setTransportationCosts(totalTransportationCosts);
    }
  }, [materialGroups, cartItems]);

  const handleCheckout = async () => {
    if (!isAuthenticated) return;

    const purchaseData = {
      purchaseId: `${Date.now()}`,
      cartItems: cartItems.map((item: any) => ({
        _id: item._id,
        sku: item.sku || item['מק"ט'] || 'לא זמין',
        name: item.name || item.baseName || 'לא זמין',
        baseName: item.baseName || '',
        quantity: item.quantity || 1,
        price: item.unitPrice || item.price || 0,
        comment: item.comment || '',
        selectedAttributes: item.selectedAttributes || {},
        packageSize: item.packageSize || item.quantity || 1,
        quantities: item.quantities
      })),
      totalPrice: finalTotalPriceWithVAT,
      shippingCost: transportationCosts,
      craneUnloadCost: craneUnloadFee,
      date: new Date().toISOString(),
      status: 'pending',
      shippingAddress: temporaryAddress,
    };

    try {
      if (user?.isCreditLine) {
        // Credit line user → Skip payment, go directly to confirmation
        router.push('/order-confirmation');
      } else {
        // Regular user → Send to iCredit payment
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        localStorage.setItem('finalTotalPrice', finalTotalPriceWithVAT.toString());
        localStorage.setItem('shippingCost', transportationCosts.toString());
        localStorage.setItem('craneUnloadCost', craneUnloadFee.toString());
        localStorage.setItem('shippingAddress', JSON.stringify(temporaryAddress));
        await handlePayment(purchaseData, cartDiscount, originalTotalPrice);
      }
    } catch (error) {
      console.error('Error initiating checkout:', error);
    }
  };

  const handlePayment = async (purchaseData: any, cartDiscount: number, originalTotalPrice: number) => {
    const groupPrivateToken = process.env.NEXT_PUBLIC_GROUP_PRIVATE_TOKEN;

    const formatCurrency = (amount: number) => {
      const formatter = new Intl.NumberFormat('he-IL', {
        style: 'currency',
        currency: 'ILS',
        minimumFractionDigits: 2
      });
      return formatter.format(amount);
    };

    // Create items list for order with attribute descriptions if they exist
    let items = purchaseData.cartItems.map((item: any) => {
      const name = item.baseName || item.name || 'מוצר ללא שם';
      const sku = item.sku || 'לא זמין';

      // Build attributes description in readable format on one line
      let attributesDescription = '';
      if (item.selectedAttributes && typeof item.selectedAttributes === 'object') {
        const attributePairs = Object.entries(item.selectedAttributes).map(
          ([key, value]: [string, any]) => `${key}: ${value.value}`
        );
        attributesDescription = attributePairs.join(' | ');
      }

      // Final readable description without line breaks
      let fullDescription = attributesDescription
        ? `${name} : ${attributesDescription}`
        : `${name}`;
      if (item.comment) {
        fullDescription += ` ( הערה: ${item.comment} )`;
      }

      return {
        CatalogNumber: sku,
        Quantity: item.quantity,
        UnitPrice: item.price,
        Description: fullDescription
      };
    });

    // Add shipping cost if exists
    if (purchaseData.shippingCost && purchaseData.shippingCost > 0) {
      items.push({
        CatalogNumber: 'SHIPPING',
        Quantity: 1,
        UnitPrice: purchaseData.shippingCost,
        Description: 'משלוח'
      });
    }

    // Add crane unload cost if exists
    if (purchaseData.craneUnloadCost && purchaseData.craneUnloadCost > 0) {
      items.push({
        CatalogNumber: 'CRANE_UNLOAD',
        Quantity: 1,
        UnitPrice: purchaseData.craneUnloadCost,
        Description: 'פריקת מנוף'
      });
    }

    // Add cart discount if exists
    if (cartDiscount > 0) {
      const discountAmount = originalTotalPrice * cartDiscount / 100;

      items.push({
        CatalogNumber: 'CART_DISCOUNT',
        Quantity: 1,
        UnitPrice: -discountAmount,
        Description: `הנחת עגלה (${cartDiscount}%): ${formatCurrency(-discountAmount)}`
      });
    }

    // Calculate total before VAT and VAT
    const totalPriceWithVAT = purchaseData.totalPrice;
    const vatRate = 0.18;
    const vatAmount = totalPriceWithVAT * vatRate / (1 + vatRate);
    const totalPriceBeforeVAT = totalPriceWithVAT - vatAmount;

    // Add summary lines
    items.push({
      CatalogNumber: 'SUMMARY_VAT',
      Quantity: 1,
      UnitPrice: vatAmount.toFixed(2),
      Description: 'מע"מ (18%)'
    });

    const requestData = {
      GroupPrivateToken: groupPrivateToken,
      Items: items,
      Currency: 1, // ILS
      SaleType: 1, // Immediate transaction
      RedirectURL: `${window.location.origin}/order-success`,
      FailRedirectURL: `${window.location.origin}/cart`,
      IPNURL: `${window.location.origin}/api/payment-ipn`,
      CustomerFirstName: firstName,
      CustomerLastName: lastName,
      EmailAddress: user?.email || 'guest@example.com'
    };

    const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

    try {
      const response = await fetch(`${BASE_URL}/api/payment/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        localStorage.setItem('SalePrivateToken', data.salePrivateToken);
        window.location.href = data.paymentUrl;
      } else {
        console.error('❌ שגיאה בקבלת URL לתשלום:', data);
        setErrorMessage('❌ שגיאה בהפנייתך לתשלום. נסה שוב.');
      }
    } catch (error) {
      console.error('❌ שגיאה בהתחברות לשרת:', error);
      setErrorMessage('❌ שגיאה בלתי צפויה. נסה שוב מאוחר יותר.');
    }
  };

  const handleCheckoutClick = () => {
    if (cartItems.length === 0) {
      setErrorMessage('❌ שים לב העגלה ריקה!');

      // Clear error message after 5 seconds
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }
    if (user?.isCreditLine) {
      setIsModalOpen(true); // Open confirmation modal for CreditLine users
    } else {
      handleCheckout(); // Proceed directly for regular users
    }
  };

  const handleConfirmOrder = async () => {
    setIsModalOpen(false);

    const purchaseData = {
      purchaseId: `${Date.now()}`,
      cartItems: cartItems.map((item: any) => ({
        _id: item._id,
        sku: item.sku || item['מק"ט'] || 'לא זמין',
        name: item.name || item.baseName || 'לא זמין',
        baseName: item.baseName || '',
        quantity: item.quantity || 1,
        price: item.unitPrice || item.price || 0,
        unitPrice: item.unitPrice || item.price || 0,
        comment: item.comment || '',
        packageSize: item.packageSize || item.quantity || 1,
        quantities: item.quantities,
        selectedAttributes: item.selectedAttributes || {},
        craneUnload: item.craneUnload ?? null,
      })),
      totalPrice: finalTotalPriceWithVAT,
      shippingCost: transportationCosts,
      craneUnloadCost: craneUnloadFee,
      date: new Date().toISOString(),
      status: 'pending',
      shippingAddress: temporaryAddress,
      isCreditLine: true,
      paymentMethod: 'creditLine'
    };

    try {
      const userRef = doc(db, 'users', user!.uid);
      const purchasesRef = collection(userRef, 'purchases');

      await addDoc(purchasesRef, purchaseData);

      // Send confirmation emails
      try {
        if (process.env.NODE_ENV !== 'production') {
          console.log('📧 Attempting to send confirmation email to:', user?.email);
        }
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/email/send-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toEmail: user?.email,
            orderData: purchaseData
          })
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          console.error('❌ Email sending failed:', errorData);
        } else {
          if (process.env.NODE_ENV !== 'production') {
            console.log('✅ Confirmation email sent successfully');
          }
        }
      } catch (emailError) {
        console.error('❌ Error sending confirmation email:', emailError);
        // Don't block the order completion if email fails
      }

      // Save order data to localStorage for order-confirmation page
      localStorage.setItem('orderData', JSON.stringify(purchaseData));

      dispatch(setCartItems([]));
      saveCartToFirestore([]);

      router.push('/order-confirmation');
    } catch (error) {
      console.error('שגיאה בשמירת ההזמנה:', error);
    }
  };

  const handleCancelOrder = () => {
    setIsModalOpen(false);
  };

  const handleEditAddressToggle = () => {
    setIsEditingAddress(!isEditingAddress);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTemporaryAddress((prev) => ({ ...prev, [name]: value }));
  };

  const saveTemporaryAddressToFirestore = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const cartRef = doc(db, 'carts', currentUser.uid);
      const existingCart = (await loadCartFromFirestore()) || [];

      await setDoc(cartRef, {
        cartItems: existingCart,
        cartAddress: temporaryAddress
      }, { merge: true });

      setIsEditingAddress(false);
    } catch (error) {
      console.error('Error saving temporary address to Firestore:', error);
    }
  };

  const handleIncrease = (cartItemId: string, amount = 1) => {
    dispatch(increaseQuantity({ cartItemId, amount }));
    saveCartToFirestore(
      cartItems.map((item: any) =>
        item.cartItemId === cartItemId
          ? { ...item, quantity: item.quantity + amount }
          : item
      )
    );
  };

  const handleDecrease = (cartItemId: string, amount = 1) => {
    const item = cartItems.find((item: any) => item.cartItemId === cartItemId);
    if (item && item.quantity > amount) {
      dispatch(decreaseQuantity({ cartItemId, amount }));
      saveCartToFirestore(
        cartItems.map((item: any) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity - amount }
            : item
        )
      );
    } else {
      handleRemove(cartItemId);
    }
  };

  const handleRemove = (cartItemId: string) => {
    dispatch(removeFromCart({ cartItemId }));
    saveCartToFirestore(cartItems.filter((item: any) => item.cartItemId !== cartItemId));
  };

  const originalTotalPrice = cartItems.reduce((acc: number, item: any) => {
    const itemPrice = item.unitPrice || 0;
    const itemQuantity = item.quantity || 1;
    return acc + itemPrice * itemQuantity;
  }, 0);

  const craneUnloadFee = cartItems.some((item: any) =>
    item.materialGroup === 'Gypsum and Tracks' && item.craneUnload
  ) ? 250 : 0;

  const vatRate = 0.18;

  const finalTotalPriceBeforeVAT = originalTotalPrice - (originalTotalPrice * cartDiscount) / 100 + transportationCosts + craneUnloadFee;
  const vatAmount = finalTotalPriceBeforeVAT * vatRate;
  const finalTotalPriceWithVAT = finalTotalPriceBeforeVAT + vatAmount;

  const breadcrumbItems = [
    { label: 'דף הבית', href: '/' },
    { label: 'העגלה שלי' }
  ];

  return (
      <main className="min-h-screen w-full px-4 md:px-10 pt-32 md:pt-36 mt-4">
        <Breadcrumbs items={breadcrumbItems} />
        <header>
          <h1 className="text-2xl md:text-4xl font-bold text-right mb-6 md:mb-10 mt-10">העגלה שלי</h1>
        </header>

        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          {/* Cart Items Section */}
          <section aria-label="פריטים בעגלה" className="w-full md:w-2/3 space-y-4">
            {cartItems.length > 0 ? (
              cartItems.map((item: any) => (
                <CartItem
                  key={item.cartItemId}
                  item={item}
                  onIncrease={handleIncrease}
                  onDecrease={handleDecrease}
                  onRemove={() => handleRemove(item.cartItemId)}
                />
              ))
            ) : (
              <div className="text-xl text-center py-10">העגלה ריקה</div>
            )}
          </section>

          {/* Cart Summary Section */}
          <aside aria-label="סיכום הזמנה" className="w-full md:w-1/3 space-y-6">
            {/* Progress Section */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4 text-right">
                השג 100% בכל קבוצת חומרים לקבלת הובלה חינם!
              </h2>
              {materialGroups.map((group) => {
                const progress = progressData[group.groupName] || { totalInCart: 0, percentage: 0 };
                const remainingAmount = Math.max(group.minPrice - progress.totalInCart, 0);
                return (
                  <div key={group.groupName} className="mb-4">
                    <h3 className="text-right font-medium mb-2">
                      {group.groupName === 'Colors and Accessories' && 'צבעים ומוצרים נלווים'}
                      {group.groupName === 'Powders' && 'אבקות (דבקים וטייח)'}
                      {group.groupName === 'Gypsum and Tracks' && 'גבס ומסלולים'}
                    </h3>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    <p className="text-sm mt-1 text-right">
                      {progress.totalInCart > 0
                        ? progress.percentage < 100
                          ? `הוסף ${remainingAmount}₪ להובלה חינם (משלוח: ${group.transportationPrice}₪)`
                          : 'הובלה חינם!'
                        : 'אין מוצרים מקבוצה זו בעגלה'
                      }
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-bold mb-4 text-right">סיכום הזמנה</h2>
              <div className="space-y-2 text-right">
                <p>סה"כ מוצרים לפני הנחה: ₪{originalTotalPrice.toFixed(2)}</p>
                {cartDiscount > 0 && (
                  <p className="text-green-600">
                    הנחת עגלה (%{cartDiscount}): ₪{(originalTotalPrice * cartDiscount / 100).toFixed(2)}
                  </p>
                )}
                <p>מחיר משלוח: ₪{transportationCosts.toFixed(2)}</p>
                {craneUnloadFee > 0 && (
                  <p className="text-red-600 font-semibold">תוספת פריקת מנוף: ₪250</p>
                )}
                <p>סה"כ לפני מע"מ: ₪{finalTotalPriceBeforeVAT.toFixed(2)}</p>
                <p>מע"מ (18%): ₪{vatAmount.toFixed(2)}</p>
                <p className="text-lg font-bold">סה"כ לתשלום: ₪{finalTotalPriceWithVAT.toFixed(2)}</p>
              </div>

              <button
                onClick={handleCheckoutClick}
                className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {user?.isCreditLine ? 'סיום הזמנה' : 'מעבר לתשלום'}
              </button>

              {errorMessage && (
                <p className="mt-2 text-red-600 text-center">{errorMessage}</p>
              )}
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold mb-4 text-right">כתובת למשלוח</h3>
              {isEditingAddress ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    name="city"
                    value={temporaryAddress.city}
                    placeholder="עיר"
                    onChange={handleAddressChange}
                    className="w-full p-2 border rounded-lg text-right"
                  />
                  <input
                    type="text"
                    name="street"
                    value={temporaryAddress.street}
                    placeholder="רחוב"
                    onChange={handleAddressChange}
                    className="w-full p-2 border rounded-lg text-right"
                  />
                  <input
                    type="text"
                    name="apartment"
                    value={temporaryAddress.apartment}
                    placeholder="דירה"
                    onChange={handleAddressChange}
                    className="w-full p-2 border rounded-lg text-right"
                  />
                  <input
                    type="text"
                    name="floor"
                    value={temporaryAddress.floor}
                    placeholder="קומה"
                    onChange={handleAddressChange}
                    className="w-full p-2 border rounded-lg text-right"
                  />
                  <input
                    type="text"
                    name="entrance"
                    value={temporaryAddress.entrance}
                    placeholder="כניסה"
                    onChange={handleAddressChange}
                    className="w-full p-2 border rounded-lg text-right"
                  />
                  <button
                    onClick={saveTemporaryAddressToFirestore}
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    שמור כתובת
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-right">
                  <p>עיר: {temporaryAddress.city || 'לא זמין'}</p>
                  <p>רחוב: {temporaryAddress.street || 'לא זמין'}</p>
                  <p>דירה: {temporaryAddress.apartment || 'לא זמין'}</p>
                  <p>קומה: {temporaryAddress.floor || 'לא זמין'}</p>
                  <p>כניסה: {temporaryAddress.entrance || 'לא זמין'}</p>
                  <button
                    onClick={handleEditAddressToggle}
                    className="w-full mt-2 border border-blue-600 text-blue-600 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    ערוך כתובת
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>

        {isModalOpen && (
          <ConfirmationModal
            cartItems={cartItems}
            finalTotalPrice={finalTotalPriceWithVAT}
            shippingCost={transportationCosts}
            craneUnloadCost={craneUnloadFee}
            onConfirm={handleConfirmOrder}
            onCancel={handleCancelOrder}
          />
        )}
      </main>
  );
}
