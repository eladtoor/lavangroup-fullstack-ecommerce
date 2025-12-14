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
import { FiShoppingCart } from 'react-icons/fi';
import { BadgeDollarSign, Truck, ShieldCheck, Headset } from 'lucide-react';

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
              לבן עבודות גמר
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              חומרי בניין ושיפוצים במחיר הטוב ביותר
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              מגוון רחב של מוצרים איכותיים | משלוחים מהירים | שירות מקצועי
            </p>
            
            {/* USPs - Simple Clean Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
              <div className="flex flex-col items-center p-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                  <BadgeDollarSign className="w-8 h-8 text-orange-600" strokeWidth={2} />
                </div>
                <h3 className="text-sm md:text-base font-semibold text-gray-900">מחיר מנצח</h3>
              </div>
              
              <div className="flex flex-col items-center p-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <Truck className="w-8 h-8 text-blue-600" strokeWidth={2} />
                </div>
                <h3 className="text-sm md:text-base font-semibold text-gray-900">משלוח מהיר</h3>
              </div>
              
              <div className="flex flex-col items-center p-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <ShieldCheck className="w-8 h-8 text-green-600" strokeWidth={2} />
                </div>
                <h3 className="text-sm md:text-base font-semibold text-gray-900">איכות מעולה</h3>
              </div>
              
              <div className="flex flex-col items-center p-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <Headset className="w-8 h-8 text-purple-600" strokeWidth={2} />
                </div>
                <h3 className="text-sm md:text-base font-semibold text-gray-900">שירות אישי</h3>
              </div>
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

      {/* Stats & Welcome Section */}
      <section className="bg-white py-12 border-b border-gray-200" aria-label="סטטיסטיקות אתר">
        <div className="container mx-auto px-4">
          <StatsCounters>
            <div className="absolute left-1/2 transform -translate-x-1/2 sm:pt-4">
              {user ? (
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  ברוך הבא, {user.name}
                </h2>
              ) : (
                <button
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 mt-3 sm:mt-0"
                  onClick={handleLoginClick}
                >
                  התחבר עכשיו
                </button>
              )}
            </div>
          </StatsCounters>
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
