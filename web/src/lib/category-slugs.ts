/**
 * Category Name to SEO-Friendly Slug Mapping
 * 
 * Maps Hebrew category names to English URL-friendly slugs
 * for better SEO and cleaner URLs
 */

export const categorySlugMap: Record<string, string> = {
  // Company Name
  'טמבור': 'tambour',
  
  // Main Categories
  'צבעים לקירות פנים': 'interior-wall-paints',
  'צבעים למתכת': 'metal-paints',
  'חומרי הכנה ומילוי': 'preparation-and-filling-materials',
  'צבעים לקירות חוץ': 'exterior-wall-paints',
  'חומר בניה': 'construction-materials',
  'חומרי בנייה': 'construction-materials', // Alternative spelling
  'קטלוגים דיגיטלים להורדה': 'digital-catalogs-download',
  'צבעי תעשיה': 'industrial-paints',
  'אביזרים לצביעה ושיפוץ': 'painting-and-renovation-accessories',
  'עיגון ואיטום': 'anchoring-and-sealing',
  'מוצרי גבס': 'gypsum-products',
  
  // Sub-Categories for "צבעים לקירות פנים"
  'אפקטים': 'effects',
  'צבע': 'paint', // Paint (subcategory)
  
  // Sub-Categories for "חומרי הכנה ומילוי"
  'חומרי הכנה': 'preparation-materials',
  'חומרי מילוי': 'filling-materials',
  
  // Sub-Categories for "צבעים לעץ"
  'מוצרים לטיפול בעץ': 'wood-treatment-products',
  
  // Sub-Categories for "צבעים לקירות חוץ"
  'שליכט': 'plaster',
  'טיח': 'render', // Render/Stucco
  
  // Sub-Categories for "חומרי בנייה"
  'טייחים': 'plasters', // Plasters
  'מילוי והחלקה': 'filling-and-smoothing',
  'דבקים': 'adhesives',
  'תשתיות וטיפול בבטון': 'concrete-foundations-and-treatment',
  'מלט ושפכטל': 'cement-and-putty',
  'מוספים ומדה': 'additives-and-measurement',
  'מוצרי רובה': 'gun-products', // Gun products (construction gun)
  'חומרי איטום': 'sealing-materials',
  'שיקום': 'restoration', // Restoration (removed backslash)
  'אבקות גבס': 'gypsum-powders',
  
  // Sub-Categories for "מוצרי גבס"
  'בלוקי גבס': 'gypsum-blocks',
  'קונסטרוקציה לגבס וטיח': 'gypsum-and-render-construction',
  'חומרי בידוד': 'insulation-materials',
  'פינות לטיח': 'render-corners',
  'ניצבים ומסלולים': 'profiles-and-tracks',
  'תקרות גבס ופתחי שירות': 'gypsum-ceilings-and-service-openings',
  'תקרות': 'ceilings',
  'ברגים לגבס': 'gypsum-screws',
  'נלווים': 'accessories', // Accessories for gypsum
  'לוחות גבס': 'gypsum-boards',
  'פתחי שירות': 'service-openings',
  'אריחים מינרליים': 'mineral-tiles',
  
  // Sub-Categories for "אביזרים לצביעה ושיפוץ"
  'אביזרים': 'accessories',
  'מאלג\'ים': 'trowels',
  'מברשות': 'brushes',
  'רולרים': 'rollers',
  
  // Sub-Categories for "צבעי תעשיה"
  'סימון כבישים': 'road-marking',
  'הגנה מאש': 'fire-protection',
  'פתרונות תעשיתיים לעץ': 'industrial-wood-solutions',
  'אחזקה קלה': 'light-maintenance',
  'אחזקה כבדה ואניות': 'heavy-maintenance-and-ships',
  'ציפויי רצפות': 'floor-coatings',
  'תעופה צבאית': 'military-aviation',
  'אבקות אלקטרוסטטיות': 'electrostatic-powders',
  
  // Other common sub-categories (legacy/alternative names)
  'צבעי אקריליק': 'acrylic-paints',
  'צבעים אקריליים': 'acrylic-paints', // Alternative name
  'צבעי לטקס': 'latex-paints',
  'צבעי שמן': 'oil-paints',
  'צבעים לעץ': 'wood-paints',
  'צבעים': 'paints', // Generic paints
  'צבעים לרצפה': 'floor-paints',
  'צבעים לתקרה': 'ceiling-paints',
  'פריימרים': 'primers',
  'פריימרים לקירות': 'wall-primers',
  'אנדרקוט': 'undercoat',
  'שפכטל': 'putty',
  'שפכטלים': 'putties', // Plural
  'סילר': 'sealer',
  'מרקם': 'texture',
  'שליכט צבעוני': 'colored-plaster', // Colored plaster (alternative name)
  'צבעי גג': 'roof-paints',
  'צבעי חזית': 'facade-paints',
  'אנטי גרפיטי': 'anti-graffiti',
  'גבס': 'gypsum',
  'מסטיקים': 'mastics',
  'קטגוריות דיגיטליות': 'digital-categories',
  'צבעים תעשייתיים': 'industrial-coatings',
  'צבעי אבקה': 'powder-coatings',
  'כלי עבודה': 'work-tools',
  'ניילונים': 'protective-sheets',
  'סרטי מסקינג': 'masking-tapes',
  'אנקרים': 'anchors',
  'סיליקונים': 'silicones',
  'קלקר': 'caulk',
  'ספוגים': 'sponges',
  'מדבקות': 'stickers',
  'ציפויי רצפה': 'floor-coatings',
  'צבעים וחומרי גמר': 'paints-and-finishing-materials',
  'חומרים לבניה': 'building-materials',
  'צבעים סינתטיים': 'synthetic-paints',
};

/**
 * Reverse map for slug to Hebrew name
 */
export const slugToCategoryMap: Record<string, string> = Object.fromEntries(
  Object.entries(categorySlugMap).map(([hebrew, slug]) => [slug.toLowerCase(), hebrew])
);

/**
 * Convert Hebrew category name to SEO-friendly slug
 */
export function categoryToSlug(categoryName: string): string {
  const normalized = categoryName.trim();
  
  // Check if we have a mapping
  if (categorySlugMap[normalized]) {
    return categorySlugMap[normalized];
  }
  
  // Try to find partial match (for cases like "צבע" when we have "צבעים")
  // This is a fallback for subcategories that might have shortened names
  const partialMatch = Object.keys(categorySlugMap).find(key => 
    key.includes(normalized) || normalized.includes(key)
  );
  if (partialMatch) {
    return categorySlugMap[partialMatch];
  }
  
  // Fallback: return encoded (not ideal but safe)
  return encodeURIComponent(normalized);
}

/**
 * Convert slug back to Hebrew category name
 */
export function slugToCategory(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  
  // Check if we have a reverse mapping
  if (slugToCategoryMap[normalized]) {
    return slugToCategoryMap[normalized];
  }
  
  // Also check original case (in case slug has uppercase)
  if (slugToCategoryMap[slug.trim()]) {
    return slugToCategoryMap[slug.trim()];
  }
  
  // Fallback: decode URI
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

/**
 * Build full category URL with slugs
 */
export function buildCategoryUrl(companyName: string, categoryName: string, subcategoryName?: string): string {
  const companySlug = categoryToSlug(companyName);
  const categorySlug = categoryToSlug(categoryName);
  
  if (subcategoryName) {
    const subcategorySlug = categoryToSlug(subcategoryName);
    return `/${companySlug}/${categorySlug}/${subcategorySlug}/products`;
  }
  
  return `/${companySlug}/${categorySlug}`;
}

/**
 * Parse URL params to get Hebrew names
 */
export function parseUrlParams(params: {
  companyName?: string;
  categoryName?: string;
  subcategoryName?: string;
}): {
  companyName: string;
  categoryName: string;
  subcategoryName?: string;
} {
  return {
    companyName: params.companyName ? slugToCategory(params.companyName) : '',
    categoryName: params.categoryName ? slugToCategory(params.categoryName) : '',
    subcategoryName: params.subcategoryName ? slugToCategory(params.subcategoryName) : undefined,
  };
}

