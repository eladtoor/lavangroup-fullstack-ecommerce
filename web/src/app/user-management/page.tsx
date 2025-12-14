'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteField } from 'firebase/firestore';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { fetchProducts } from '@/lib/redux/actions/productActions';
import RoleProtectedRoute from '@/components/RoleProtectedRoute';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function UserManagement() {
  return (
    <RoleProtectedRoute allowedRoles={['admin']}>
      <UserManagementContent />
    </RoleProtectedRoute>
  );
}

function UserManagementContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const products = useAppSelector((state) => state.products.products);

  type UserDoc = {
    id: string;
    isCreditLine?: boolean;
    referredBy?: string;
    isAdmin?: boolean;
    userType?: string;
    productDiscounts?: any[];
    referralCount?: number;
    [key: string]: any;
  };

  const [users, setUsers] = useState<any[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userType, setUserType] = useState('רגיל');
  const [productDiscounts, setProductDiscounts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [referralCounts, setReferralCounts] = useState<Record<string, number>>({});
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [isCreditLine, setIsCreditLine] = useState(false);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const userDocs = await getDocs(usersCollection);
        const usersData: UserDoc[] = userDocs.docs.map((snap) => ({
          id: snap.id,
          ...(snap.data() as Record<string, any>),
        }));

        // Ensure isCreditLine field exists
        usersData.forEach(async (user) => {
          if (user.isCreditLine === undefined) {
            const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, { isCreditLine: false });
          }
        });

        setUsers(usersData);

        // Count referrals for each agent
        const counts: Record<string, number> = {};
        usersData.forEach((user) => {
          if (user.referredBy) {
            const agentId = user.referredBy.trim();
            counts[agentId] = (counts[agentId] || 0) + 1;
          }
        });

        setReferralCounts(counts);

        // Save referral counts to the agent documents
        for (const agentId of Object.keys(counts)) {
          try {
            const agentRef = doc(db, 'users', agentId);
            await updateDoc(agentRef, { referralCount: counts[agentId] });
          } catch (error) {
            console.error(`Error updating agent ${agentId}:`, error);
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();

    // Fetch WhatsApp settings
    const fetchWhatsAppDetails = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp-settings`);
        if (response.ok) {
          const data = await response.json();
          setWhatsappNumber(data.whatsappNumber || '');
          setWhatsappMessage(data.whatsappMessage || '');
        }
      } catch (error) {
        console.error('Error fetching WhatsApp details:', error);
      }
    };

    fetchWhatsAppDetails();
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    const filtered = products
      .filter(
        (product) =>
          product['שם'].toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.מזהה.toString().includes(searchQuery)
      )
      .slice(0, 3);
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsAdmin(user.isAdmin);
    setUserType(user.userType || 'רגיל');
    setProductDiscounts(user.productDiscounts || []);
    setIsCreditLine(user.isCreditLine || false);
    setIsEditModalOpen(true);
  };

  const handleViewPurchaseHistory = (userId: string, userName: string) => {
    router.push(`/purchase-history/${userId}/${userName}`);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
    setProductDiscounts([]);
    setSearchQuery('');
    setFilteredProducts([]);
  };

  const handleAddProductDiscount = (product: any) => {
    if (!productDiscounts.find((discount) => discount.productId === product._id)) {
      setProductDiscounts((prevDiscounts) => [
        ...prevDiscounts,
        { productId: product._id, מזהה: product['מזהה'], productName: product['שם'], discount: 0 },
      ]);
    }
    setSearchQuery('');
  };

  const handleRemoveProductDiscount = (index: number) => {
    const updatedDiscounts = [...productDiscounts];
    updatedDiscounts.splice(index, 1);
    setProductDiscounts(updatedDiscounts);
  };

  const handleProductDiscountChange = (index: number, field: string, value: any) => {
    const updatedDiscounts = [...productDiscounts];
    updatedDiscounts[index][field] = value;
    setProductDiscounts(updatedDiscounts);
  };

  const handleSaveChanges = async () => {
    if (selectedUser) {
      const userRef = doc(db, 'users', selectedUser.id);
      try {
        let referralLink = selectedUser.referralLink;
        if (userType === 'סוכן' && !referralLink) {
          referralLink = `${window.location.origin}/register?ref=agent-${selectedUser.id}-${Date.now()}`;
        }

        const updateData: any = {
          isAdmin: isAdmin ?? false,
          userType: userType || 'רגיל',
          isCreditLine: isCreditLine ?? false,
          cartDiscount: userType === 'סוכן' ? selectedUser.cartDiscount || 0 : deleteField(),
          productDiscounts: userType === 'רגיל' ? productDiscounts : deleteField(),
          referralLink: userType === 'סוכן' ? referralLink : deleteField(),
        };

        await updateDoc(userRef, updateData);

        setUsers(
          users.map((user) =>
            user.id === selectedUser.id
              ? {
                  ...user,
                  isAdmin,
                  userType: userType || 'רגיל',
                  isCreditLine,
                  cartDiscount: userType === 'סוכן' ? selectedUser.cartDiscount : undefined,
                  productDiscounts: userType === 'רגיל' ? productDiscounts : undefined,
                  referralLink: userType === 'סוכן' ? referralLink : undefined,
                }
              : user
          )
        );
        closeEditModal();
        alert('השינויים נשמרו בהצלחה!');
      } catch (error) {
        console.error('Error updating user:', error);
        alert('שגיאה בשמירת השינויים');
      }
    }
  };

  const handleSaveWhatsAppDetails = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappNumber, whatsappMessage }),
      });
      alert('פרטי וואטסאפ נשמרו בהצלחה!');
    } catch (error) {
      console.error('Error saving WhatsApp details:', error);
      alert('שגיאה בשמירה');
    }
  };

  const filteredUsers = users.filter((user) => {
    if (filterType === 'agents') return user.userType === 'סוכן' || user.userType === 'agent';
    if (filterType === 'regular') return user.userType !== 'סוכן' && user.userType !== 'agent';
    if (filterType === 'credit') return user.isCreditLine === true;
    if (filterType === 'admins') return user.isAdmin === true;
    return true;
  });

  const breadcrumbItems = [
    { label: 'דף הבית', href: '/' },
    { label: 'ניהול משתמשים' }
  ];

  return (
      <div className="min-h-screen container mx-auto px-4 py-8 pt-32 md:pt-36" dir="rtl">
        <Breadcrumbs items={breadcrumbItems} />
        <h1 className="text-3xl font-bold text-gray-900 text-right mb-6 pr-4 border-r-4 border-primary">
          ניהול משתמשים
        </h1>

        {/* Filter Options */}
        <div className="flex gap-4 mb-4 items-center text-lg flex-wrap">
          {['all', 'agents', 'regular', 'credit', 'admins'].map((type) => (
            <label key={type} className="flex items-center gap-2">
              <input
                type="radio"
                value={type}
                checked={filterType === type}
                onChange={() => setFilterType(type)}
              />
              {
                {
                  all: 'כל המשתמשים',
                  agents: 'סוכנים',
                  regular: 'רגילים',
                  credit: 'קו אשראי',
                  admins: 'אדמינים',
                }[type]
              }
            </label>
          ))}
        </div>

        <p className="text-right text-sm text-gray-700 mb-2">
          מציג {filteredUsers.length} מתוך {users.length} משתמשים
        </p>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border border-gray-300 shadow-md rounded-lg overflow-hidden text-sm text-gray-800 bg-white">
            <thead className="bg-gray-100 text-gray-800 font-bold text-center">
              <tr>
                <th className="border border-gray-300 px-4 py-2">שם משתמש</th>
                <th className="border border-gray-300 px-4 py-2">אימייל</th>
                <th className="border border-gray-300 px-4 py-2">טלפון</th>
                <th className="border border-gray-300 px-4 py-2">כתובת</th>
                <th className="border border-gray-300 px-4 py-2">סוג משתמש</th>
                <th className="border border-gray-300 px-4 py-2">קו אשראי</th>
                <th className="border border-gray-300 px-4 py-2">הנחת סוכן כללית</th>
                <th className="border border-gray-300 px-4 py-2">פעולות</th>
                <th className="border border-gray-300 px-4 py-2">לקוחות דרכו</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr key={user.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-200 px-3 py-2 text-center">{user.name}</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">{user.email}</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">{user.phone || 'לא זמין'}</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {user.address
                      ? [
                          user.address.city && `${user.address.city}`,
                          user.address.street && `${user.address.street}`,
                          user.address.apartment && `דירה ${user.address.apartment}`,
                        ]
                          .filter(Boolean)
                          .join(', ')
                      : 'לא זמין'}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {user.userType === 'סוכן' || user.userType === 'agent' ? 'סוכן' : 'רגיל'}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {user.isCreditLine ? 'כן' : 'לא'}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {user.userType === 'סוכן' ? `${user.cartDiscount || 0}%` : 'לא זמין'}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center space-y-2">
                    <button
                      className="bg-yellow-500 text-white px-4 py-1 rounded hover:bg-yellow-600 w-full"
                      onClick={() => handleEditUser(user)}
                    >
                      עריכה
                    </button>
                    <button
                      className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 w-full"
                      onClick={() => handleViewPurchaseHistory(user.id, user.name)}
                    >
                      היסטוריית רכישות
                    </button>
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {user.userType === 'סוכן' ? referralCounts[user.id] || 0 : 'לא זמין'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* WhatsApp Settings */}
        <div className="mt-12 bg-white p-6 rounded shadow">
          <h2 className="text-3xl font-bold text-gray-900 text-right mb-6 pr-4 border-r-4 border-primary">
            עריכת פרטי וואטסאפ
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-right font-semibold mb-2">מספר וואטסאפ:</label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="border p-2 rounded w-full"
              />
            </div>
            <div>
              <label className="block text-right font-semibold mb-2">הודעת וואטסאפ:</label>
              <textarea
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                className="border p-2 rounded w-full"
                rows={4}
              />
            </div>
            <button
              className="bg-primary hover:bg-orange-600 text-black font-bold py-2 px-6 rounded-lg shadow-md transition duration-300"
              onClick={handleSaveWhatsAppDetails}
            >
              שמור
            </button>
          </div>
        </div>

        {/* Edit Modal */}
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
              <button
                className="absolute top-4 left-4 text-gray-500 hover:text-primary text-3xl"
                onClick={closeEditModal}
              >
                &times;
              </button>

              <h2 className="text-xl font-bold text-gray-900 text-right mb-6 pr-4 border-r-4 border-primary">
                עריכת משתמש - {selectedUser?.name}
              </h2>

              <div className="space-y-4">
                {/* Admin Toggle */}
                <div className="flex items-center justify-between">
                  <span>האם היוזר אדמין?</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAdmin}
                      onChange={() => setIsAdmin(!isAdmin)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* User Type */}
                <div>
                  <label className="block text-right font-semibold mb-2">סוג משתמש:</label>
                  <select
                    value={userType === 'סוכן' || userType === 'agent' ? 'סוכן' : 'רגיל'}
                    onChange={(e) => setUserType(e.target.value)}
                    className="border p-2 rounded w-full"
                  >
                    <option value="רגיל">רגיל</option>
                    <option value="סוכן">סוכן</option>
                  </select>
                </div>

                {/* Agent Cart Discount */}
                {(userType === 'סוכן' || userType === 'agent') && (
                  <div>
                    <label className="block text-right font-semibold mb-2">הנחה כללית לעגלה (%):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={selectedUser?.cartDiscount || 0}
                      onChange={(e) =>
                        setSelectedUser({ ...selectedUser, cartDiscount: parseFloat(e.target.value) || 0 })
                      }
                      className="border p-2 rounded w-full"
                    />
                  </div>
                )}

                {/* Regular User Settings */}
                {userType === 'רגיל' && (
                  <>
                    {/* Credit Line Toggle */}
                    <div className="flex items-center justify-between">
                      <span>האם המשתמש הוא "קו אשראי"?</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isCreditLine}
                          onChange={() => setIsCreditLine(!isCreditLine)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Product Discounts */}
                    <div>
                      <h3 className="font-bold mb-2">הנחות למוצרים ספציפיים</h3>
                      <input
                        type="text"
                        placeholder="חפש מוצר לפי מזהה/שם"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border p-2 rounded w-full mb-2"
                      />
                      {searchQuery && (
                        <ul className="border rounded max-h-40 overflow-y-auto mb-2">
                          {filteredProducts.map((product) => (
                            <li
                              key={product._id}
                              onClick={() => handleAddProductDiscount(product)}
                              className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                            >
                              {product['תמונות'] && (
                                <div className="relative w-10 h-10 flex-shrink-0">
                                  <Image 
                                    src={product['תמונות']} 
                                    alt={`${product['שם']} - הנחה אישית | לבן גרופ`} 
                                    title={product['שם']} 
                                    fill
                                    className="object-cover rounded"
                                    sizes="40px"
                                  />
                                </div>
                              )}
                              <span>
                                {product['שם']} ({product.מזהה})
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {productDiscounts.map((discount, index) => (
                        <div key={index} className="border p-3 rounded mb-2 flex items-center gap-2">
                          <div className="flex-1">
                            <p className="font-semibold">
                              {discount.productName} ({discount.מזהה})
                            </p>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={discount.discount}
                              onChange={(e) => handleProductDiscountChange(index, 'discount', e.target.value)}
                              placeholder="אחוז הנחה"
                              className="border p-1 rounded w-full mt-1"
                            />
                          </div>
                          <button
                            onClick={() => handleRemoveProductDiscount(index)}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                          >
                            הסר
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <button
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full"
                  onClick={handleSaveChanges}
                >
                  שמור שינויים
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
