'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useAppSelector } from '@/lib/redux/hooks';
import RoleProtectedRoute from '@/components/RoleProtectedRoute';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function AgentDashboard() {
  return (
    <RoleProtectedRoute allowedRoles={['סוכן', 'agent']}>
      <AgentDashboardContent />
    </RoleProtectedRoute>
  );
}

function AgentDashboardContent() {
  const agent = useAppSelector((state) => state.user?.user);
  const products = useAppSelector((state) => state.products.products);

  const [referredUsers, setReferredUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [productDiscounts, setProductDiscounts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchReferredUsers = async () => {
      if (!agent || !agent.uid) return;
      try {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, where('referredBy', '==', agent.uid));
        const userDocs = await getDocs(q);
        const usersData = userDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setReferredUsers(usersData);
      } catch (error) {
        console.error('Error fetching referred users:', error);
      }
    };

    fetchReferredUsers();
  }, [agent]);

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
    setProductDiscounts(user.productDiscounts || []);
    setIsEditModalOpen(true);
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
        { productId: product._id, productName: product['שם'], discount: 0 },
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
        await updateDoc(userRef, { productDiscounts });
        const updatedUsers = referredUsers.map((user) =>
          user.id === selectedUser.id ? { ...user, productDiscounts } : user
        );
        setReferredUsers(updatedUsers);
        closeEditModal();
        alert('השינויים נשמרו בהצלחה!');
      } catch (error) {
        console.error('Error saving changes:', error);
        alert('שגיאה בשמירת השינויים');
      }
    }
  };

  const breadcrumbItems = [
    { label: 'דף הבית', href: '/' },
    { label: 'לוח בקרת סוכן' }
  ];

  return (
      <div className="min-h-screen container mx-auto px-4 py-8 pt-32 md:pt-36" dir="rtl">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl p-6 md:p-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center">
            משתמשים שנרשמו דרך הלינק שלך
          </h1>

          {referredUsers.length === 0 ? (
            <p className="text-center text-gray-600 py-10">אין משתמשים שנרשמו דרך הלינק שלך</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border border-gray-300 text-sm md:text-base">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 border">שם משתמש</th>
                    <th className="p-3 border">אימייל</th>
                    <th className="p-3 border">טלפון</th>
                    <th className="p-3 border">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {referredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="p-3 border text-center">{user.name}</td>
                      <td className="p-3 border text-center">{user.email}</td>
                      <td className="p-3 border text-center">{user.phone || 'לא זמין'}</td>
                      <td className="p-3 border text-center">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="bg-gray-900 text-white px-4 py-1 rounded hover:bg-primary transition"
                        >
                          עריכה
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={closeEditModal}
                className="absolute top-3 left-3 text-2xl text-gray-600 hover:text-black"
              >
                &times;
              </button>

              <div className="space-y-6">
                <h2 className="text-xl md:text-2xl font-bold text-center">
                  עריכת הנחות - {selectedUser?.name}
                </h2>

                <div>
                  <input
                    type="text"
                    placeholder="חפש מוצר לפי מזהה/שם"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border p-3 rounded-lg"
                  />

                  {searchQuery && (
                    <ul className="bg-gray-50 border border-gray-300 rounded-lg max-h-40 overflow-y-auto divide-y mt-2">
                      {filteredProducts.map((product) => (
                        <li
                          key={product._id}
                          onClick={() => handleAddProductDiscount(product)}
                          className="p-3 flex items-center cursor-pointer hover:bg-blue-100"
                        >
                          {product['תמונות'] && (
                            <div className="relative w-12 h-12 flex-shrink-0 ml-3">
                              <Image
                                src={product['תמונות']}
                                alt={`${product['שם']} - מוצר מומלץ לסוכן | לבן גרופ`}
                                title={product['שם']}
                                fill
                                className="rounded object-cover"
                                sizes="48px"
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
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                  {productDiscounts.length === 0 ? (
                    <p className="text-center text-gray-600 py-4">לא הוגדרו הנחות למוצרים</p>
                  ) : (
                    productDiscounts.map((discount, index) => (
                      <div key={index} className="border p-4 rounded-lg bg-gray-50">
                        <p className="mb-3">
                          מוצר: <strong>{discount.productName}</strong> ({discount.productId})
                        </p>
                        <div className="flex items-center gap-3">
                          <label className="w-32">אחוז הנחה:</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={discount.discount}
                            onChange={(e) => handleProductDiscountChange(index, 'discount', e.target.value)}
                            className="border p-2 rounded-lg flex-1"
                          />
                          <button
                            onClick={() => handleRemoveProductDiscount(index)}
                            className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                          >
                            הסר
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={handleSaveChanges}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition shadow"
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
