/**
 * Product URL helpers
 *
 * Canonical format:
 *   /product/<id>-<slug>
 *
 * - id: Mongo ObjectId (24 hex) in current system
 * - slug: human-readable, derived from product name (supports Hebrew)
 */

export function slugifyProductName(name: string): string {
  const input = String(name || '').trim();
  if (!input) return 'product';

  // Keep letters/numbers from any language (incl. Hebrew), turn everything else into '-'
  const slug = input
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-') // everything not letter/number => dash
    .replace(/-+/g, '-') // collapse
    .replace(/^-|-$/g, ''); // trim dashes

  return slug || 'product';
}

export function isMongoObjectId(value: string): boolean {
  return /^[a-f0-9]{24}$/i.test(value);
}

/**
 * Accepts:
 * - "<id>"
 * - "<id>-<slug>"
 * Returns parsed id + provided slug (if any).
 */
export function parseProductIdSlug(input: string): { id: string; slug?: string } {
  const raw = String(input || '').trim();
  if (!raw) return { id: '' };

  // Next.js may pass URL-encoded params (e.g. Hebrew slug as %D7%...).
  // Decode defensively so slug comparison doesn't cause redirect loops.
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // keep raw
  }

  const firstDashIdx = decoded.indexOf('-');
  if (firstDashIdx === -1) {
    return { id: decoded };
  }

  const id = decoded.slice(0, firstDashIdx);
  const slug = decoded.slice(firstDashIdx + 1) || undefined;
  return { id, slug };
}

export function buildProductCanonicalPath(product: { _id: string; שם: string }): string {
  const slug = slugifyProductName(product.שם);
  return `/product/${product._id}-${slug}`;
}


