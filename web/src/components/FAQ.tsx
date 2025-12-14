'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: 'האם יש משלוח חינם?',
    answer: 'כן! אנחנו מספקים משלוח חינם (בהגעה לסכום הזמנת מינימום המופיעה באתר) לכל רחבי הארץ. המשלוח מבוצע ישירות לאתר הבנייה שלך בימים שנקבעו מראש (בכפוף לימי חלוקה אזורים).'
  },
  {
    question: 'מה זמני האספקה?',
    answer: 'זמני האספקה משתנים בהתאם לאזור. ניתן לצפות בימי החלוקה המלאים בעמוד "ימי חלוקה". בדרך כלל, אספקה מתבצעת תוך 1-3 ימי עסקים מרגע אישור ההזמנה.'
  },
  {
    question: 'האם אפשר לקבל הנחה על הזמנה גדולה?',
    answer: 'כן! אנחנו מעניקים הנחות מיוחדות על הזמנות גדולות ועל ליווי מלא של פרויקטים לקבלנים וחברות בניה. צור קשר עם נציג השירות שלנו בטלפון או בוואטסאפ לקבלת הצעת מחיר מותאמת אישית.'
  },
  {
    question: 'אילו אמצעי תשלום אתם מקבלים?',
    answer: 'אנחנו מקבלים תשלום בכרטיס אשראי דרך מערכת תשלום מאובטחת. ללקוחות עסקיים וסוכנים ישנה אפשרות לאשראי מסגרת לאחר תהליך אישור וקליטת העסק / המבקש.'
  },
  {
    question: 'מה עושים אם קיבלתי מוצר פגום?',
    answer: 'במקרה של מוצר פגום או לא תקין, יש ליצור קשר איתנו תוך 48 שעות מקבלת המשלוח. תחילה נאמת את פרטי הפניה, במידת הצורך נשלח נציג מטעמו נבצע החלפה מיידית או החזר כספי מלא, לפי בחירתך.'
  },
  {
    question: 'האם המחירים באתר כוללים מע״מ?',
    answer: 'כן, המחיר המוצג לתשלום בסל הקניות כולל מע״מ. המחיר שאתה רואה הוא המחיר הסופי שתשלם.'
  },
  {
    question: 'איך אני יכול לעקוב אחר ההזמנה שלי?',
    answer: 'לאחר ביצוע ההזמנה, תוכל לעקוב אחריה בעמוד "ההזמנות שלי" בפרופיל המשתמש. שם תראה את סטטוס ההזמנה, תאריך אספקה משוער, ופרטים נוספים.'
  },
  {
    question: 'מה זה אשראי מסגרת?',
    answer: 'אשראי מסגרת היא אפשרות תשלום דחוי ללקוחות פרטיים ועסקיים שעברו ואושרו בתהליך קליטה ואישור אשראי. במקום לשלם מיידית, ניתן לקבל חשבונית עם תנאי תשלום של 30/60 יום, בהתאם להסכם.'
  },
  {
    question: 'האם אפשר להזמין דוגמאות צבעים?',
    answer: 'כן! ניתן להזמין דוגמאות צבעים קטנות לפני רכישת כמות גדולה. צור קשר עם נציג השירות שלנו והוא יסייע לך בהזמנת הדוגמאות. בהזמנת שליכט מינרלי ואקרילי תהיה אפשרות גם לקבל דוגמא על הקיר / לוח עץ קטן בטרם אישור והזמנת הגוון - ללא עלות ובהתאם לזמינות.'
  },
  {
    question: 'יש לכם יועצים טכניים?',
    answer: 'בהחלט! יש לנו צוות יועצים מומחים שיכולים לעזור בבניית מפרט חומרים, בחירת המוצרים המתאימים לפרויקט שלך, והמלצות מקצועיות. השירות ניתן ללא עלות נוספת.'
  },
  {
    question: 'מה קורה אם אני צריך לבטל הזמנה?',
    answer: 'ניתן לבטל הזמנה ובתנאי שהיא לא נכנסה לתהליך האספקה והגיוון. במקרים כאלו מומלץ גם לפנות מיד לשירות הלקוחות שלנו.'
  },
  {
    question: 'האם אתם עובדים עם חברות בנייה גדולות?',
    answer: 'כן! אנחנו עובדים עם חברות בנייה מהמובילות בארץ, קבלנים ובונים פרטיים ומלווים פרויקטים מגוונים ברחבי הארץ. אנחנו מציעים תנאים מיוחדים לפרויקטים גדולים וליווי צמוד לכל אורך הפרויקט.'
  },
  {
    question: 'איך אני יכול ליצור איתכם קשר?',
    answer: 'ניתן ליצור קשר דרך הטלפון 050-5342813, וואטסאפ, או במייל Lavan1414@gmail.com. אנחנו זמינים בימי ראשון-חמישי בשעות 08:00-18:00.'
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // JSON-LD Schema for SEO
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <section className="w-full bg-white py-12 px-4 rounded-xl shadow-md border border-gray-200" dir="rtl">
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Header */}
      <header className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 border-b-4 border-primary pb-4 inline-block">
          שאלות נפוצות
        </h2>
        <p className="text-gray-600 mt-4 text-lg">
          מצא תשובות לשאלות הנפוצות ביותר
        </p>
      </header>

      {/* FAQ Items */}
      <div className="max-w-4xl mx-auto space-y-4">
        {faqData.map((item, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden hover:border-primary transition-colors"
          >
            <button
              onClick={() => toggleQuestion(index)}
              className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 transition-colors text-right"
              aria-expanded={openIndex === index}
              aria-controls={`faq-answer-${index}`}
            >
              <h3 className="text-lg font-semibold text-gray-900 flex-1">
                {item.question}
              </h3>
              <ChevronDown
                className={`w-6 h-6 text-primary transition-transform flex-shrink-0 mr-4 ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            <div
              id={`faq-answer-${index}`}
              className={`overflow-hidden transition-all duration-300 ${
                openIndex === index ? 'max-h-96' : 'max-h-0'
              }`}
            >
              <div className="p-5 bg-white border-t border-gray-200">
                <p className="text-gray-700 leading-relaxed">{item.answer}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="text-center mt-10 pt-8 border-t border-gray-200">
        <p className="text-gray-700 text-lg mb-4">
          לא מצאת את מה שחיפשת?
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="tel:050-5342813"
            className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-semibold"
          >
            <i className="fas fa-phone"></i>
            050-5342813
          </a>
          <a
            href="https://wa.me/0505342813"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold"
          >
            <i className="fab fa-whatsapp"></i>
            שלח הודעה בוואטסאפ
          </a>
        </div>
      </div>
    </section>
  );
}

