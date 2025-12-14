# Next.js Migration Guide - Lavangroup E-commerce

This guide explains how to complete the migration from React (CRA) to Next.js 14 with App Router.

## ✅ What's Already Done

### Core Infrastructure
- [x] Next.js 14 project setup with App Router
- [x] TypeScript configuration
- [x] Tailwind CSS with RTL support
- [x] Redux Toolkit state management (App Router compatible)
- [x] Firebase Authentication setup
- [x] WebSocket real-time updates
- [x] API client utilities
- [x] Cart utilities with Firestore
- [x] Environment variables structure
- [x] Root layout with providers
- [x] Basic NavBar and Footer components
- [x] Homepage placeholder

### Key Files Migrated
```
✅ src/lib/redux/          - All Redux setup (store, slices, reducers)
✅ src/lib/firebase.ts      - Firebase config
✅ src/lib/websocket.ts     - WebSocket setup
✅ src/lib/api.ts           - API client
✅ src/utils/cartUtils.ts   - Cart utilities
✅ src/app/layout.tsx       - Root layout
✅ src/app/providers.tsx    - Redux + Firebase providers
```

## 🔧 Next Steps

### 1. Install Dependencies

```bash
cd nextjs
npm install
```

### 2. Copy Public Assets

Copy assets from the React app:

```bash
# Windows PowerShell
xcopy ..\lavangroup-fullstack-ecommerce-main\web\public\textures .\public\textures\ /E /I
xcopy ..\lavangroup-fullstack-ecommerce-main\web\public\icons .\public\icons\ /E /I
xcopy ..\lavangroup-fullstack-ecommerce-main\web\public\docs .\public\docs\ /E /I
copy ..\lavangroup-fullstack-ecommerce-main\web\public\manifest.json .\public\
copy ..\lavangroup-fullstack-ecommerce-main\web\public\logo.png .\public\
copy ..\lavangroup-fullstack-ecommerce-main\web\public\logo1.png .\public\

# Or manually copy these folders from /web/public to /nextjs/public
```

### 3. Update Environment Variables

Copy Firebase config from your React app's `.env` file to `nextjs/.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
```

### 4. Component Migration Strategy

#### Priority Order:
1. **Reusable Components** (low complexity) → High reuse
2. **Page Components** (medium complexity) → User-facing
3. **Admin Components** (high complexity) → Lower priority

#### Component Migration Checklist

For each component from `/web/src/components`:

1. Create TypeScript version in `/nextjs/src/components`
2. Add `'use client'` directive if the component:
   - Uses React hooks (useState, useEffect, etc.)
   - Uses Redux hooks (useSelector, useDispatch)
   - Has event handlers (onClick, onChange, etc.)
   - Uses browser APIs (window, localStorage, etc.)
3. Convert to TypeScript:
   - Add type annotations for props
   - Add return type if needed
   - Replace PropTypes with TypeScript interfaces
4. Update imports:
   - Use `@/` path alias
   - Import from Next.js packages (next/link, next/image)
5. Replace routing:
   - `react-router-dom` → `next/link` and `useRouter`
   - `<Link to="/path">` → `<Link href="/path">`
   - `useNavigate()` → `useRouter().push()`
6. Replace images:
   - `<img>` → `<Image>` from `next/image`
   - Add width, height, alt props

#### Example Migration

**Before (React):**
```jsx
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

function ProductCard({ product }) {
  const user = useSelector(state => state.user.user);

  return (
    <div>
      <img src={product.image} alt={product.name} />
      <Link to={`/product/${product.id}`}>
        {product.name}
      </Link>
    </div>
  );
}
```

**After (Next.js):**
```tsx
'use client';

import { useAppSelector } from '@/lib/redux/hooks';
import Link from 'next/link';
import Image from 'next/image';

interface ProductCardProps {
  product: {
    _id: string;
    שם: string;
    תמונות?: string[];
    'מחיר רגיל': number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const user = useAppSelector((state) => state.user.user);

  return (
    <div>
      {product.תמונות?.[0] && (
        <Image
          src={product.תמונות[0]}
          alt={product.שם}
          width={200}
          height={200}
        />
      )}
      <Link href={`/product/${product._id}`}>
        {product.שם}
      </Link>
    </div>
  );
}
```

### 5. Components to Migrate

#### High Priority (Core UX):
```
src/components/
  ├── Carousel.jsx          → Add 'use client'
  ├── ProductCard.jsx       → Add 'use client', use Image
  ├── ProductList.jsx       → Add 'use client'
  ├── CartItem.jsx          → Add 'use client'
  ├── QuickCart.jsx         → Add 'use client'
  ├── Category.jsx          → Can be Server Component
  ├── RecommendedProducts.jsx → Add 'use client'
  └── DiscountedProducts.jsx  → Add 'use client'
```

#### Medium Priority (Features):
```
  ├── AboutUs.jsx           → Can be Server Component
  ├── StatsCounters.jsx     → Add 'use client'
  ├── ConfirmationModal.jsx → Add 'use client'
  ├── FloatingWhatsAppButton.jsx → Add 'use client'
  ├── FloatingTranslateButton.jsx → Add 'use client'
  └── UserInfoForm.jsx      → Add 'use client'
```

#### Low Priority (Admin/Special):
```
  ├── CategoryImageManager.jsx → Add 'use client', admin only
  ├── ErrorBoundary.jsx     → Next.js has built-in error boundaries
  └── RoleProtectedRoute.jsx → Use Next.js middleware instead
```

### 6. Page Migration

Create pages in `/nextjs/src/app` using App Router structure:

```
src/app/
├── layout.tsx              ✅ Done
├── page.tsx                ✅ Done (placeholder)
├── products/
│   └── page.tsx            → Migrate from ProductsPage.jsx
├── cart/
│   └── page.tsx            → Migrate from CartPage.jsx
├── login/
│   └── page.tsx            → Migrate from LoginPage.jsx
├── register/
│   └── page.tsx            → Migrate from RegisterPage.jsx
├── profile/
│   └── page.tsx            → Migrate from UserProfile.jsx
├── search/
│   └── page.tsx            → Migrate from SearchResults.jsx
├── order-confirmation/
│   └── page.tsx            → Migrate from OrderConfirmation.jsx
├── order-success/
│   └── page.tsx            → Migrate from OrderSuccess.jsx
├── admin-panel/
│   └── page.tsx            → Migrate from AdminPanel.jsx
├── user-management/
│   └── page.tsx            → Migrate from UserManagement.jsx
└── [category]/             → Dynamic routes for categories
    └── [subcategory]/
        └── page.tsx
```

#### Page Component Structure:

```tsx
// src/app/products/page.tsx
import { Metadata } from 'next';
import ProductsPageClient from '@/components/pages/ProductsPage';

// Server Component - Generates metadata for SEO
export const metadata: Metadata = {
  title: 'מוצרים - Lavangroup',
  description: 'רשימת מוצרים מלאה',
};

// This can fetch data server-side if needed
export default function ProductsPage() {
  return <ProductsPageClient />;
}
```

```tsx
// src/components/pages/ProductsPage.tsx
'use client';

import { useAppSelector } from '@/lib/redux/hooks';

export default function ProductsPageClient() {
  const products = useAppSelector((state) => state.products.products);

  return (
    <div>
      {/* Component logic */}
    </div>
  );
}
```

### 7. Middleware for Route Protection

Create `/nextjs/src/middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for auth token in cookies
  const token = request.cookies.get('auth_token');

  const protectedPaths = ['/admin-panel', '/user-management', '/profile'];
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin-panel/:path*', '/user-management/:path*', '/profile/:path*'],
};
```

### 8. i18n Setup (Hebrew/English)

Install next-intl:

```bash
npm install next-intl
```

Create locale files in `/nextjs/src/locales`:

```
src/locales/
  ├── he.json
  └── en.json
```

Update layout to use i18n provider.

### 9. SEO Optimization

For each page, add metadata:

```tsx
export const metadata: Metadata = {
  title: 'Product Name - Lavangroup',
  description: 'Product description for SEO',
  openGraph: {
    title: 'Product Name',
    description: 'Product description',
    images: ['/product-image.jpg'],
  },
};
```

For dynamic pages, use `generateMetadata`:

```tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await fetchProduct(params.id);

  return {
    title: `${product.שם} - Lavangroup`,
    description: product['תיאור קצר'],
  };
}
```

### 10. Testing Checklist

- [ ] User authentication (login/logout/register)
- [ ] Cart operations (add/remove/update)
- [ ] Product browsing and search
- [ ] Category navigation
- [ ] Order flow (cart → checkout → confirmation)
- [ ] Admin panel (product CRUD)
- [ ] User management (admin)
- [ ] Real-time updates via WebSocket
- [ ] Mobile responsiveness
- [ ] RTL layout (Hebrew)
- [ ] Language switching
- [ ] SEO metadata on all pages

### 11. Deployment

#### Option A: Vercel (Recommended for Next.js)
1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

**Note:** Express backend must be deployed separately (Railway, Heroku, etc.)

#### Option B: VPS/Traditional Hosting
1. Build Next.js: `npm run build`
2. Run with: `npm start`
3. Use PM2 for process management

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd nextjs
npm install

# 2. Copy assets (see step 2 above)

# 3. Update .env.local with your Firebase config

# 4. Start Express backend (in separate terminal)
cd ../server
npm start

# 5. Start Next.js dev server
cd ../nextjs
npm run dev

# 6. Open http://localhost:3000
```

## 📚 Key Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Redux in Next.js](https://redux-toolkit.js.org/tutorials/rtk-query#using-with-nextjs)
- [Next.js Metadata](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [next/image](https://nextjs.org/docs/app/api-reference/components/image)

## 🐛 Common Issues

### "Hydration error"
- Cause: Server and client HTML don't match
- Solution: Ensure no browser-only code runs during SSR, use `'use client'` and check for `typeof window !== 'undefined'`

### "localStorage is not defined"
- Cause: Accessing localStorage in Server Component
- Solution: Add `'use client'` directive or wrap in `typeof window !== 'undefined'`

### Redux state not persisting
- Cause: Redux persist needs client-side
- Solution: Already configured in providers.tsx

### Images not loading
- Cause: Need to configure remotePatterns in next.config.js
- Solution: Already configured for Cloudinary

## 📞 Support

If you encounter issues during migration, check:
1. Console errors in browser DevTools
2. Next.js terminal output
3. Ensure Express backend is running
4. Verify environment variables are set

---

**Migration Progress**: Core infrastructure complete, component migration in progress.

Follow this guide step-by-step to complete the migration while maintaining all functionality.
