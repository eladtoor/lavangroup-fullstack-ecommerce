"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import { maybeFetchProducts } from "@/lib/redux/actions/productActions";
import { maybeFetchCategories } from "@/lib/redux/actions/categoryActions";
import { FiShoppingCart } from "react-icons/fi";

// Code split non-critical components to reduce initial bundle size
// These components are below the fold and can be loaded lazily
const Category = dynamic(() => import("@/components/Category"), {
  ssr: true, // Important for SEO
});
const StatsCounters = dynamic(() => import("@/components/StatsCounters"), {
  ssr: true,
});
const CarouselWrapper = dynamic(() => import("@/components/CarouselWrapper"), {
  ssr: true, // Hero carousel is important
});
const AboutUs = dynamic(() => import("@/components/AboutUs"), {
  ssr: true,
});
const PersonalizedDiscounts = dynamic(
  () => import("@/components/PersonalizedDiscounts"),
  {
    ssr: false, // User-specific, can be client-only
  },
);
const RecommendedProducts = dynamic(
  () => import("@/components/RecommendedProducts"),
  {
    ssr: true, // Important for SEO
  },
);
const QuickCart = dynamic(() => import("@/components/QuickCart"), {
  ssr: false, // Interactive component, client-only
});
const FAQ = dynamic(() => import("@/components/FAQ"), {
  ssr: true, // Important for SEO
});

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
    router.push("/login");
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
                חומרי בניין וצבעים במחירי קבלן
              </span>
              <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm md:text-base font-medium">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                אספקה חינם לאתר הבניה
              </span>
              <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm md:text-base font-medium">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                ליווי טכני ויעוץ מקצועי
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
                    style={{ willChange: "transform" }}
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
      <section
        className="bg-gray-100 py-12 border-b border-gray-200"
        aria-label="מבצעים ודגשים"
      >
        <div className="container mx-auto px-4">
          <CarouselWrapper />
        </div>
      </section>

      {/* Categories Section */}
      {(() => {
        // Helper to get categories array
        const getCategoriesArray = (cats: any): any[] => {
          if (Array.isArray(cats)) return cats;
          if (cats && typeof cats === "object" && "companyCategories" in cats) {
            const companyCats = cats.companyCategories;
            if (Array.isArray(companyCats)) return companyCats;
            if (companyCats && typeof companyCats === "object")
              return Object.values(companyCats);
          }
          return [];
        };
        const getCompanyName = (cats: any): string => {
          if (cats && typeof cats === "object" && "companyName" in cats) {
            return cats.companyName || "טמבור";
          }
          return "טמבור";
        };
        const categoriesArray = getCategoriesArray(categories);
        const companyName = getCompanyName(categories);

        return categoriesArray.length > 0 ? (
          <section
            className="bg-gray-50 py-12 border-b border-gray-200"
            aria-label="קטגוריות מוצרים"
          >
            <div className="container mx-auto px-4">
              <Category title={companyName} subcategories={categoriesArray} />
            </div>
          </section>
        ) : null;
      })()}

      {/* Products Section */}
      <section
        className="bg-white py-12 border-b border-gray-200"
        style={{ contentVisibility: "auto" }}
      >
        <div className="container mx-auto px-4">
          {user && user.productDiscounts && user.productDiscounts.length > 0 ? (
            <PersonalizedDiscounts />
          ) : (
            <RecommendedProducts />
          )}
        </div>
      </section>

      {/* About Us Section */}
      <section
        className="bg-gray-50 py-12 pb-16"
        aria-label="אודותינו"
        style={{ contentVisibility: "auto" }}
      >
        <div className="container mx-auto px-4">
          <AboutUs />
        </div>
      </section>

      {/* FAQ Section - Clean White */}
      <section
        className="bg-white py-12 border-b border-gray-200"
        style={{ contentVisibility: "auto" }}
      >
        <div className="container mx-auto px-4">
          <FAQ />
        </div>
      </section>

      {/* Floating Quick Cart Button */}
      {user && (
        <div className="fixed bottom-20 left-4 flex flex-col items-center gap-4 z-50">
          <button
            className="bg-gradient-to-br from-green-500 to-emerald-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 hover:shadow-green-500/50 transition-all duration-300"
            style={{ willChange: "transform" }}
            onClick={() => setIsQuickCartOpen(true)}
            title="פתח עגלה מהירה - הוסף מוצרים בקלות"
            aria-label="פתח את העגלה המהירה"
          >
            <FiShoppingCart size={26} />
          </button>
        </div>
      )}

      {/* Quick Cart Modal */}
      {isQuickCartOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50"
          onClick={() => setIsQuickCartOpen(false)}
        >
          <div
            className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg relative"
            onClick={(e) => e.stopPropagation()}
          >
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
