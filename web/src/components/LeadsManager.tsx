'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { adminFetch, adminGet } from '@/utils/adminApi';

/**
 * Admin "פניות" tab: leads from the site forms (technical consultation, soil testing,
 * real estate in Poland / Germany). Filter, change status, add notes, export to Excel (CSV).
 */

type Lead = {
  _id: string;
  source: string;
  status: string;
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  customerType?: string;
  topic?: string;
  interests?: string[];
  product?: string;
  quantity?: string;
  budget?: string;
  timeframe?: string;
  message?: string;
  marketingConsent?: boolean;
  notes?: string;
  pagePath?: string;
  utm?: { source?: string; campaign?: string };
  createdAt: string;
};

const SOURCES: Record<string, string> = {
  consult: 'ייעוץ טכני',
  drilling: 'בדיקות קרקע',
  poland: 'נדל״ן בפולין',
  germany: 'נדל״ן בגרמניה',
  general: 'כללי',
};
const STATUSES: Record<string, string> = { new: 'חדשה', in_progress: 'בטיפול', done: 'טופלה', irrelevant: 'לא רלוונטית' };
const STATUS_STYLE: Record<string, string> = {
  new: 'bg-orange-100 text-orange-800',
  in_progress: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
  irrelevant: 'bg-gray-100 text-gray-600',
};

export default function LeadsManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [source, setSource] = useState('');
  const [status, setStatus] = useState('');
  const [marketingOnly, setMarketingOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const query = useCallback(() => {
    const q = new URLSearchParams();
    if (source) q.set('source', source);
    if (status) q.set('status', status);
    if (marketingOnly) q.set('marketing', '1');
    const s = q.toString();
    return s ? `?${s}` : '';
  }, [source, status, marketingOnly]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminGet(`/api/leads${query()}`);
      if (!res.ok) throw new Error('שגיאה בטעינת הפניות');
      setLeads(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const update = async (id: string, patch: Partial<Pick<Lead, 'status' | 'notes'>>) => {
    try {
      const res = await adminFetch(`/api/leads/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      if (!res.ok) throw new Error('העדכון נכשל');
      const updated: Lead = await res.json();
      setLeads((xs) => xs.map((l) => (l._id === id ? updated : l)));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const exportCsv = async () => {
    try {
      const res = await adminGet(`/api/leads/export.csv${query()}`);
      if (!res.ok) throw new Error('הייצוא נכשל');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const newCount = leads.filter((l) => l.status === 'new').length;

  return (
    <div className="bg-white p-6 rounded shadow" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">
          פניות מהאתר {newCount > 0 && <span className="mr-2 rounded-full bg-orange-600 px-3 py-1 text-sm text-white">{newCount} חדשות</span>}
        </h2>
        <div className="flex gap-2">
          <button onClick={load} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">רענון</button>
          <button onClick={exportCsv} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">ייצוא לאקסל</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <label className="text-sm">
          <span className="block mb-1 font-semibold">מקור</span>
          <select value={source} onChange={(e) => setSource(e.target.value)} className="border rounded px-3 py-2">
            <option value="">הכול</option>
            {Object.entries(SOURCES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="block mb-1 font-semibold">סטטוס</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-3 py-2">
            <option value="">הכול</option>
            {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm pb-2">
          <input type="checkbox" checked={marketingOnly} onChange={(e) => setMarketingOnly(e.target.checked)} />
          רק מי שהסכים לדיוור
        </label>
      </div>

      {error && <p className="text-red-700 mb-4" role="alert">{error}</p>}
      {loading ? (
        <p className="text-gray-500">טוען…</p>
      ) : leads.length === 0 ? (
        <p className="text-gray-500">אין פניות להצגה.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-right text-sm border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 border-b">תאריך</th>
                <th className="p-3 border-b">מקור</th>
                <th className="p-3 border-b">שם</th>
                <th className="p-3 border-b">טלפון</th>
                <th className="p-3 border-b">אימייל</th>
                <th className="p-3 border-b">תחום / עניין</th>
                <th className="p-3 border-b">דיוור</th>
                <th className="p-3 border-b">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <Fragment key={l._id}>
                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setOpen(open === l._id ? null : l._id)}>
                    <td className="p-3 border-b whitespace-nowrap">{new Date(l.createdAt).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="p-3 border-b whitespace-nowrap">{SOURCES[l.source] || l.source}</td>
                    <td className="p-3 border-b font-semibold">{l.name}</td>
                    <td className="p-3 border-b whitespace-nowrap" dir="ltr">{l.phone && <a href={`tel:${l.phone}`} onClick={(e) => e.stopPropagation()} className="text-blue-700 underline">{l.phone}</a>}</td>
                    <td className="p-3 border-b">{l.email && <a href={`mailto:${l.email}`} onClick={(e) => e.stopPropagation()} className="text-blue-700 underline">{l.email}</a>}</td>
                    <td className="p-3 border-b">{l.topic || (l.interests || []).join(', ') || l.product}</td>
                    <td className="p-3 border-b">{l.marketingConsent ? 'כן' : '—'}</td>
                    <td className="p-3 border-b" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={l.status}
                        onChange={(e) => update(l._id, { status: e.target.value })}
                        className={`rounded px-2 py-1 font-semibold ${STATUS_STYLE[l.status] || ''}`}
                        aria-label={`סטטוס הפנייה של ${l.name}`}
                      >
                        {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                  </tr>
                  {open === l._id && (
                    <tr className="bg-gray-50">
                      <td colSpan={8} className="p-4 border-b">
                        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-3">
                          {[
                            ['עיר / מיקום', l.city],
                            ['סוג לקוח', l.customerType],
                            ['מוצר', l.product],
                            ['כמות', l.quantity],
                            ['תקציב', l.budget],
                            ['מועד', l.timeframe],
                            ['תחומי עניין', (l.interests || []).join(', ')],
                            ['עמוד', l.pagePath],
                            ['קמפיין', [l.utm?.source, l.utm?.campaign].filter(Boolean).join(' / ')],
                          ]
                            .filter(([, v]) => v)
                            .map(([k, v]) => (
                              <div key={k as string}><dt className="text-gray-500 text-xs">{k}</dt><dd>{v}</dd></div>
                            ))}
                        </dl>
                        {l.message && <p className="mt-3 whitespace-pre-wrap"><span className="text-gray-500 text-xs block">הודעה</span>{l.message}</p>}
                        <label className="block mt-3 text-sm">
                          <span className="text-gray-500 text-xs block mb-1">הערות פנימיות</span>
                          <textarea
                            defaultValue={l.notes}
                            onBlur={(e) => e.target.value !== (l.notes || '') && update(l._id, { notes: e.target.value })}
                            rows={2}
                            className="w-full border rounded px-3 py-2"
                            placeholder="נשמר אוטומטית כשיוצאים מהשדה"
                          />
                        </label>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
