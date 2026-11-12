import Link from "next/link";
import { FaCheckCircle, FaTruck, FaUserTie, FaBuilding } from "react-icons/fa";

const ADVANTAGES = [
  { Icon: FaCheckCircle, title: "מחיר קבלן", text: "מחירי סיטונאי והנחות כמות – גם לבונים פרטיים." },
  { Icon: FaTruck, title: "אספקה לאתר", text: "אספקה חינם בפריסה ארצית, ישירות לאתר הבנייה." },
  { Icon: FaUserTie, title: "סוכן אישי", text: "מנהל חשבון אישי שמלווה אותך בכל הזמנה." },
  { Icon: FaBuilding, title: "ליווי טכני", text: "יועצים מומחים לבחירת חומרים ובניית מפרט." },
];

const STEPS = [
  { n: 1, title: "בוחרים חומרים", text: "מהקטלוג או לפי רשימה" },
  { n: 2, title: "מזינים כתובת", text: "של אתר הבנייה" },
  { n: 3, title: "קובעים מועד", text: "ואנחנו מספקים" },
];

export default function AboutUs() {
  return (
    <div className="w-full bg-white py-10 px-4 sm:py-12 sm:px-8 rounded-2xl shadow-md border border-gray-200 my-6 sm:my-10">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 border-b-4 border-primary pb-4 inline-block">
          אודותינו
        </h2>

        <p className="text-base sm:text-lg text-gray-700 mt-6 leading-relaxed max-w-3xl mx-auto">
          <strong>"לבן"</strong> – בית מסחר ארצי לצבעים וחומרי בניין מקבוצת{" "}
          <Link href="/lavan-group" title="על קבוצת LAVAN Group" className="font-bold text-primary hover:underline">
            LAVAN Group
          </Link>
          . אספקה ישירה מהיצרן והיבואן לאתרי הבנייה של קבלנים, חברות בנייה ובונים פרטיים.
        </p>

        {/* Advantages */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {ADVANTAGES.map(({ Icon, title, text }) => (
            <div key={title} className="flex flex-col items-center bg-gray-50 rounded-xl p-4 sm:p-5 border border-gray-100">
              <Icon className="text-primary text-3xl sm:text-4xl" aria-hidden="true" />
              <h3 className="text-base sm:text-xl font-bold text-gray-900 mt-3">{title}</h3>
              <p className="text-gray-600 text-sm sm:text-base mt-1">{text}</p>
            </div>
          ))}
        </div>

        {/* How to order */}
        <div className="mt-10">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">איך מזמינים?</h3>
          <ol className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <li key={s.n} className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100 text-right">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center">
                  {s.n}
                </span>
                <span>
                  <span className="block font-bold text-gray-900">{s.title}</span>
                  <span className="block text-sm text-gray-600">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              title="ייעוץ טכני והצעת מחיר לכמות"
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-full transition-colors"
            >
              הצעת מחיר לכמות / ייעוץ טכני
            </Link>
          </div>
        </div>

        {/* Detailed content – kept for search engines and curious readers, collapsed by default */}
        <details className="mt-10 text-right bg-gray-50 rounded-xl border border-gray-200 group">
          <summary className="cursor-pointer select-none list-none p-4 font-semibold text-gray-800 flex items-center justify-between">
            <span>למי אנחנו מתאימים, מותגים ואזורי אספקה</span>
            <span className="text-primary transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
          </summary>
          <div className="px-4 pb-6 text-base text-gray-700 leading-relaxed space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">קהל היעד שלנו</h3>
              <p className="mt-2">
                <strong>קבלנים:</strong> מחירי סיטונאי, הנחות כמות והזמנה סיטונאית של טיח, שפכטל, דבק קרמיקה,
                מוצרי איטום, לוחות גבס וחומרי גמר. אשראי מסגרת ותנאי תשלום נוחים.
              </p>
              <p className="mt-2">
                <strong>חברות בנייה:</strong> ליווי פרויקטים – ממפרט חומרים מותאם ועד אספקה ישירה לאתרי בנייה,
                תנאים מיוחדים לפרויקטים גדולים ומנהל חשבון אישי.
              </p>
              <p className="mt-2">
                <strong>בונים פרטיים:</strong> מחירי קבלן לבניית וילות ובתים – חומרי גמר, צבעי חוץ, איטום לגג
                שטוח וייעוץ בבחירת חומרים.
              </p>
              <p className="mt-2">
                <strong>אנשי רכש ומנהלי פרויקטים:</strong> הזמנה דיגיטלית, מעקב הזמנות והצעות מחיר סיטונאיות.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">המותגים שלנו</h3>
              <p className="mt-2">
                <strong>טמבור</strong> לצבעים ושליכט, <strong>קלסימו איקס</strong>, <strong>פוליסיד</strong>{" "}
                לפתרונות איטום, <strong>סופרקריל</strong> לשליכט חיצוני ועוד – במחירי סיטונאי.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">אזורי אספקה</h3>
              <p className="mt-2">
                משרדי <strong>"לבן"</strong> בהרצליה פיתוח. אספקה לכל הארץ: תל אביב, ירושלים, חיפה, באר שבע,
                הרצליה, ראשון לציון, פתח תקווה, נתניה, אשדוד, השרון, גוש דן, הצפון והדרום.
              </p>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
