import type { Metadata } from 'next';
import RealEstateLanding, { type RealEstateLandingContent } from '@/components/lavan/RealEstateLanding';

/*
 * Landing page: נדל"ן בפולין (LAVAN PL Sp. z o.o.).
 * Target searches: נדל"ן בפולין, רכישת דירה בפולין, השקעות בפולין, נדל"ן מניב בפולין,
 * ניהול נכסים בפולין, הזדמנויות נדל"ן בפולין, קשרי סחר ישראל פולין.
 * Project facts mirror /lavan-group/poland. Add new data (numbers, projects) in CONTENT.
 */

const PL = '/images/lavan-group/poland';

const CONTENT: RealEstateLandingContent = {
  path: '/real-estate-poland',
  country: 'פולין',
  kicker: 'LAVAN PL SP. Z O.O.',
  breadcrumb: 'נדל״ן בפולין',
  h1: 'נדל״ן בפולין: רכישת דירה, השקעות וניהול נכסים',
  intro:
    'LAVAN PL מאתרת, בונה ומנהלת נדל״ן למגורים ולמסחר בשלזיה – קטוביץ, גליביצה וזברז׳ה. שני פרויקטים כבר הושלמו ואוכלסו, ושניים נוספים בביצוע ובשיווק.',
  heroImage: { src: `${PL}/kato-facade-evening.webp`, alt: 'LAVAN KATO בקטוביץ', w: 1200, h: 900 },
  services: [
    { title: 'רכישת דירה בפולין', text: 'דירות להשקעה בפרויקטים של הקבוצה, עם רישום נפרד לכל יחידה וליווי עד המסירה.' },
    { title: 'נדל״ן מניב בפולין', text: 'דירות להשכרה לטווח קצר וארוך, ומלון דירות מניב – LAVAN KATO בקטוביץ.' },
    { title: 'ניהול נכסים בפולין', text: 'השכרה, קבלת אורחים, ניקיון, תחזוקה, גבייה ודיווח חודשי לבעלים – בידי צוות מקומי.' },
    { title: 'הזדמנויות נדל״ן', text: 'איתור, רכישה והשבחה של נכסים ומבנים, ושותפות בפרויקטים חדשים.' },
    { title: 'השקעות בפולין', text: 'השקעה בדירה בודדת, בקומה שלמה או כשותף בחברת הפרויקט – לפי היקף ומטרות המשקיע.' },
    { title: 'קשרי סחר ישראל–פולין', text: 'חיבור בין עסקים בישראל לשוק הפולני, דרך הפעילות המקומית של הקבוצה.' },
  ],
  whyTitle: 'למה פולין, ולמה איתנו',
  why: [
    'שוק נדל״ן בתוך האיחוד האירופי, עם רישום מקרקעין מסודר (Księga wieczysta).',
    'מטרופולין שלזיה: אזור עירוני גדול עם אוניברסיטאות, תעשייה ומשרדים, וביקוש קבוע לשכירות.',
    'מחירי כניסה נמוכים משמעותית מאלה שבישראל ובמערב אירופה.',
    'חברה אחת לכל השלבים: איתור, בנייה בניהול עצמי, השכרה וניהול – ובעלים שמדברים עברית.',
  ],
  steps: [
    { title: 'שיחת היכרות', text: 'מבינים את המטרה, את היקף ההשקעה ואת לוח הזמנים.' },
    { title: 'התאמת נכס', text: 'מציגים דירות ופרויקטים מתאימים, עם כרטיסי דירה ומחירים.' },
    { title: 'עסקה ורישום', text: 'החוזה והרישום נעשים בליווי עורך דין פולני.' },
    { title: 'השכרה וניהול', text: 'מי שרוצה מעביר את הנכס לניהול LAVAN, ומקבל דיווח שוטף.' },
  ],
  projects: [
    { name: 'LAVAN KATO', meta: 'קטוביץ · 26 דירות', status: 'בבנייה · אכלוס 04.2027', img: { src: `${PL}/kato-facade-evening.webp`, alt: 'LAVAN KATO, קטוביץ', w: 1200, h: 900 }, href: '/lavan-group/poland#kato' },
    { name: 'LAVAN WIDOK 12', meta: 'קטוביץ · 20 דירות', status: 'בשיווק · מסירה 05.2028', img: { src: `${PL}/widok12-apartment-card.webp`, alt: 'LAVAN WIDOK 12 – כרטיס דירה', w: 1536, h: 1024 }, href: '/lavan-group/poland#widok12' },
    { name: 'LAVAN GLIWICE', meta: 'גליביצה · 24 דירות', status: 'הושלם ואוכלס', img: { src: `${PL}/gliwice-render-1.webp`, alt: 'LAVAN GLIWICE', w: 1176, h: 713 }, href: '/lavan-group/poland#gliwice' },
    { name: 'Roosevelta 22 – LAVAN', meta: 'זברז׳ה · 24 דירות', status: 'הושלם ואוכלס', img: { src: `${PL}/zabrze-photo.webp`, alt: 'Roosevelta 22, זברז׳ה', w: 1400, h: 790 }, href: '/lavan-group/poland#zabrze' },
  ],
  projectsLink: { href: '/lavan-group/poland', label: 'כל הפרטים על הפרויקטים' },
  faq: [
    { q: 'אפשר לרכוש דירה בפולין כמשקיע מישראל?', a: 'כן, משקיעים מישראל רוכשים דירות בפולין. כל עסקה נעשית בליווי עורך דין פולני, שבודק את הנכס ואת דרישות הרישום הרלוונטיות למקרה שלכם.' },
    { q: 'מה ההבדל בין השכרה לטווח קצר לטווח ארוך?', a: 'השכרה קצרה (למשל דרך Booking) דורשת ניהול שוטף של אורחים, ניקיון ותפעול. השכרה ארוכה יציבה יותר ודורשת פחות ניהול. אנחנו מנהלים את שני הסוגים.' },
    { q: 'מי מנהל את הדירה אחרי הרכישה?', a: 'LAVAN PL מנהלת את הנכס עבור הבעלים: השכרה, תחזוקה, גבייה ודיווח חודשי.' },
    { q: 'באילו ערים אתם פועלים?', a: 'בשלזיה: קטוביץ, גליביצה וזברז׳ה.' },
  ],
  form: 'poland',
  formTitle: 'קבלת פרטים על השקעה בפולין',
  formLead: 'השאירו פרטים ונחזור אליכם עם דירות ופרויקטים שמתאימים לכם.',
};

export const metadata: Metadata = {
  title: 'נדל״ן בפולין – רכישת דירה, השקעות וניהול נכסים | LAVAN PL',
  description:
    'רכישת דירה בפולין, נדל״ן מניב, השקעות וניהול נכסים בקטוביץ, גליביצה וזברז׳ה. LAVAN PL – פרויקטים שהושלמו ואוכלסו, ניהול מקומי ובעלים שמדברים עברית.',
  keywords: ['נדל"ן בפולין', 'רכישת דירה בפולין', 'השקעות בפולין', 'נדל"ן מניב בפולין', 'ניהול נכסים בפולין', 'הזדמנויות נדל"ן בפולין', 'דירה להשקעה בפולין'],
  alternates: { canonical: CONTENT.path },
  openGraph: {
    title: 'נדל״ן בפולין – רכישת דירה, השקעות וניהול נכסים',
    description: 'דירות להשקעה, נדל״ן מניב וניהול נכסים בשלזיה, פולין. LAVAN PL.',
    url: CONTENT.path,
    type: 'website',
    locale: 'he_IL',
    images: [{ url: `${PL}/kato-facade-evening.webp`, width: 1200, height: 900, alt: 'LAVAN KATO, קטוביץ' }],
  },
};

export default function RealEstatePolandPage() {
  return <RealEstateLanding c={CONTENT} />;
}
