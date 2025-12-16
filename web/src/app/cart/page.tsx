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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
    let previousUserId: string | null = null;
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const currentUserId = currentUser.uid;
        
        // If user changed, clear cart first
        if (previousUserId && previousUserId !== currentUserId) {
          dispatch(setCartItems([]));
        }
        
        setIsAuthenticated(true);
        previousUserId = currentUserId;

        // Reset the cart when user logs in (or changes)
        dispatch(setCartItems([]));

        // Load new user's cart
        const cartFromFirestore = await loadCartFromFirestore();
        dispatch(setCartItems(cartFromFirestore || []));
      } else {
        setIsAuthenticated(false);
        previousUserId = null;
        router.push('/login');

        // Clear the cart on logout
        dispatch(setCartItems([]));
      }
    });

    return () => unsubscribe();
  }, [router, dispatch]);

  useEffect(() => {
    if (!isAuthenticated || !user?.uid) return;

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
      // Clear cart first to avoid showing old user's cart
      dispatch(setCartItems([]));
      
      const cartFromFirestore = await loadCartFromFirestore();
      dispatch(setCartItems(cartFromFirestore || []));
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
  }, [dispatch, isAuthenticated, user?.uid]);

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

    // Check if profile is complete before checkout
    if (!user?.name || !user?.phone || !temporaryAddress.city || !temporaryAddress.street) {
      setErrorMessage('יש להשלים את הפרטים האישיים והכתובת לפני ביצוע הזמנה');
      router.push('/user-info');
      return;
    }

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
      UnitPrice: Number(vatAmount.toFixed(2)),
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

  const isAdmin = user?.isAdmin || user?.userType === 'admin';

  const generatePDF = async () => {
    if (cartItems.length === 0) {
      alert('העגלה ריקה');
      return;
    }

    const date = new Date().toLocaleDateString('he-IL');
    
    // Create container for page 1
    const pdfContainer = document.createElement('div');
    pdfContainer.id = 'pdf-page1';
    pdfContainer.style.position = 'fixed';
    pdfContainer.style.top = '0';
    pdfContainer.style.left = '0';
    pdfContainer.style.width = '210mm';
    pdfContainer.style.minHeight = '297mm';
    pdfContainer.style.backgroundColor = 'white';
    pdfContainer.style.direction = 'rtl';
    pdfContainer.style.fontFamily = 'Arial, Helvetica, sans-serif';
    pdfContainer.style.padding = '30px';
    pdfContainer.style.zIndex = '-1';

    // Helper function to build product HTML
    const buildProductHTML = (item: any, index: number) => {
      const productName = item.name || item.שם || 'לא זמין';
      const sku = item.sku || item['מק"ט'] || 'לא זמין';
      const quantity = item.quantity || 1;
      const unitPrice = item.unitPrice || 0;
      const totalPrice = unitPrice * quantity;
      const materialGroup = item.materialGroup || '';
      const imageUrl = item.image || item.תמונות || '/default-image.jpg';
      const comment = item.comment || '';

      return `
        <div style="display: flex; align-items: flex-start; padding: 25px; border-bottom: 2px solid #e5e7eb; gap: 25px; page-break-inside: avoid; break-inside: avoid; justify-content: center;">
          <div style="flex: 0 0 50px; text-align: center; font-weight: bold; color: #6b7280; padding-top: 8px; font-size: 18px;">${index + 1}</div>
          <div style="flex: 0 0 120px; display: flex; justify-content: center;">
            <img src="${imageUrl}" alt="${productName}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 10px; border: 2px solid #e5e7eb;" onerror="this.src='/default-image.jpg'" />
          </div>
          <div style="flex: 1; text-align: right; min-width: 0; max-width: 400px;">
            <div style="font-weight: bold; margin-bottom: 10px; font-size: 20px; color: #1f2937;">${productName}</div>
            <div style="color: #6b7280; font-size: 16px; margin-bottom: 6px;">מק"ט: ${sku}</div>
            ${materialGroup ? `<div style="color: #6b7280; font-size: 16px; margin-bottom: 6px;">קבוצת חומרים: ${materialGroup === 'Colors and Accessories' ? 'צבעים ומוצרים נלווים' : materialGroup === 'Powders' ? 'אבקות (דבקים וטייח)' : materialGroup === 'Gypsum and Tracks' ? 'גבס ומסלולים' : materialGroup}</div>` : ''}
            ${comment ? `<div style="background-color: #fef3c7; border-right: 4px solid #f59e0b; padding: 12px 16px; margin-top: 10px; border-radius: 6px; font-size: 16px; color: #92400e;"><strong>הערה:</strong> ${comment}</div>` : ''}
          </div>
          <div style="flex: 0 0 100px; text-align: center; padding-top: 8px;">
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px; font-weight: 600;">כמות</div>
            <div style="font-weight: bold; font-size: 24px; color: #1f2937;">${quantity}</div>
          </div>
          <div style="flex: 0 0 140px; text-align: left; padding-top: 8px;">
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px; font-weight: 600;">מחיר כולל</div>
            <div style="font-weight: bold; font-size: 24px; color: #2563eb;">₪${totalPrice.toFixed(2)}</div>
            <div style="font-size: 14px; color: #9ca3af; margin-top: 6px;">₪${unitPrice.toFixed(2)} ליחידה</div>
          </div>
        </div>
      `;
    };

    // Build header and customer info HTML
    // Get base URL for logo
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const logoUrl = `${baseUrl}/logo.png`;

    const headerAndCustomerHTML = `
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 40px; padding-bottom: 25px; border-bottom: 4px solid #2563eb;">
        <img src="${logoUrl}" alt="LavanGroup Logo" style="width: 180px; height: auto; margin-bottom: 20px;" onerror="this.style.display='none'" />
        <h1 style="font-size: 36px; margin: 0 0 15px 0; color: #1f2937; font-weight: 700;">הצעת מחיר</h1>
        <div style="font-size: 18px; color: #6b7280; margin-top: 10px;">תאריך: ${date}</div>
      </div>

      ${user ? `
      <!-- Customer Info -->
      <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); padding: 25px; border-radius: 12px; margin-bottom: 35px; border: 2px solid #e5e7eb;">
        <h2 style="font-size: 20px; margin: 0 0 18px 0; color: #1f2937; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">פרטי לקוח</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 17px;">
          <div><strong style="color: #4b5563;">שם:</strong> <span style="color: #1f2937;">${user.name || 'לא זמין'}</span></div>
          <div><strong style="color: #4b5563;">אימייל:</strong> <span style="color: #1f2937;">${user.email || 'לא זמין'}</span></div>
          <div><strong style="color: #4b5563;">טלפון:</strong> <span style="color: #1f2937;">${user.phone || 'לא זמין'}</span></div>
        </div>
      </div>
      ` : ''}

      <!-- Products Section Header -->
      <div style="margin-bottom: 25px;">
        <h2 style="font-size: 22px; margin: 0 0 25px 0; color: #1f2937; font-weight: 700; padding-bottom: 12px; border-bottom: 3px solid #e5e7eb; text-align: center;">פרטי מוצרים</h2>
      </div>
    `;

    // Split products into pages - 2 products on first page (with header), 3 products on subsequent pages
    const PRODUCTS_FIRST_PAGE = 2;
    const PRODUCTS_PER_PAGE = 3;
    
    const productPages: any[][] = [];
    let remainingProducts = [...cartItems];
    
    // First page products
    productPages.push(remainingProducts.splice(0, PRODUCTS_FIRST_PAGE));
    
    // Remaining pages
    while (remainingProducts.length > 0) {
      productPages.push(remainingProducts.splice(0, PRODUCTS_PER_PAGE));
    }

    // Create containers for each product page
    const productPageContainers: HTMLDivElement[] = [];

    productPages.forEach((pageProducts, pageIndex) => {
      const container = document.createElement('div');
      container.id = `pdf-products-page-${pageIndex}`;
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '210mm';
      container.style.minHeight = '297mm';
      container.style.backgroundColor = 'white';
      container.style.direction = 'rtl';
      container.style.fontFamily = 'Arial, Helvetica, sans-serif';
      container.style.padding = '30px';
      container.style.zIndex = '-1';

      let pageProductsHTML = '';
      const startIndex = pageIndex === 0 ? 0 : PRODUCTS_FIRST_PAGE + (pageIndex - 1) * PRODUCTS_PER_PAGE;
      pageProducts.forEach((item: any, idx: number) => {
        pageProductsHTML += buildProductHTML(item, startIndex + idx);
      });

      if (pageIndex === 0) {
        // First page with header and customer info
        container.innerHTML = `
          <div style="max-width: 100%; margin: 0 auto; background: white;">
            ${headerAndCustomerHTML}
            <div style="background: white; border: 2px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
              ${pageProductsHTML}
            </div>
          </div>
        `;
      } else {
        // Continuation pages with just logo and products
        container.innerHTML = `
          <div style="max-width: 100%; margin: 0 auto; background: white;">
            <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #2563eb;">
              <img src="${logoUrl}" alt="LavanGroup Logo" style="width: 120px; height: auto; margin-bottom: 10px;" onerror="this.style.display='none'" />
              <div style="font-size: 14px; color: #6b7280;">הצעת מחיר - המשך</div>
            </div>
            <div style="background: white; border: 2px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
              ${pageProductsHTML}
            </div>
          </div>
        `;
      }

      productPageContainers.push(container);
    });

    // Use first container as main pdfContainer
    pdfContainer.innerHTML = productPageContainers[0].innerHTML;

    // Page 2: Summary
    const page2Container = document.createElement('div');
    page2Container.id = 'pdf-page2';
    page2Container.style.position = 'fixed';
    page2Container.style.top = '0';
    page2Container.style.left = '0';
    page2Container.style.width = '210mm';
    page2Container.style.minHeight = '297mm';
    page2Container.style.backgroundColor = 'white';
    page2Container.style.direction = 'rtl';
    page2Container.style.fontFamily = 'Arial, Helvetica, sans-serif';
    page2Container.style.padding = '30px';
    page2Container.style.zIndex = '-1';

    page2Container.innerHTML = `
      <div style="max-width: 100%; margin: 0 auto; display: flex; flex-direction: column; justify-content: center; min-height: 100%;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 50px; padding-bottom: 25px; border-bottom: 4px solid #2563eb;">
          <img src="${logoUrl}" alt="LavanGroup Logo" style="width: 180px; height: auto; margin-bottom: 20px;" onerror="this.style.display='none'" />
          <h1 style="font-size: 36px; margin: 0 0 15px 0; color: #1f2937; font-weight: 700;">הצעת מחיר</h1>
          <div style="font-size: 18px; color: #6b7280; margin-top: 10px;">תאריך: ${date}</div>
        </div>

        <!-- Summary Section -->
        <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); padding: 40px; border-radius: 16px; border: 3px solid #e5e7eb; max-width: 600px; margin: 0 auto; width: 100%;">
          <h2 style="font-size: 28px; margin: 0 0 35px 0; color: #1f2937; font-weight: 700; padding-bottom: 20px; border-bottom: 4px solid #2563eb; text-align: center;">סיכום הזמנה</h2>
          <div style="display: flex; justify-content: space-between; padding: 18px 0; border-bottom: 2px solid #d1d5db; font-size: 18px;">
            <span style="color: #4b5563;">סה"כ מוצרים לפני הנחה:</span>
            <span style="font-weight: 700; color: #1f2937;">₪${originalTotalPrice.toFixed(2)}</span>
          </div>
          ${cartDiscount > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 18px 0; border-bottom: 2px solid #d1d5db; font-size: 18px; color: #059669;">
            <span>הנחת עגלה (%${cartDiscount}):</span>
            <span style="font-weight: 700;">₪${(originalTotalPrice * cartDiscount / 100).toFixed(2)}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 18px 0; border-bottom: 2px solid #d1d5db; font-size: 18px;">
            <span style="color: #4b5563;">מחיר משלוח:</span>
            <span style="font-weight: 700; color: #1f2937;">₪${transportationCosts.toFixed(2)}</span>
          </div>
          ${craneUnloadFee > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 18px 0; border-bottom: 2px solid #d1d5db; font-size: 18px; color: #dc2626;">
            <span>תוספת פריקת מנוף:</span>
            <span style="font-weight: 700;">₪${craneUnloadFee.toFixed(2)}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 18px 0; border-bottom: 2px solid #d1d5db; font-size: 18px;">
            <span style="color: #4b5563;">סה"כ לפני מע"מ:</span>
            <span style="font-weight: 700; color: #1f2937;">₪${finalTotalPriceBeforeVAT.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 18px 0; border-bottom: 4px solid #1f2937; font-size: 18px; margin-bottom: 25px;">
            <span style="color: #4b5563;">מע"מ (18%):</span>
            <span style="font-weight: 700; color: #1f2937;">₪${vatAmount.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 30px 0 0 0; margin-top: 25px; background: white; padding: 30px; border-radius: 12px; border: 3px solid #2563eb;">
            <span style="font-size: 24px; font-weight: 700; color: #1f2937;">סה"כ לתשלום:</span>
            <span style="font-size: 32px; font-weight: 700; color: #2563eb;">₪${finalTotalPriceWithVAT.toFixed(2)}</span>
          </div>
        </div>
      </div>
    `;

    // Add all containers to body
    document.body.appendChild(pdfContainer);
    productPageContainers.slice(1).forEach(container => {
      document.body.appendChild(container);
    });
    document.body.appendChild(page2Container);

    // Wait for all images to load across all containers
    const allContainers = [pdfContainer, ...productPageContainers.slice(1), page2Container];
    await new Promise((resolve) => {
      let totalImages = 0;
      let loadedImages = 0;

      allContainers.forEach(container => {
        const images = container.querySelectorAll('img');
        totalImages += images.length;

        images.forEach((img) => {
          if (img.complete) {
            loadedImages++;
          } else {
            img.onload = () => {
              loadedImages++;
              if (loadedImages === totalImages) resolve(null);
            };
            img.onerror = () => {
              loadedImages++;
              if (loadedImages === totalImages) resolve(null);
            };
          }
        });
      });

      if (totalImages === 0 || loadedImages === totalImages) {
        resolve(null);
      }
    });

    // Generate PDF with separate pages for each container
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Add first product page
      const canvas1 = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData1 = canvas1.toDataURL('image/png', 1.0);
      const ratio1 = pdfWidth / (canvas1.width * 0.264583);
      const scaledHeight1 = (canvas1.height * 0.264583) * ratio1;
      pdf.addImage(imgData1, 'PNG', 0, 0, pdfWidth, Math.min(scaledHeight1, pdfHeight));

      // Add additional product pages
      for (let i = 1; i < productPageContainers.length; i++) {
        const canvas = await html2canvas(productPageContainers[i], {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        const ratio = pdfWidth / (canvas.width * 0.264583);
        const scaledHeight = (canvas.height * 0.264583) * ratio;

        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(scaledHeight, pdfHeight));
      }

      // Add Summary page
      const canvas2 = await html2canvas(page2Container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData2 = canvas2.toDataURL('image/png', 1.0);
      const ratio2 = pdfWidth / (canvas2.width * 0.264583);
      const scaledHeight2 = (canvas2.height * 0.264583) * ratio2;

      pdf.addPage();
      pdf.addImage(imgData2, 'PNG', 0, 0, pdfWidth, Math.min(scaledHeight2, pdfHeight));

      const fileName = `cart-report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('שגיאה ביצירת PDF. נסה שוב.');
    } finally {
      // Remove all containers
      document.body.removeChild(pdfContainer);
      productPageContainers.slice(1).forEach(container => {
        if (container.parentNode) {
          document.body.removeChild(container);
        }
      });
      document.body.removeChild(page2Container);
    }
  };

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

              {isAdmin && (
                <button
                  onClick={generatePDF}
                  className="w-full mt-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  ייצא PDF מפורט
                </button>
              )}

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
