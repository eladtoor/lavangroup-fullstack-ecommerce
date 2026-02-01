'use client';

import Link from 'next/link';
import { FaPhone, FaEnvelope, FaFacebook, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { useAppSelector } from '@/lib/redux/hooks';

export default function Footer() {
  const user = useAppSelector((state) => state.user?.user);
  
  return (
    <footer className="bg-gray-900 text-white py-6 text-center min-h-[300px] flex flex-col justify-between" dir="rtl">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        {/* עמודת יצירת קשר */}
        <div className="flex flex-col items-center">
          <h3 className="text-xl font-bold border-b-2 border-yellow-400 pb-1 mb-3">צור קשר 📞</h3>
          <p className="text-lg flex items-center gap-2">
            <FaPhone /> 050-5342813
          </p>
          <p className="text-lg flex items-center gap-2">
            <FaEnvelope />
            <a 
              href="mailto:Lavan1414@gmail.com" 
              title="שלח לנו מייל - Lavan1414@gmail.com"
              className="hover:text-yellow-400 transition"
            >
              Lavan1414@gmail.com
            </a>
          </p>
        </div>

        {/* עמודת קישורים */}
        <div className="flex flex-col items-center">
          <h3 className="text-xl font-bold border-b-2 border-yellow-400 pb-1 mb-3">קישורים מהירים 🔗</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/" title="חזור לדף הבית" className="text-lg hover:text-yellow-400 transition">
                דף הבית
              </Link>
            </li>
            <li>
              <Link href="/delivery-days" title="צפה בימי החלוקה שלנו לכל הארץ" className="text-lg hover:text-yellow-400 transition">
                ימי חלוקה
              </Link>
            </li>
            <li>
              <Link href="/cart" title="עבור לעגלת הקניות שלך" className="text-lg hover:text-yellow-400 transition">
                העגלה שלי
              </Link>
            </li>
            {user && (
              <li>
                <Link href="/user-profile" title="נהל את הפרופיל האישי שלך" className="text-lg hover:text-yellow-400 transition">
                  הפרופיל שלי
                </Link>
              </li>
            )}
            <li>
              <Link href="/terms" title="קרא את תנאי השימוש ומדיניות הפרטיות" className="text-lg hover:text-yellow-400 transition">
                תנאי שימוש ומדיניות פרטיות
              </Link>
            </li>
          </ul>
        </div>

        {/* עמודת רשתות חברתיות */}
        <div className="flex flex-col items-center">
          <h3 className="text-xl font-bold border-b-2 border-yellow-400 pb-1 mb-3">עקבו אחרינו 📱</h3>
          <div className="flex gap-4 text-3xl">
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              title="עקוב אחרינו בפייסבוק"
              aria-label="עמוד הפייסבוק של לבן גרופ"
              className="hover:text-yellow-400 hover:scale-110 transition"
              style={{ willChange: 'transform' }}
            >
              <FaFacebook />
            </a>
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              title="עקוב אחרינו באינסטגרם"
              aria-label="עמוד האינסטגרם של לבן גרופ"
              className="hover:text-yellow-400 hover:scale-110 transition"
              style={{ willChange: 'transform' }}
            >
              <FaInstagram />
            </a>
            <a
              href="https://wa.me/0505342813"
              target="_blank"
              rel="noopener noreferrer"
              title="שלח לנו הודעת וואטסאפ - 050-5342813"
              aria-label="פתח שיחת וואטסאפ עם לבן גרופ"
              className="hover:text-yellow-400 hover:scale-110 transition"
              style={{ willChange: 'transform' }}
            >
              <FaWhatsapp />
            </a>
          </div>
        </div>
      </div>

      {/* SEO Text */}
      <div className="max-w-6xl mx-auto px-6 mt-6 border-t border-gray-700 pt-4">
        <p className="text-xs text-gray-500 leading-relaxed text-center">
          לבן גרופ – ספק חומרי בניין לקבלנים, חברות בנייה ובונים פרטיים. צבעים, טיח, שפכטל, דבק קרמיקה, מוצרי איטום, לוחות גבס וחומרי גמר במחירי סיטונאי. מותגים מובילים: טמבור, קלסימו איקס, פוליסיד, סופרקריל. אספקה חינם בפריסה ארצית – תל אביב, ירושלים, חיפה, באר שבע, הרצליה, ראשון לציון, פתח תקווה, נתניה, אשדוד ועוד. ליווי טכני ויעוץ מקצועי ללא עלות.
        </p>
      </div>

      {/* זכויות יוצרים */}
      <p className="text-sm text-gray-400 mt-4 border-t border-gray-700 pt-3">
        &copy; {new Date().getFullYear()} Lavan Group. כל הזכויות שמורות.
      </p>
    </footer>
  );
}
