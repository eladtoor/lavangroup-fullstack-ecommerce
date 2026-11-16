'use client';

/*
 * Admin tab "עדכון מחירים (Excel)".
 *  1. Export: downloads an .xlsx with every product (and every variation) and its prices.
 *  2. The admin edits only the price columns.
 *  3. Import: the file is compared with the live products; a before/after preview is shown,
 *     and nothing is saved until the admin confirms. The server re-checks every value
 *     (see bulkUpdatePrices in productController.js) and skips products that changed since.
 *
 * Rules for the file (also written on the "הוראות" sheet):
 *  - An empty price cell = no change. To remove a sale price, write 0.
 *  - Rows are matched by the "מזהה מערכת" + "מפתח וריאציה" columns, never by name.
 */

import { useState } from 'react';
import type ExcelJSType from 'exceljs';
import { adminPost } from '@/utils/adminApi';
import { useAppDispatch } from '@/lib/redux/hooks';
import { fetchProducts } from '@/lib/redux/actions/productActions';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type Attr = { value?: string; price?: number | string; salePrice?: number | string };
type Product = {
  _id: string;
  'מק"ט'?: string;
  שם: string;
  קטגוריות?: string;
  'מחיר רגיל'?: number | null;
  'מחיר מבצע'?: number | null;
  variations?: { attributes?: Record<string, Attr> }[];
};

type Field = 'regular' | 'sale' | 'variation' | 'variationSale';
type Diff = {
  id: string;
  name: string;
  label: string; // variation description or ''
  field: Field;
  varKey?: string; // `${index}|${attr}`
  before: number | null;
  after: number | null;
  warning?: string;
};
type RowError = { row: number; message: string };

const COLS = {
  name: 'שם מוצר',
  variant: 'וריאציה',
  sku: 'מק"ט',
  category: 'קטגוריה',
  regular: 'מחיר רגיל',
  sale: 'מחיר מבצע',
  id: 'מזהה מערכת',
  varKey: 'מפתח וריאציה',
};

const num = (v: unknown): number | null => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// Excel cells can hold numbers, strings ("₪ 1,250"), formulas or rich text.
function cellNumber(raw: unknown): { value: number | null; invalid: boolean } {
  let v: unknown = raw;
  if (v && typeof v === 'object') {
    const o = v as { result?: unknown; richText?: { text: string }[]; text?: string };
    if ('result' in o) v = o.result;
    else if (o.richText) v = o.richText.map((t) => t.text).join('');
    else if (typeof o.text === 'string') v = o.text;
  }
  if (v === undefined || v === null) return { value: null, invalid: false };
  if (typeof v === 'number') return { value: Number.isFinite(v) ? v : null, invalid: !Number.isFinite(v) };
  const s = String(v).replace(/[₪,\s]/g, '');
  if (s === '') return { value: null, invalid: false };
  const n = Number(s);
  return Number.isFinite(n) ? { value: n, invalid: false } : { value: null, invalid: true };
}

const cellText = (raw: unknown): string => {
  if (raw && typeof raw === 'object') {
    const o = raw as { result?: unknown; richText?: { text: string }[]; text?: string };
    if (o.richText) return o.richText.map((t) => t.text).join('');
    if (typeof o.text === 'string') return o.text;
    if ('result' in o) return String(o.result ?? '');
  }
  return raw === undefined || raw === null ? '' : String(raw).trim();
};

async function loadProducts(): Promise<Product[]> {
  const r = await fetch(`${API}/api/products/getAll`, { cache: 'no-store' });
  if (!r.ok) throw new Error('טעינת המוצרים נכשלה');
  const d = await r.json();
  return Array.isArray(d) ? d : d.products || d.data || [];
}

const loadExcel = async (): Promise<typeof ExcelJSType> => {
  const mod = await import('exceljs');
  return ((mod as unknown as { default?: typeof ExcelJSType }).default || mod) as typeof ExcelJSType;
};

const fmt = (n: number | null) => (n === null ? '—' : `₪${n.toLocaleString('he-IL', { maximumFractionDigits: 2 })}`);

export default function BulkPriceManager() {
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState<'' | 'export' | 'read' | 'save'>('');
  const [diffs, setDiffs] = useState<Diff[] | null>(null);
  const [errors, setErrors] = useState<RowError[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<{ updated: number; skipped: { name?: string; reason: string }[] } | null>(null);
  const [message, setMessage] = useState('');

  const reset = () => {
    setDiffs(null);
    setErrors([]);
    setResult(null);
    setMessage('');
  };

  // ---------- 1. Export ----------
  const exportFile = async () => {
    reset();
    setBusy('export');
    try {
      const [ExcelJS, list] = await Promise.all([loadExcel(), loadProducts()]);
      const wb = new ExcelJS.Workbook();
      wb.creator = 'LAVAN Group';
      const ws = wb.addWorksheet('מחירים', { views: [{ rightToLeft: true, state: 'frozen', ySplit: 1 }] });
      ws.columns = [
        { header: COLS.name, key: 'name', width: 42 },
        { header: COLS.variant, key: 'variant', width: 28 },
        { header: COLS.sku, key: 'sku', width: 12 },
        { header: COLS.category, key: 'category', width: 34 },
        { header: COLS.regular, key: 'regular', width: 13 },
        { header: COLS.sale, key: 'sale', width: 13 },
        { header: COLS.id, key: 'id', width: 27 },
        { header: COLS.varKey, key: 'varKey', width: 30 },
      ];
      const sorted = [...list].sort((a, b) => String(a.קטגוריות || '').localeCompare(String(b.קטגוריות || ''), 'he') || a.שם.localeCompare(b.שם, 'he'));
      for (const p of sorted) {
        ws.addRow({
          name: p.שם,
          variant: '',
          sku: p['מק"ט'] || '',
          category: p.קטגוריות || '',
          regular: num(p['מחיר רגיל']),
          sale: num(p['מחיר מבצע']),
          id: p._id,
          varKey: '',
        });
        (p.variations || []).forEach((v, index) => {
          for (const [attr, a] of Object.entries(v.attributes || {})) {
            if (!a || typeof a !== 'object') continue;
            const row = ws.addRow({
              name: p.שם,
              variant: `${attr}: ${a.value ?? ''}`,
              sku: p['מק"ט'] || '',
              category: p.קטגוריות || '',
              regular: num(a.price),
              sale: num(a.salePrice),
              id: p._id,
              varKey: `${index}|${attr}`,
            });
            row.getCell('variant').font = { color: { argb: 'FF4B5563' } };
          }
        });
      }
      const header = ws.getRow(1);
      header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } };
      ['regular', 'sale'].forEach((k) => {
        ws.getColumn(k).numFmt = '#,##0.00 "₪"';
        header.getCell(k).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEA580C' } };
      });
      ['id', 'varKey'].forEach((k) => (ws.getColumn(k).font = { color: { argb: 'FF9CA3AF' }, size: 9 }));
      header.getCell('id').font = header.getCell('varKey').font = { bold: true, color: { argb: 'FFFFFFFF' } };
      ws.autoFilter = { from: 'A1', to: 'H1' };

      const help = wb.addWorksheet('הוראות', { views: [{ rightToLeft: true }] });
      help.getColumn(1).width = 110;
      [
        'עדכון מחירים מרוכז – לבן גרופ',
        '',
        '1. מעדכנים רק את העמודות "מחיר רגיל" ו"מחיר מבצע" (בכתום).',
        '2. תא ריק = בלי שינוי. כדי להסיר מחיר מבצע – כותבים 0.',
        '3. בשורות של וריאציות (גוון / גודל) המחיר נמצא ב"מחיר רגיל", ואפשר לתת לכל וריאציה גם "מחיר מבצע" משלה (0 = הסרת המבצע).',
        '4. לא משנים ולא מוחקים את "מזהה מערכת" ו"מפתח וריאציה" – לפיהם המערכת יודעת איזה מוצר לעדכן.',
        '5. מותר למיין ולסנן, ומותר למחוק שורות שלא משנים.',
        '6. מעלים את הקובץ בפאנל. לפני השמירה מוצגת השוואה מלאה של לפני ואחרי, ושום דבר לא נשמר בלי אישור.',
        '7. אם מישהו שינה מחיר באתר אחרי הייצוא, המוצר הזה לא יעודכן ותופיע על כך הודעה. מורידים קובץ חדש ומעדכנים שוב.',
      ].forEach((t, i) => {
        const r = help.addRow([t]);
        if (i === 0) r.font = { bold: true, size: 14 };
      });

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `lavan-prices-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      setMessage(`הקובץ ירד: ${list.length} מוצרים.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'הייצוא נכשל');
    } finally {
      setBusy('');
    }
  };

  // ---------- 3. Import + preview ----------
  const readFile = async (file: File) => {
    reset();
    setFileName(file.name);
    setBusy('read');
    try {
      const [ExcelJS, list] = await Promise.all([loadExcel(), loadProducts()]);
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await file.arrayBuffer());
      const ws = wb.getWorksheet('מחירים') || wb.worksheets[0];
      if (!ws) throw new Error('לא נמצא גיליון בקובץ');

      // Locate columns by header text, so reordering columns in Excel is harmless.
      const col: Record<string, number> = {};
      ws.getRow(1).eachCell((c, i) => {
        const t = cellText(c.value);
        for (const [k, h] of Object.entries(COLS)) if (t === h) col[k] = i;
      });
      if (!col.id || !col.regular) throw new Error('חסרות עמודות בקובץ. הורידו קובץ חדש מהפאנל ועדכנו בו.');

      const byId = new Map(list.map((p) => [p._id, p]));
      const out: Diff[] = [];
      const errs: RowError[] = [];
      const seen = new Set<string>();

      ws.eachRow((row, r) => {
        if (r === 1) return;
        const id = cellText(row.getCell(col.id).value);
        if (!id) return;
        const varKey = col.varKey ? cellText(row.getCell(col.varKey).value) : '';
        const p = byId.get(id);
        const rowName = col.name ? cellText(row.getCell(col.name).value) : id;
        if (!p) return void errs.push({ row: r, message: `המוצר "${rowName}" לא נמצא באתר (אולי נמחק).` });
        const key = `${id}#${varKey}`;
        if (seen.has(key)) return void errs.push({ row: r, message: `השורה של "${p.שם}" מופיעה פעמיים בקובץ.` });
        seen.add(key);

        const reg = cellNumber(row.getCell(col.regular).value);
        const sale = col.sale ? cellNumber(row.getCell(col.sale).value) : { value: null, invalid: false };
        if (reg.invalid || sale.invalid) return void errs.push({ row: r, message: `"${p.שם}": המחיר אינו מספר.` });
        if ((reg.value !== null && reg.value < 0) || (sale.value !== null && sale.value < 0))
          return void errs.push({ row: r, message: `"${p.שם}": מחיר שלילי.` });

        if (varKey) {
          const sep = varKey.indexOf('|');
          const index = Number(varKey.slice(0, sep));
          const attr = varKey.slice(sep + 1);
          const a = p.variations?.[index]?.attributes?.[attr];
          if (sep < 0 || !a) return void errs.push({ row: r, message: `"${p.שם}": הווריאציה לא נמצאה. הורידו קובץ חדש.` });
          const before = num(a.price);
          const afterVarReg = reg.value === null || reg.value === 0 ? before : reg.value;
          if (reg.value !== null && reg.value !== before) {
            if (reg.value === 0) errs.push({ row: r, message: `"${p.שם}" (${a.value}): מחיר 0 לווריאציה לא נשמר.` });
            else out.push({ id, name: p.שם, label: `${a.value ?? ''}`, field: 'variation', varKey, before, after: reg.value });
          }
          if (sale.value !== null) {
            const beforeVarSale = num(a.salePrice);
            const afterVarSale = sale.value === 0 ? null : sale.value;
            if (afterVarSale !== beforeVarSale) {
              const warning = afterVarSale !== null && afterVarReg !== null && afterVarSale >= afterVarReg ? 'מחיר המבצע לא נמוך מהמחיר הרגיל' : undefined;
              out.push({ id, name: p.שם, label: `${a.value ?? ''}`, field: 'variationSale', varKey, before: beforeVarSale, after: afterVarSale, warning });
            }
          }
          return;
        }

        const beforeReg = num(p['מחיר רגיל']);
        const beforeSale = num(p['מחיר מבצע']);
        const afterReg = reg.value === null ? beforeReg : reg.value;
        if (reg.value !== null && reg.value !== beforeReg) {
          if (reg.value === 0) return void errs.push({ row: r, message: `"${p.שם}": מחיר רגיל 0 לא נשמר.` });
          out.push({ id, name: p.שם, label: '', field: 'regular', before: beforeReg, after: reg.value });
        }
        if (sale.value !== null) {
          const afterSale = sale.value === 0 ? null : sale.value;
          if (afterSale !== beforeSale) {
            const warning = afterSale !== null && afterReg !== null && afterSale >= afterReg ? 'מחיר המבצע לא נמוך מהמחיר הרגיל' : undefined;
            out.push({ id, name: p.שם, label: '', field: 'sale', before: beforeSale, after: afterSale, warning });
          }
        }
      });

      for (const d of out) {
        if (d.warning || d.before === null || d.after === null || d.before === 0) continue;
        const pct = Math.abs(d.after - d.before) / d.before;
        if (pct >= 0.5) d.warning = `שינוי של ${Math.round(pct * 100)}% – כדאי לוודא`;
      }
      setProducts(list);
      setDiffs(out);
      setErrors(errs);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'קריאת הקובץ נכשלה');
    } finally {
      setBusy('');
    }
  };

  // ---------- Save (only after confirmation) ----------
  const save = async () => {
    if (!diffs?.length) return;
    if (!confirm(`לשמור ${diffs.length} שינויי מחיר באתר?`)) return;
    setBusy('save');
    try {
      const byId = new Map(products.map((p) => [p._id, p]));
      const grouped = new Map<string, {
        id: string;
        expected: {
          regular: number | null;
          sale: number | null;
          variations: Record<string, number | null>;
          variationSales: Record<string, number | null>;
        };
        regular?: number;
        sale?: number | null;
        variations?: { index: number; attr: string; price?: number; sale?: number | null }[];
      }>();
      for (const d of diffs) {
        const p = byId.get(d.id)!;
        let g = grouped.get(d.id);
        if (!g) {
          g = { id: d.id, expected: { regular: num(p['מחיר רגיל']), sale: num(p['מחיר מבצע']), variations: {}, variationSales: {} } };
          grouped.set(d.id, g);
        }
        if (d.field === 'regular') g.regular = d.after as number;
        else if (d.field === 'sale') g.sale = d.after;
        else if (d.varKey) {
          const sep = d.varKey.indexOf('|');
          const index = Number(d.varKey.slice(0, sep));
          const attr = d.varKey.slice(sep + 1);
          const list = (g.variations ||= []);
          let v = list.find((x) => x.index === index && x.attr === attr);
          if (!v) list.push((v = { index, attr }));
          if (d.field === 'variation') {
            v.price = d.after as number;
            g.expected.variations[d.varKey] = d.before;
          } else {
            v.sale = d.after;
            g.expected.variationSales[d.varKey] = d.before;
          }
        }
      }
      const res = await adminPost('/api/products/bulk-prices', { changes: [...grouped.values()] });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'השמירה נכשלה');
      setResult(data);
      setDiffs(null);
      dispatch(fetchProducts());
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'השמירה נכשלה');
    } finally {
      setBusy('');
    }
  };

  const fieldLabel = (d: Diff) =>
    ({ sale: 'מחיר מבצע', regular: 'מחיר רגיל', variation: 'מחיר וריאציה', variationSale: 'מבצע לווריאציה' })[d.field];
  const warnings = diffs?.filter((d) => d.warning).length || 0;

  return (
    <section className="space-y-6" dir="rtl">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold">עדכון מחירים מרוכז (Excel)</h2>
        <ol className="mt-3 list-decimal pr-5 text-gray-700 space-y-1">
          <li>מורידים קובץ Excel עם כל המוצרים והמחירים הנוכחיים.</li>
          <li>מעדכנים בקובץ רק את עמודות המחיר. תא ריק = בלי שינוי; כדי להסיר מחיר מבצע כותבים 0.</li>
          <li>מעלים את הקובץ, בודקים את ההשוואה לפני ואחרי, ומאשרים. שום דבר לא נשמר לפני האישור.</li>
        </ol>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button onClick={exportFile} disabled={!!busy} className="rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white disabled:opacity-50">
            {busy === 'export' ? 'מכין קובץ…' : '1. הורדת קובץ מחירים'}
          </button>
          <label className={`cursor-pointer rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white ${busy ? 'pointer-events-none opacity-50' : ''}`}>
            {busy === 'read' ? 'קורא את הקובץ…' : '3. העלאת קובץ מעודכן'}
            <input
              type="file"
              accept=".xlsx"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) readFile(f);
              }}
            />
          </label>
          {fileName && <span className="text-sm text-gray-500">{fileName}</span>}
        </div>
        {message && <p className="mt-4 rounded-lg bg-gray-100 px-4 py-3 text-gray-800">{message}</p>}
      </div>

      {errors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h3 className="font-bold text-red-800">שורות שלא ייכנסו ({errors.length})</h3>
          <ul className="mt-2 space-y-1 text-sm text-red-900">
            {errors.slice(0, 50).map((e, i) => (
              <li key={i}>שורה {e.row}: {e.message}</li>
            ))}
            {errors.length > 50 && <li>ועוד {errors.length - 50}…</li>}
          </ul>
        </div>
      )}

      {diffs && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-bold">
              {diffs.length ? `תצוגה מקדימה: ${diffs.length} שינויים` : 'לא נמצאו שינויים בקובץ'}
              {warnings > 0 && <span className="mr-2 text-base font-semibold text-amber-700">({warnings} לבדיקה)</span>}
            </h3>
            {diffs.length > 0 && (
              <div className="flex gap-2">
                <button onClick={reset} className="rounded-lg bg-gray-200 px-4 py-2 font-semibold">ביטול</button>
                <button onClick={save} disabled={!!busy} className="rounded-lg bg-green-600 px-5 py-2 font-semibold text-white disabled:opacity-50">
                  {busy === 'save' ? 'שומר…' : `אישור ושמירה של ${diffs.length} שינויים`}
                </button>
              </div>
            )}
          </div>
          {diffs.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-right">
                    <th className="p-2">מוצר</th>
                    <th className="p-2">וריאציה</th>
                    <th className="p-2">שדה</th>
                    <th className="p-2">לפני</th>
                    <th className="p-2">אחרי</th>
                    <th className="p-2">הערה</th>
                  </tr>
                </thead>
                <tbody>
                  {diffs.map((d, i) => (
                    <tr key={i} className={`border-b ${d.warning ? 'bg-amber-50' : ''}`}>
                      <td className="p-2 font-medium">{d.name}</td>
                      <td className="p-2 text-gray-600">{d.label}</td>
                      <td className="p-2">{fieldLabel(d)}</td>
                      <td className="p-2 text-gray-500 line-through">{fmt(d.before)}</td>
                      <td className="p-2 font-bold">{d.after === null ? 'הסרה' : fmt(d.after)}</td>
                      <td className="p-2 text-amber-800">{d.warning || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <h3 className="font-bold text-green-800">נשמר: {result.updated} מוצרים עודכנו באתר.</h3>
          {result.skipped.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-amber-900">
              {result.skipped.map((s, i) => (
                <li key={i}>לא עודכן: {s.name || ''} – {s.reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
