'use client';

import React from 'react';

interface ProductSchemaProps {
  product: {
    _id: string;
    שם: string;
    'תיאור קצר'?: string;
    תיאור?: string;
    תמונות?: string;
    'מחיר רגיל': number;
    'מק"ט'?: string;
    [key: string]: any;
  };
  finalPrice?: number;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  /**
   * Optional URL for the product page.
   * If you don't have a dedicated product page, omit this to avoid incorrect structured data.
   */
  url?: string;
}

export default function ProductSchema({ 
  product, 
  finalPrice, 
  availability = 'InStock',
  url,
}: ProductSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lavangroup.co.il';
  
  const productSchema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.שם,
    "description": product['תיאור קצר'] || product.תיאור || product.שם,
    "image": product.תמונות || `${baseUrl}/placeholder-product.png`,
    "sku": product['מק"ט'] || product._id,
    "brand": {
      "@type": "Brand",
      "name": "לבן גרופ"
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "ILS",
      "price": finalPrice || product['מחיר רגיל'],
      "availability": `https://schema.org/${availability}`,
      "seller": {
        "@type": "Organization",
        "name": "לבן גרופ"
      }
    }
  };

  if (url) {
    productSchema.offers.url = url;
  }

  // Add aggregateRating only if product has reviews (future enhancement)
  // if (product.reviews && product.reviews.length > 0) {
  //   productSchema.aggregateRating = {
  //     "@type": "AggregateRating",
  //     "ratingValue": calculateAverageRating(product.reviews),
  //     "reviewCount": product.reviews.length
  //   };
  // }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
    />
  );
}


