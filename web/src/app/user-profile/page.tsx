'use client';

import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Building2, Home, Hash, DoorOpen, Crown, Link as LinkIcon, Edit3, Save, X, Check } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { setUser } from '@/lib/redux/slices/userSlice';
import { fetchUserDataFromFirestore, updateUserDataInFirestore } from '@/utils/userUtils';

export default function UserProfile() {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.user?.user);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = user || JSON.parse(localStorage.getItem('user') || '{}');

        if (storedUser && storedUser.uid) {
          setFormData(storedUser);
        } else if (user?.uid || storedUser?.uid) {
          const userId = user?.uid || storedUser.uid;
          const userData = await fetchUserDataFromFirestore(userId);
          if (userData) {
            dispatch(setUser(userData));
            localStorage.setItem('user', JSON.stringify(userData));
            setFormData(userData);
          }
        }
      } catch (error) {
        console.error('שגיאה בטעינת נתוני המשתמש:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, dispatch]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing && formData) {
      setFormData({ ...formData });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData: any) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData: any) => ({
      ...prevData,
      address: {
        ...prevData?.address,
        [name]: value
      }
    }));
  };

  const handleCopyToClipboard = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      alert('הקישור הועתק ללוח!');
    }).catch((error) => {
      console.error('שגיאה בהעתקת הקישור: ', error);
    });
  };

  const handleSave = async () => {
    const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');

    if (!currentUser || !currentUser.uid) {
      alert('שגיאה: לא ניתן לשמור נתונים ללא חיבור משתמש.');
      return;
    }

    try {
      await updateUserDataInFirestore(currentUser.uid, formData);
      dispatch(setUser(formData));
      localStorage.setItem('user', JSON.stringify(formData));
      setIsEditing(false);
      alert('הנתונים נשמרו בהצלחה.');
    } catch (error) {
      console.error('שגיאה בשמירת נתוני המשתמש: ', error);
    }
  };

  const breadcrumbItems = [
    { label: 'דף הבית', href: '/' },
    { label: 'הפרופיל שלי' }
  ];

  if (loading) return (
      <p className="text-center mt-20 text-gray-700 text-lg">טוען נתונים...</p>
  );

  if (!formData) return (
      <p className="text-center mt-20 text-gray-700 text-lg">אין נתונים להציג. אנא התחבר.</p>
  );

  return (
      <main className="min-h-screen mb-32 font-sans pt-32 md:pt-36 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs items={breadcrumbItems} />
          
          {/* Profile Header */}
          <header className="bg-gradient-to-r from-gray-800 via-gray-900 to-slate-900 rounded-2xl shadow-xl p-8 mb-8 text-white">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                <User className="w-12 h-12 text-gray-800" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{formData.name}</h1>
                <p className="text-gray-300 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {formData.email}
                </p>
                {(formData.userType === 'סוכן' || formData.isAdmin) && (
                  <div className="flex gap-2 mt-3">
                    {formData.isAdmin && (
                      <span className="inline-flex items-center gap-1 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-semibold">
                        <Crown className="w-4 h-4" />
                        מנהל
                      </span>
                    )}
                    {formData.userType === 'סוכן' && (
                      <span className="inline-flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        <User className="w-4 h-4" />
                        סוכן
                      </span>
                    )}
                    {formData.isCreditLine && (
                      <span className="inline-flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        <Check className="w-4 h-4" />
                        אשראי מסגרת
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={handleEditToggle}
                className="bg-white text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 font-semibold shadow-lg"
              >
                {isEditing ? (
                  <>
                    <X className="w-5 h-5" />
                    ביטול
                  </>
                ) : (
                  <>
                    <Edit3 className="w-5 h-5" />
                    ערוך פרופיל
                  </>
                )}
              </button>
            </div>
          </header>

          {/* Profile Content Grid */}
          <section aria-label="מידע פרופיל" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Info Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-6 h-6 text-primary" />
                מידע אישי
              </h2>
              
              <div className="space-y-4">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">שם מלא</label>
                  {isEditing ? (
                    <div className="relative">
                      <User className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleInputChange}
                        className="w-full pr-10 pl-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="שם מלא"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900 font-medium">{formData.name}</span>
                    </div>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">טלפון</label>
                  {isEditing ? (
                    <div className="relative">
                      <Phone className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleInputChange}
                        className="w-full pr-10 pl-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="מספר טלפון"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900 font-medium" dir="ltr">{formData.phone}</span>
                    </div>
                  )}
                </div>

                {/* Email Field (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">אימייל</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 font-medium">{formData.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">

              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-primary" />
                כתובת משלוח
              </h2>
              
              <div className="space-y-4">
                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">עיר</label>
                  {isEditing ? (
                    <div className="relative">
                      <Building2 className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="city"
                        value={formData.address?.city || ''}
                        onChange={handleAddressChange}
                        className="w-full pr-10 pl-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="עיר"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900 font-medium">{formData.address?.city || 'לא צוין'}</span>
                    </div>
                  )}
                </div>

                {/* Street */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">רחוב</label>
                  {isEditing ? (
                    <div className="relative">
                      <MapPin className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="street"
                        value={formData.address?.street || ''}
                        onChange={handleAddressChange}
                        className="w-full pr-10 pl-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="רחוב"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900 font-medium">{formData.address?.street || 'לא צוין'}</span>
                    </div>
                  )}
                </div>

                {/* Apartment, Floor, Entrance in Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">דירה</label>
                    {isEditing ? (
                      <div className="relative">
                        <Home className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          name="apartment"
                          value={formData.address?.apartment || ''}
                          onChange={handleAddressChange}
                          className="w-full pr-9 pl-2 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                          placeholder="מס'"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Home className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 font-medium text-sm">{formData.address?.apartment || '-'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">קומה</label>
                    {isEditing ? (
                      <div className="relative">
                        <Hash className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          name="floor"
                          value={formData.address?.floor || ''}
                          onChange={handleAddressChange}
                          className="w-full pr-9 pl-2 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                          placeholder="מס'"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Hash className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 font-medium text-sm">{formData.address?.floor || '-'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">כניסה</label>
                    {isEditing ? (
                      <div className="relative">
                        <DoorOpen className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          name="entrance"
                          value={formData.address?.entrance || ''}
                          onChange={handleAddressChange}
                          className="w-full pr-9 pl-2 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                          placeholder="מס'"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <DoorOpen className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 font-medium text-sm">{formData.address?.entrance || '-'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Save Button (visible only when editing) */}
          {isEditing && (
            <div className="my-8 py-6 border-y border-gray-200 bg-white/50 rounded-xl">
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleEditToggle}
                  className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                  ביטול
                </button>
                <button
                  onClick={handleSave}
                  className="px-12 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-semibold flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  שמור שינויים
                </button>
              </div>
            </div>
          )}

          {/* Agent Referral Link */}
          {formData.userType === 'סוכן' && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border-2 border-blue-200 hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <LinkIcon className="w-6 h-6 text-blue-600" />
                קישור ההפניה שלך
              </h3>
              <p className="text-gray-600 mb-4">שתף קישור זה כדי להזמין לקוחות חדשים</p>

              {formData.uid && (
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="text"
                      value={`${window.location.origin}/login?ref=agent-${formData.uid}`}
                      readOnly
                      className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-mono"
                    />
                    <button
                      onClick={() => handleCopyToClipboard(`${window.location.origin}/login?ref=agent-${formData.uid}`)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold shadow-md hover:shadow-lg whitespace-nowrap"
                    >
                      <LinkIcon className="w-5 h-5" />
                      העתק
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    לקוחות שנרשמו דרך הקישור יקושרו אליך אוטומטית
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
  );
}
