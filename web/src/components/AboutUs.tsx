import { FaCheckCircle, FaTruck, FaUserTie, FaBuilding } from 'react-icons/fa';

export default function AboutUs() {
  return (
    <div className="w-full bg-gray-50 py-8 px-4 sm:py-12 sm:px-6 rounded-xl shadow-md border border-gray-200 my-6 sm:my-10">
      <div className="max-w-6xl mx-auto text-center">
        {/* כותרת ראשית */}
        <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 border-b-4 border-primary pb-4 inline-block">
          אודותינו
        </h2>

        {/* תיאור כללי */}
        <p className="text-base sm:text-lg text-gray-700 mt-6 leading-relaxed">
          <strong>ברוכים הבאים ל"לבן"</strong> – בית מסחר בפריסה ארצית לצבעים וחומרי בניין, מקבוצת <strong>LAVAN Group</strong>.
          <br />
          לבן מציעה פתרונות מותאמים אישית לקבלנים ולחברות בנייה, החל מליווי טכני עם צוות יועצים מומחים, דרך בניית מפרטי חומרים מותאמים, ועד אספקה ישירה מהיצרן או היבואן עד לאתרי הלקוחות.
        </p>

        {/* יתרון מרכזי */}
        <div className="mt-8 text-base sm:text-lg text-gray-800 font-semibold">
          <p>היתרון שלנו – קודם כל במחיר.</p>
          <p>אבל מעבר למחיר האטרקטיבי, אנחנו גאים בטכנולוגיה המתקדמת שלנו, המאפשרת לך לבצע את הזמנת החומרים בקלות ובמהירות דרך האפליקציה שלנו.</p>
          <p>באמצעות האפליקציה, תוכל לבחור את המוצרים שאתה זקוק להם, לצפות במחיר ובמפרט, ולבצע את ההזמנה בכל רגע נתון.</p>
        </div>

        {/* יתרונות עם אייקונים */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center">
            <FaCheckCircle className="text-primary text-3xl sm:text-4xl" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mt-2">מחיר מנצח</h3>
            <p className="text-gray-600 text-sm sm:text-base">אנחנו מתחייבים למחירים האטרקטיביים ביותר בשוק.</p>
          </div>

          <div className="flex flex-col items-center">
            <FaTruck className="text-primary text-3xl sm:text-4xl" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mt-2">אספקה מהירה</h3>
            <p className="text-gray-600 text-sm sm:text-base">אספקה חינם בפריסה ארצית היישר לאתר שלך.</p>
          </div>

          <div className="flex flex-col items-center">
            <FaUserTie className="text-primary text-3xl sm:text-4xl" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mt-2">שירות אישי</h3>
            <p className="text-gray-600 text-sm sm:text-base">מנהל חשבון אישי שילווה אותך בכל תהליך הרכש.</p>
          </div>

          <div className="flex flex-col items-center">
            <FaBuilding className="text-primary text-3xl sm:text-4xl" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mt-2">ליווי מקצועי</h3>
            <p className="text-gray-600 text-sm sm:text-base">יועצים מומחים ילוו אותך בבחירת המוצרים.</p>
          </div>
        </div>

        {/* הוראות ביצוע ההזמנה */}
        <div className="mt-12 bg-white shadow-md rounded-lg p-4 sm:p-6 max-w-4xl mx-auto text-right">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 border-b-2 border-primary pb-2">
            מה עליך לעשות?
          </h3>
          <ul className="text-base sm:text-lg text-gray-700 mt-4 leading-relaxed list-disc list-inside">
            <li><strong>מלא</strong> את רשימת החומרים המבוקשים</li>
            <li><strong>הזן</strong> את הכתובת למשלוח</li>
            <li><strong>ציין</strong> את מועד האספקה הרצוי</li>
          </ul>
          <p className="text-base sm:text-lg text-gray-700 mt-4">
            ההזמנה שלך תישלח ותתועד מיידית, וכל תהליך ההזמנה מתבצע בצורה נוחה ויעילה.
          </p>
        </div>

        {/* שירות אישי */}
        <div className="mt-8 text-base sm:text-lg text-gray-800 font-semibold">
          <p>ולא רק זה – עם <strong>"לבן"</strong> תמיד יש לך גישה לשירות אישי!</p>
          <p>בלחיצת כפתור, תוכל לקבל סיוע מקצועי ממנהל חשבון אישי, שמלווה אותך כלקוח רשום.</p>
        </div>

        {/* יתרונות נוספים */}
        <div className="mt-8 bg-white shadow-md rounded-lg p-4 sm:p-6 max-w-4xl mx-auto text-right">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 border-b-2 border-primary pb-2">
            אגב, האם כבר ידעת? לא רק המחיר אצלנו מנצח!
          </h3>
          <ul className="text-base sm:text-lg text-gray-700 mt-4 leading-relaxed list-disc list-inside">
            <li><strong>אספקה חינם!</strong></li>
            <li><strong>פריסה ארצית!</strong></li>
            <li><strong>יעוץ וליווי מקצועי</strong></li>
            <li><strong>סוכן אישי</strong></li>
          </ul>
        </div>

        {/* קהל יעד */}
        <div className="mt-8 text-right">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 border-b-2 border-primary pb-2 inline-block">
            קהל היעד שלנו:
          </h3>
          <ul className="text-base sm:text-lg text-gray-700 mt-4 leading-relaxed list-disc list-inside">
            <li>חברות בנייה מהמובילות בארץ</li>
            <li>קבלנים ובונים פרטיים</li>
            <li>אנשי רכש ומנהלי פרויקטים</li>
            <li>לקוחות פרטיים ולקוחות מזדמנים</li>
          </ul>
        </div>

        {/* מיקום החברה */}
        <div className="mt-8 text-base sm:text-lg text-gray-800 font-semibold">
          <p>
            משרדי חברת <strong>"לבן"</strong> ממוקמים בהרצליה פיתוח, אך צוות הסוכנים והיועצים שלנו פרוס בכל אזורי הארץ, תמיד בשטח ובתנועה, זמינים ונכונים להגיע ישירות אליך.
          </p>
        </div>
      </div>
    </div>
  );
}
