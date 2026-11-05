'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';

/**
 * LeadForm — one contact form for every lead source on the site:
 *   consult  – technical consultation (store)
 *   drilling – LAVAN Group Development & Drilling (soil testing)
 *   poland   – real estate / investment in Poland
 *   germany  – real estate / investment in Germany
 *
 * Posts to /api/leads. The server stores the lead and emails an alert to the orders inbox.
 * Marketing consent is a separate, unticked checkbox (Israeli anti-spam law requires
 * explicit opt-in before sending advertising). UTM tags and the page path are captured
 * for attribution. Reads the URL on submit (not useSearchParams) so pages stay static.
 */

export type LeadSource = 'consult' | 'drilling' | 'poland' | 'germany';
type Variant = 'store' | 'lavan';

type Config = {
  topicLabel?: string;
  topics?: string[];
  interestsLabel?: string;
  interests?: string[];
  showProduct?: boolean;
  cityLabel?: string;
  customerTypes?: string[];
  budgets?: string[];
  timeframes?: string[];
  messageLabel: string;
  submitLabel: string;
};

const CONFIG: Record<LeadSource, Config> = {
  consult: {
    topicLabel: 'בחרו תחום',
    topics: ['צבע לקירות פנים', 'צבע לקירות חוץ ושליכט', 'איטום', 'גבס ובידוד', 'דבקים וריצוף', 'טיח ומילוי', 'צבעים לעץ ולמתכת', 'צבעים תעשייתיים', 'אחר'],
    showProduct: true,
    cityLabel: 'עיר / מיקום האתר',
    customerTypes: ['קבלן / בעל מקצוע', 'חברת בנייה', 'רכש / מנהל פרויקט', 'בונה בית פרטי', 'לקוח פרטי'],
    messageLabel: 'במה נוכל לעזור?',
    submitLabel: 'שליחת פנייה לייעוץ',
  },
  drilling: {
    topicLabel: 'סוג הפרויקט',
    topics: ['בית פרטי / וילה', 'פרויקט יזמי / בניין מגורים', 'מבנה מסחרי / תעשייה', 'גוף ציבורי / מכרז', 'תשתיות', 'אחר'],
    cityLabel: 'מיקום האתר (עיר / יישוב)',
    customerTypes: ['יזם', 'קבלן', 'גוף ציבורי / ממשלתי', 'מהנדס / יועץ קרקע', 'בעל קרקע פרטי'],
    timeframes: ['בהקדם', 'תוך חודש', 'תוך 1–3 חודשים', 'בשלב תכנון'],
    messageLabel: 'פרטים על הפרויקט (גודל, גישה לשטח, דרישות המהנדס)',
    submitLabel: 'בקשת הצעת מחיר לבדיקת קרקע',
  },
  poland: {
    interestsLabel: 'מה מעניין אתכם?',
    interests: ['רכישת דירה להשקעה', 'נדל״ן מניב / בניין', 'דירה להשכרה לטווח קצר', 'ניהול נכס קיים בפולין', 'שותפות בפרויקט', 'קשרי סחר ישראל–פולין'],
    budgets: ['עד 500 אלף ₪', '500 אלף – 1 מיליון ₪', '1–3 מיליון ₪', 'מעל 3 מיליון ₪'],
    timeframes: ['בהקדם', 'תוך 3 חודשים', 'תוך שנה', 'בודק/ת אפשרויות'],
    messageLabel: 'ספרו לנו קצת על מה שאתם מחפשים',
    submitLabel: 'קבלת פרטים על השקעה בפולין',
  },
  germany: {
    interestsLabel: 'מה מעניין אתכם?',
    interests: ['פורטפוליו דירות להשקעה', 'רכישה ישירות מהבנקים', 'רכישת בניין שלם', 'הזדמנויות נדל״ן'],
    budgets: ['עד 250 אלף €', '250–500 אלף €', '500 אלף – 1 מיליון €', 'מעל 1 מיליון €'],
    timeframes: ['בהקדם', 'תוך 3 חודשים', 'תוך שנה', 'בודק/ת אפשרויות'],
    messageLabel: 'ספרו לנו קצת על מה שאתם מחפשים',
    submitLabel: 'קבלת פרטים על השקעה בגרמניה',
  },
};

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function LeadForm({
  source,
  variant = 'store',
  defaultProduct = '',
  heading,
}: {
  source: LeadSource;
  variant?: Variant;
  defaultProduct?: string;
  heading?: string;
}) {
  const cfg = CONFIG[source];
  const uid = useId();
  const id = (n: string) => `${uid}-${n}`;

  const [form, setForm] = useState({
    name: '', phone: '', email: '', city: '', customerType: '', topic: '', product: defaultProduct,
    quantity: '', budget: '', timeframe: '', message: '', website: '',
  });
  const [interests, setInterests] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  // Prefill the product when the form is opened from a product page (/contact?product=...).
  useEffect(() => {
    if (defaultProduct || !cfg.showProduct) return;
    const p = new URLSearchParams(window.location.search).get('product');
    if (p) setForm((f) => ({ ...f, product: p.slice(0, 200) }));
  }, [defaultProduct, cfg.showProduct]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleInterest = (v: string) =>
    setInterests((xs) => (xs.includes(v) ? xs.filter((x) => x !== v) : [...xs, v]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.phone.trim() && !form.email.trim()) return setError('נא למלא טלפון או אימייל');
    if (!privacy) return setError('יש לאשר את מדיניות הפרטיות');
    setState('sending');
    const qs = new URLSearchParams(window.location.search);
    try {
      const res = await fetch(`${API}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          source,
          interests,
          privacyConsent: true,
          marketingConsent: marketing,
          pagePath: window.location.pathname,
          utm: { source: qs.get('utm_source') || '', medium: qs.get('utm_medium') || '', campaign: qs.get('utm_campaign') || '' },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'שגיאה בשליחה');
      }
      setState('sent');
      // Google Tag Manager / GA4 conversion event, if the tag is installed.
      (window as any).dataLayer?.push({ event: 'generate_lead', lead_source: source });
    } catch (err: any) {
      setState('error');
      setError(err.message || 'שגיאה בשליחה. נא לנסות שוב או להתקשר 050-5342813');
    }
  };

  const lavan = variant === 'lavan';
  const box = lavan ? 'bg-white border border-[var(--lv-line)]' : 'bg-white border border-gray-200 rounded-2xl shadow-sm';
  const input = lavan
    ? 'w-full h-12 border border-[#c9bfab] bg-white px-3 text-base focus:outline-none focus:border-[var(--lv-gold)]'
    : 'w-full h-12 rounded-lg border border-gray-300 bg-white px-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-500';
  const label = 'block mb-1.5 text-sm font-medium text-gray-800';
  const button = lavan
    ? 'lv-btn w-full h-14 text-lg disabled:opacity-60'
    : 'w-full h-14 rounded-xl bg-orange-600 text-white text-lg font-semibold hover:bg-orange-700 transition disabled:opacity-60';

  if (state === 'sent') {
    return (
      <div className={`${box} p-8 text-center`} role="status" aria-live="polite">
        <p className="text-2xl font-bold text-gray-900">תודה! הפנייה התקבלה</p>
        <p className="mt-3 text-gray-700 leading-relaxed">נחזור אליכם בהקדם. לשאלה דחופה: <a href="tel:+972505342813" className="font-semibold underline" dir="ltr">050-5342813</a></p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={`${box} relative p-6 sm:p-8 space-y-5`} noValidate>
      {heading && <h2 className="text-2xl font-bold text-gray-900">{heading}</h2>}

      {/* Honeypot: hidden from people and screen readers; bots fill it. */}
      {/* Clipped in place (not pushed off-screen: a far offset widens the page in RTL). */}
      <div aria-hidden="true" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', clipPath: 'inset(50%)', whiteSpace: 'nowrap' }}>
        <label htmlFor={id('website')}>Website</label>
        <input id={id('website')} tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
      </div>

      {cfg.topics && (
        <div>
          <label htmlFor={id('topic')} className={label}>{cfg.topicLabel}</label>
          <select id={id('topic')} className={input} value={form.topic} onChange={set('topic')}>
            <option value="">בחירה…</option>
            {cfg.topics.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}

      {cfg.interests && (
        <fieldset>
          <legend className={label}>{cfg.interestsLabel}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {cfg.interests.map((t) => (
              <label key={t} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm cursor-pointer has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50">
                <input type="checkbox" checked={interests.includes(t)} onChange={() => toggleInterest(t)} className="h-4 w-4" />
                {t}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {cfg.showProduct && (
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <div>
            <label htmlFor={id('product')} className={label}>מוצר (לא חובה)</label>
            <input id={id('product')} className={input} value={form.product} onChange={set('product')} placeholder="למשל: דבק לאריחים 861" />
          </div>
          <div>
            <label htmlFor={id('quantity')} className={label}>כמות משוערת</label>
            <input id={id('quantity')} className={input} value={form.quantity} onChange={set('quantity')} placeholder="למשל: 40 שקים" />
          </div>
        </div>
      )}

      {(cfg.budgets || cfg.timeframes) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {cfg.budgets && (
            <div>
              <label htmlFor={id('budget')} className={label}>היקף השקעה משוער</label>
              <select id={id('budget')} className={input} value={form.budget} onChange={set('budget')}>
                <option value="">בחירה…</option>
                {cfg.budgets.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
          {cfg.timeframes && (
            <div>
              <label htmlFor={id('timeframe')} className={label}>מתי?</label>
              <select id={id('timeframe')} className={input} value={form.timeframe} onChange={set('timeframe')}>
                <option value="">בחירה…</option>
                {cfg.timeframes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={id('name')} className={label}>שם מלא *</label>
          <input id={id('name')} className={input} value={form.name} onChange={set('name')} required autoComplete="name" />
        </div>
        <div>
          <label htmlFor={id('phone')} className={label}>טלפון</label>
          <input id={id('phone')} className={input} value={form.phone} onChange={set('phone')} type="tel" inputMode="tel" autoComplete="tel" dir="ltr" style={{ textAlign: 'right' }} />
        </div>
        <div>
          <label htmlFor={id('email')} className={label}>אימייל</label>
          <input id={id('email')} className={input} value={form.email} onChange={set('email')} type="email" autoComplete="email" dir="ltr" style={{ textAlign: 'right' }} />
        </div>
        {cfg.customerTypes ? (
          <div>
            <label htmlFor={id('ctype')} className={label}>מי אתם?</label>
            <select id={id('ctype')} className={input} value={form.customerType} onChange={set('customerType')}>
              <option value="">בחירה…</option>
              {cfg.customerTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label htmlFor={id('city')} className={label}>עיר מגורים</label>
            <input id={id('city')} className={input} value={form.city} onChange={set('city')} autoComplete="address-level2" />
          </div>
        )}
        {cfg.cityLabel && (
          <div className="sm:col-span-2">
            <label htmlFor={id('city')} className={label}>{cfg.cityLabel}</label>
            <input id={id('city')} className={input} value={form.city} onChange={set('city')} />
          </div>
        )}
      </div>

      <div>
        <label htmlFor={id('message')} className={label}>{cfg.messageLabel}</label>
        <textarea id={id('message')} rows={3} className={`${input} h-auto py-2`} value={form.message} onChange={set('message')} maxLength={2000} />
      </div>

      <div className="space-y-2 text-sm text-gray-700">
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>קראתי ואני מסכים/ה ל<Link href="/terms" className="underline" target="_blank">מדיניות הפרטיות ותנאי השימוש</Link>, ולשמירת הפרטים לצורך טיפול בפנייה. *</span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>אשמח לקבל עדכונים, מבצעים והזדמנויות מקבוצת LAVAN במייל, ב-SMS ובוואטסאפ. אפשר להסיר בכל עת.</span>
        </label>
      </div>

      {error && <p className="text-red-700 font-medium" role="alert">{error}</p>}

      <button type="submit" className={button} disabled={state === 'sending'}>
        {state === 'sending' ? 'שולח…' : cfg.submitLabel}
      </button>
      <p className="text-xs text-gray-500">* שדות חובה. נדרש טלפון או אימייל.</p>
    </form>
  );
}
