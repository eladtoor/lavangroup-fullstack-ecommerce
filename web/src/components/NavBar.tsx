'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { logoutUser } from '@/lib/redux/slices/userSlice';
// Font Awesome CSS is loaded in layout.tsx with optimization
import TranslateButton from './TranslateButton';
import { buildCategoryUrl } from '@/lib/category-slugs';

// Helper to get categories array from different structures
function getCategoriesArray(categories: any): any[] {
  if (Array.isArray(categories)) {
    return categories;
  }
  if (categories && typeof categories === 'object' && 'companyCategories' in categories) {
    const companyCats = categories.companyCategories;
    if (Array.isArray(companyCats)) {
      return companyCats;
    }
    if (companyCats && typeof companyCats === 'object') {
      return Object.values(companyCats);
    }
  }
  return [];
}

function getCompanyName(categories: any): string {
  if (categories && typeof categories === 'object' && 'companyName' in categories) {
    return categories.companyName || 'טמבור';
  }
  return 'טמבור';
}

export default function NavBar() {
  const categories = useAppSelector((state) => state.categories.categories);
  const user = useAppSelector((state) => state.user?.user);
  
  const categoriesArray = getCategoriesArray(categories);
  const companyName = getCompanyName(categories);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [loadingUser, setLoadingUser] = useState(true);
  const [isDesktop, setIsDesktop] = useState(true);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => setLoadingUser(false));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setSearchVisible(false);
  }, [pathname, searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchError('נא להזין מוצר');
      return;
    }
    setSearchError('');
    router.push(`/search?query=${encodeURIComponent(searchQuery)}`);
    setSearchQuery('');
    if (isDesktop) setSearchVisible(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      dispatch(logoutUser());
      localStorage.removeItem('user');
      router.push('/');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return (
    <header className="fixed top-0 w-full z-40 shadow-lg text-xl bg-gray-900 overflow-visible">
      {/* Top Bar - Logo + Search + Icons */}
      <div className="flex items-center justify-between gap-4 px-4 md:px-8 py-3 mx-auto relative border-b border-gray-700">
        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white text-2xl p-2"
          onClick={toggleMenu}
        >
          <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>

        {/* Logo - Smaller */}
        <Link href="/" title="חזור לדף הבית - לבן גרופ חומרי בניין" className="flex-shrink-0">
          <div className="relative h-10 md:h-12 w-24 md:w-32 bg-white rounded px-2 py-1">
            <Image
              src="/logo.png"
              alt="לבן גרופ"
              title="לבן גרופ - דף הבית"
              fill
              className="object-contain"
              priority
              sizes="(max-width: 768px) 96px, 128px"
            />
          </div>
        </Link>

        {/* Desktop Search Bar - Always Visible */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-3xl mx-4">
          <div className="flex w-full">
            <input
              type="text"
              placeholder="חפש מוצרים..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 rounded-r-lg border-none focus:ring-2 focus:ring-orange-500 text-gray-900 text-base"
              dir="rtl"
            />
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-l-lg transition-colors flex items-center justify-center"
            >
              <i className="fa fa-search text-lg"></i>
            </button>
          </div>
        </form>

        {/* Desktop Icons - Right Side */}
        <div className="hidden md:flex justify-end items-center gap-6 flex-shrink-0 ml-8">
          <TranslateButton />

          {!loadingUser && user ? (
            <div className="relative group">
              <button className="text-white hover:text-orange-500 text-2xl">
                <i className="fa fa-user"></i>
              </button>
              <div className="absolute top-full right-1/2 translate-x-1/2 mt-0 hidden group-hover:block bg-gray-900 backdrop-blur-sm pt-2 p-4 shadow-xl rounded-lg z-50 border border-gray-700 min-w-[200px]">
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => router.push('/user-profile')}
                    className="text-lg text-white hover:bg-black px-4 py-3 rounded transition-colors border border-transparent hover:border-gray-300 whitespace-nowrap"
                  >
                    הפרופיל שלי
                  </button>
                  <button
                    onClick={() => router.push('/my-orders')}
                    className="text-lg text-white hover:bg-black px-4 py-3 rounded transition-colors border border-transparent hover:border-gray-300 whitespace-nowrap"
                  >
                    ההזמנות שלי
                  </button>
                  {user.userType === 'סוכן' && (
                    <button
                      onClick={() => router.push('/agent-dashboard')}
                      className="text-lg text-white hover:bg-black px-4 py-3 rounded transition-colors border border-transparent hover:border-gray-300 whitespace-nowrap"
                    >
                      ניהול לקוחות
                    </button>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="text-lg text-white hover:bg-black px-4 py-3 rounded transition-colors border border-transparent hover:border-gray-300 whitespace-nowrap"
                  >
                    התנתק
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link href="/login" className="text-white hover:text-red-600 text-2xl">
              <i className="fa fa-user"></i>
            </Link>
          )}

          {user?.isAdmin && (
            <div className="relative group">
              <button className="text-white hover:text-orange-500 text-2xl">
                <i className="fa fa-cogs"></i>
              </button>
              <div className="absolute top-full right-1/2 translate-x-1/2 mt-0 hidden group-hover:block bg-gray-900 backdrop-blur-sm pt-2 p-4 shadow-xl rounded-lg z-50 border border-gray-700 min-w-[200px]">
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => router.push('/admin-panel')}
                    className="text-lg text-white hover:bg-black px-4 py-3 rounded transition-colors border border-transparent hover:border-gray-300 whitespace-nowrap"
                  >
                    עריכת מוצרים
                  </button>
                  <button
                    onClick={() => router.push('/user-management')}
                    className="text-lg text-white hover:bg-black px-4 py-3 rounded transition-colors border border-transparent hover:border-gray-300 whitespace-nowrap"
                  >
                    ניהול משתמשים
                  </button>
                  <button
                    onClick={() => router.push('/order-management')}
                    className="text-lg text-white hover:bg-black px-4 py-3 rounded transition-colors border border-transparent hover:border-gray-300 whitespace-nowrap"
                  >
                    ניהול הזמנות
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => router.push('/cart')}
            className="text-white hover:text-orange-500 text-2xl"
          >
            <i className="fa fa-shopping-cart"></i>
          </button>
        </div>

        {/* Mobile Icons */}
        <div className="flex md:hidden items-center gap-4">
          <button
            onClick={() => setSearchVisible(!searchVisible)}
            className="text-white text-xl"
          >
            <i className="fa fa-search"></i>
          </button>
          <button
            onClick={() => router.push('/cart')}
            className="text-white text-xl"
          >
            <i className="fa fa-shopping-cart"></i>
          </button>
        </div>
      </div>

      {/* Categories Bar - Desktop Only */}
      <nav className="hidden md:block bg-gray-800 border-t border-gray-700">
        <div className="px-4 md:px-8 py-2">
          <div className="flex items-center gap-1">
            <Link
              href="/"
              title="חזור לדף הבית"
              className="flex items-center gap-2 px-4 py-2 text-white hover:bg-gray-700 rounded transition-colors whitespace-nowrap font-semibold"
            >
              <i className="fas fa-home"></i>
              דף הבית
            </Link>
            <span className="text-gray-500">|</span>
            
            {/* Main Category with Mega Menu */}
            {categoriesArray.length > 0 && (
              <div className="relative group">
                <button className="px-4 py-2 text-white hover:bg-gray-700 rounded transition-colors whitespace-nowrap font-semibold flex items-center gap-2">
                  {companyName}
                  <i className="fas fa-chevron-down text-xs group-hover:rotate-180 transition-transform"></i>
                </button>
                
                {/* Mega Menu - Full Width */}
                <div className="absolute top-full right-0 hidden group-hover:block bg-gray-800 shadow-2xl border-t-2 border-orange-500 z-50 min-w-[800px]">
                  <div className="grid grid-cols-4 gap-4 p-6">
                    {categoriesArray.map((category: any, idx) => (
                      <Link
                        key={idx}
                        href={buildCategoryUrl(companyName, category.categoryName)}
                        title={`עבור לקטגוריית ${category.categoryName} - מוצרים איכותיים במחירים מיוחדים`}
                        className="block px-4 py-3 text-white bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors border border-gray-600 hover:border-orange-500"
                      >
                        <div className="font-semibold mb-1">{category.categoryName}</div>
                        {category.subCategories && category.subCategories.length > 0 && (
                          <div className="text-xs text-gray-400">
                            {category.subCategories.length} תתי קטגוריות
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-full bg-black/50 transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleMenu}
      >
        <div
          className={`absolute right-0 top-20 h-[calc(100%-5rem)] w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          } overflow-y-auto`}
          onClick={(e) => e.stopPropagation()}
        >
            <div className="flex flex-col gap-4">
              <Link
                href="/"
                title="חזור לדף הבית"
                className="text-gray-900 font-bold bg-gray-100 border-b border-white py-3 px-4 text-center hover:bg-blue-900 hover:text-white transition-colors duration-300"
                onClick={toggleMenu}
              >
                דף הבית
              </Link>

            <div className="text-2xl font-bold text-center text-gray-800 border-b-2 border-gray-300 pb-4">
              {categories?.companyName || 'טמבור'}
            </div>

            <div className="border-b border-gray-200 pb-4">
              {categoriesArray.length > 0
                ? categoriesArray.map((category: any, idx) => (
                    <Link
                      key={idx}
                      href={buildCategoryUrl(companyName, category.categoryName)}
                      title={`עבור לקטגוריית ${category.categoryName}`}
                      className="block w-full text-lg text-gray-900 font-bold bg-gray-100 border-b border-white py-3 px-4 text-center hover:bg-blue-900 hover:text-white transition-colors duration-300"
                      onClick={toggleMenu}
                    >
                      {category.categoryName}
                    </Link>
                  ))
                : <p className="text-gray-900 font-bold text-center">אין קטגוריות זמינות</p>}
            </div>

            {/* Translation in Mobile Menu */}
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-gray-600 text-sm mb-2 text-center">בחר שפה:</p>
              <TranslateButton />
            </div>

            <div className="flex flex-col">
              {!loadingUser && user ? (
                <>
                  <Link
                    href="/user-profile"
                    title="עבור לפרופיל המשתמש שלי"
                    onClick={toggleMenu}
                    className="block w-full text-lg text-gray-900 font-bold bg-gray-100 border-b border-white py-3 px-4 text-center hover:bg-blue-900 hover:text-white transition-colors duration-300"
                  >
                    הפרופיל שלי
                  </Link>
                  <Link
                    href="/my-orders"
                    title="צפה בהיסטוריית ההזמנות שלך"
                    onClick={toggleMenu}
                    className="block w-full text-lg text-gray-900 font-bold bg-gray-100 border-b border-white py-3 px-4 text-center hover:bg-blue-900 hover:text-white transition-colors duration-300"
                  >
                    ההזמנות שלי
                  </Link>
                  {user.userType === 'סוכן' && (
                    <Link
                      href="/agent-dashboard"
                      title="ניהול לקוחות והזמנות הסוכן"
                      onClick={toggleMenu}
                      className="block w-full text-lg text-gray-900 font-bold bg-gray-100 border-b border-white py-3 px-4 text-center hover:bg-blue-900 hover:text-white transition-colors duration-300"
                    >
                      ניהול לקוחות
                    </Link>
                  )}
                  {user.isAdmin && (
                    <>
                      <Link
                        href="/admin-panel"
                        title="פאנל ניהול - עריכת מוצרים וקטגוריות"
                        onClick={toggleMenu}
                        className="block w-full text-lg text-gray-900 font-bold bg-gray-100 border-b border-white py-3 px-4 text-center hover:bg-blue-900 hover:text-white transition-colors duration-300"
                      >
                        עריכת מוצרים
                      </Link>
                      <Link
                        href="/user-management"
                        title="ניהול משתמשים - ערוך הרשאות והנחות"
                        onClick={toggleMenu}
                        className="block w-full text-lg text-gray-900 font-bold bg-gray-100 border-b border-white py-3 px-4 text-center hover:bg-blue-900 hover:text-white transition-colors duration-300"
                      >
                        ניהול משתמשים
                      </Link>
                      <Link
                        href="/order-management"
                        title="ניהול הזמנות - עקוב אחר כל ההזמנות"
                        onClick={toggleMenu}
                        className="block w-full text-lg text-gray-900 font-bold bg-gray-100 border-b border-white py-3 px-4 text-center hover:bg-blue-900 hover:text-white transition-colors duration-300"
                      >
                        ניהול הזמנות
                      </Link>
                    </>
                  )}
                  <button
                    onClick={async () => {
                      await handleSignOut();
                      toggleMenu();
                    }}
                    className="block w-full text-lg text-gray-900 font-bold bg-gray-100 border-b border-white py-3 px-4 text-center hover:bg-blue-900 hover:text-white transition-colors duration-300"
                  >
                    התנתק
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  title="התחבר לחשבון שלך או הירשם"
                  onClick={toggleMenu}
                  className="block w-full text-lg text-gray-900 font-bold bg-gray-100 border-b border-white py-3 px-4 text-center hover:bg-blue-900 hover:text-white transition-colors duration-300"
                >
                  התחברות
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {searchVisible && (
        <div className="md:hidden flex justify-center items-center gap-4 py-4 px-4 bg-gray-800 border-t border-gray-700">
          <input
            type="text"
            placeholder="חפש מוצרים..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
            className="flex-1 px-4 py-2 rounded-r-lg border-none focus:ring-2 focus:ring-orange-500 text-gray-900 text-base"
            dir="rtl"
          />
          <button
            onClick={handleSearch}
            className="bg-orange-500 text-white px-6 py-2 rounded-l-lg"
          >
            <i className="fa fa-search"></i>
          </button>
          {searchError && (
            <p className="text-red-500 text-sm absolute top-full left-1/2 transform -translate-x-1/2">
              {searchError}
            </p>
          )}
        </div>
      )}
    </header>
  );
}
