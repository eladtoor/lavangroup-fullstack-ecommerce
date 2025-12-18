'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { maybeFetchProducts } from '@/lib/redux/actions/productActions';
import { maybeFetchCategories } from '@/lib/redux/actions/categoryActions';
import Category from '@/components/Category';
import StatsCounters from '@/components/StatsCounters';
import Carousel from '@/components/Carousel';
import AboutUs from '@/components/AboutUs';
import PersonalizedDiscounts from '@/components/PersonalizedDiscounts';
import RecommendedProducts from '@/components/RecommendedProducts';
import QuickCart from '@/components/QuickCart';
import FAQ from '@/components/FAQ';
import { FiShoppingCart, FiInfo } from 'react-icons/fi';

export default function HomePage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const categories = useAppSelector((state) => state.categories.categories);
  const user = useAppSelector((state) => state.user?.user);
  const [isQuickCartOpen, setIsQuickCartOpen] = useState(false);

  useEffect(() => {
    // Fetch products and categories with caching
    dispatch(maybeFetchProducts());
    dispatch(maybeFetchCategories());
  }, [dispatch]);

  const handleLoginClick = () => {
    router.push('/login');
  };

  return (
    <div className="overflow-x-hidden bg-gray-50" dir="rtl">
      {/* Hero Section - Clean White */}
      <section className="relative bg-white py-16 pt-36 md:pt-40 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <header className="text-center mb-10">
            {/* Eyebrow - Company name */}
            <div className="text-gray-600 font-semibold text-sm md:text-base mb-3 tracking-wide uppercase">
              Lavan Group
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              צבעים וחומרי בניין מהיצרן והיבואן ישירות ללקוח בשטח
            </h1>
            
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-8 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm md:text-base font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                הובלות חינם
                <button
                  className="relative inline-flex items-center justify-center w-5 h-5 text-green-600 hover:text-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 rounded-full group"
                  aria-label="מידע על הובלה חינם"
                >
                  <FiInfo className="w-4 h-4" />
                  {/* Tooltip - Enhanced */}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 px-4 py-3 text-sm font-medium text-white bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none whitespace-normal text-center z-50 border-2 border-green-400/50 backdrop-blur-sm transform group-hover:scale-105">
                    <span className="block font-bold mb-1 text-green-100">🚚 הובלה חינם</span>
                    <span className="block text-xs font-normal text-white/95">בהגעה להזמנת מינימום</span>
                    {/* Arrow - Enhanced */}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-6 border-transparent border-t-green-600 drop-shadow-lg"></span>
                    {/* Glow effect */}
                    <span className="absolute inset-0 rounded-xl bg-green-400/20 blur-xl -z-10"></span>
                  </span>
                </button>
              </span>
              <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm md:text-base font-medium">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                משלוחים מהירים
              </span>
              <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm md:text-base font-medium">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                שירות מקצועי
              </span>
            </div>
            
            {/* Stats & Welcome Grid */}
            <div className="max-w-5xl mx-auto">
              <StatsCounters>
                {user ? (
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    ברוך הבא, {user.name} 👋
                  </h2>
                ) : (
                  <button
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 px-10 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    onClick={handleLoginClick}
                  >
                    התחבר עכשיו
                  </button>
                )}
              </StatsCounters>
            </div>
          </header>
        </div>
      </section>

      {/* Carousel Section */}
      <section className="bg-gray-100 py-12 border-b border-gray-200" aria-label="מבצעים ודגשים">
        <div className="container mx-auto px-4">
          <Carousel />
        </div>
      </section>


      {/* Categories Section */}
      {(() => {
        // Helper to get categories array
        const getCategoriesArray = (cats: any): any[] => {
          if (Array.isArray(cats)) return cats;
          if (cats && typeof cats === 'object' && 'companyCategories' in cats) {
            const companyCats = cats.companyCategories;
            if (Array.isArray(companyCats)) return companyCats;
            if (companyCats && typeof companyCats === 'object') return Object.values(companyCats);
          }
          return [];
        };
        const getCompanyName = (cats: any): string => {
          if (cats && typeof cats === 'object' && 'companyName' in cats) {
            return cats.companyName || 'טמבור';
          }
          return 'טמבור';
        };
        const categoriesArray = getCategoriesArray(categories);
        const companyName = getCompanyName(categories);
        
        return categoriesArray.length > 0 ? (
          <section className="bg-gray-50 py-12 border-b border-gray-200" aria-label="קטגוריות מוצרים">
            <div className="container mx-auto px-4">
              <Category
                title={companyName}
                subcategories={categoriesArray}
              />
            </div>
          </section>
        ) : null;
      })()}

      {/* Products Section */}
      <section className="bg-white py-12 border-b border-gray-200">
        <div className="container mx-auto px-4">
          {user && user.productDiscounts && user.productDiscounts.length > 0 ? (
            <PersonalizedDiscounts />
          ) : (
            <RecommendedProducts />
          )}
        </div>
      </section>

      {/* About Us Section */}
      <section className="bg-gray-50 py-12 pb-16" aria-label="אודותינו">
        <div className="container mx-auto px-4">
          <AboutUs />
        </div>
      </section>

      {/* FAQ Section - Clean White */}
      <section className="bg-white py-12 border-b border-gray-200 fade-in-bottom" style={{ animationDelay: '1.2s' }}>
        <div className="container mx-auto px-4">
          <FAQ />
        </div>
      </section>

      {/* Floating Quick Cart Button */}
      {user && (
        <div className="fixed bottom-24 right-5 flex flex-col items-center gap-4 z-50">
          <button
            className="bg-gradient-to-br from-green-500 to-emerald-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 hover:shadow-green-500/50 transition-all duration-300"
            onClick={() => setIsQuickCartOpen(true)}
            title="פתח עגלה מהירה - הוסף מוצרים בקלות"
            aria-label="פתח את העגלה המהירה"
          >
            <FiShoppingCart size={32} />
          </button>
        </div>
      )}

      {/* Quick Cart Modal */}
      {isQuickCartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50" onClick={() => setIsQuickCartOpen(false)}>
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg relative" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center text-2xl transition-all"
              onClick={() => setIsQuickCartOpen(false)}
            >
              ×
            </button>
            <QuickCart />
          </div>
        </div>
      )}
    </div>
  );
}
