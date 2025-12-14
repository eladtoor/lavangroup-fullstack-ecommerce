import { NextResponse } from 'next/server';
import { fetchCategoryMap, printCategoryMap, generateSlugMapCode } from '@/lib/category-mapper';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * API Route to fetch and display category map
 * 
 * GET /api/category-map - Returns category map as JSON
 * GET /api/category-map?format=code - Returns TypeScript code for category-slugs.ts
 * GET /api/category-map?format=print - Prints to console and returns JSON
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    
    const categoryMap = await fetchCategoryMap();
    
    if (format === 'code') {
      const code = generateSlugMapCode(categoryMap);
      return new NextResponse(code, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }
    
    if (format === 'print') {
      printCategoryMap(categoryMap);
    }
    
    return NextResponse.json({
      success: true,
      categoryMap,
      totalCategories: Object.keys(categoryMap).length,
      totalSubcategories: Object.values(categoryMap).reduce(
        (sum, cat) => sum + cat.subCategories.length,
        0
      ),
    });
  } catch (error) {
    console.error('Error in category-map API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

