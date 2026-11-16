/**
 * Single source of truth for storefront prices.
 *
 * - Product: the sale price ("מחיר מבצע") wins over the regular price when it is > 0.
 * - Variation attribute: `salePrice` wins over `price` when it is > 0.
 *
 * The server mirrors these rules in server/controllers/paymentController.js
 * (calculateExpectedPrice). Keep both in sync, or checkout price validation fails.
 */

type Priced = { 'מחיר רגיל'?: number | string | null; 'מחיר מבצע'?: number | string | null };
export type PricedAttr = { value?: string; price?: number | string | null; salePrice?: number | string | null };

const pos = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** Regular (list) base price of a product. */
export const baseRegular = (p: Priced): number => pos(p['מחיר רגיל']);

/** Base price actually charged: sale price if set, otherwise regular. */
export const baseEffective = (p: Priced): number => pos(p['מחיר מבצע']) || pos(p['מחיר רגיל']);

/** Regular (list) price of a variation attribute. */
export const attrRegular = (a?: PricedAttr | null): number => pos(a?.price);

/** Price actually charged for a variation attribute. */
export const attrEffective = (a?: PricedAttr | null): number => pos(a?.salePrice) || pos(a?.price);
