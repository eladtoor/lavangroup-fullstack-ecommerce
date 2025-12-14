# Quick Start Guide - Next.js Migration

## 🎉 Migration Status: Core Infrastructure Complete!

The Next.js 14 foundation is ready. This document will get you running in minutes.

## ✅ What's Complete

### Core Infrastructure (100%)
- ✅ Next.js 14 with App Router
- ✅ TypeScript configuration
- ✅ Tailwind CSS with RTL support
- ✅ Redux Toolkit (App Router compatible)
- ✅ Firebase Authentication
- ✅ WebSocket real-time updates
- ✅ API client
- ✅ Dependencies installed

### Components (Basic)
- ✅ Root layout with providers
- ✅ NavBar (placeholder)
- ✅ Footer (placeholder)
- ✅ HomePage (placeholder)

## 🚀 Get Started (3 Steps)

### Step 1: Copy Public Assets

Manually copy these folders from your React app:

```
From: lavangroup-fullstack-ecommerce-main\web\public\
To:   nextjs\public\

Copy:
  - textures/
  - icons/
  - docs/
  - manifest.json
  - logo.png
  - logo1.png
```

### Step 2: Configure Firebase

Update `nextjs/.env.local` with your Firebase credentials from the React app:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc

# API Backend
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000

# Cloudinary (if used)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
```

### Step 3: Run the App

```bash
# Terminal 1: Start Express backend
cd server
npm start

# Terminal 2: Start Next.js
cd nextjs
npm run dev
```

Open http://localhost:3000

## 📋 Next Steps

The core infrastructure is ready. Now you need to migrate your components:

### Priority 1: High-Impact Components
Migrate these first for visible progress:

1. **ProductCard** - Shows products
2. **ProductList** - Lists products
3. **Carousel** - Homepage carousel
4. **Category components** - Navigation

### Priority 2: E-commerce Features
5. **Cart components** (CartItem, QuickCart)
6. **Search functionality**
7. **User authentication pages** (Login, Register)

### Priority 3: Admin & Special Features
8. **Admin Panel** - Product management
9. **User Management**
10. **Order flow pages**

## 📖 Full Migration Guide

For detailed migration instructions, see:
- **MIGRATION_GUIDE.md** - Complete step-by-step guide
- **README.md** - Project overview

## 🔑 Key Concepts

### Server vs Client Components

**Server Components** (default, no directive needed):
- Can fetch data directly
- Better for SEO
- Smaller JavaScript bundle
- Use for static content

**Client Components** (add 'use client'):
- Use React hooks
- Event handlers (onClick, onChange)
- Browser APIs (window, localStorage)
- Redux hooks

### Example Migration

**React Component:**
```jsx
// components/ProductCard.jsx
import { useSelector } from 'react-redux';

function ProductCard({ product }) {
  const user = useSelector(state => state.user);
  return <div>{product.name}</div>;
}
```

**Next.js Component:**
```tsx
// components/ProductCard.tsx
'use client';

import { useAppSelector } from '@/lib/redux/hooks';

interface Props {
  product: { שם: string; 'מחיר רגיל': number };
}

export default function ProductCard({ product }: Props) {
  const user = useAppSelector(state => state.user);
  return <div>{product.שם}</div>;
}
```

## 🎯 SEO Benefits

Once components are migrated, you'll get:

1. **Server-Side Rendering (SSR)**
   - Product pages render on server
   - Google can crawl content
   - Better initial load time

2. **Static Generation (SSG)**
   - Category pages pre-rendered
   - Ultra-fast loading
   - Reduced server load

3. **Metadata API**
   - Dynamic meta tags per page
   - Better social media sharing
   - Improved search rankings

4. **Image Optimization**
   - Automatic image optimization
   - Lazy loading
   - WebP format

## 🐛 Common Issues

**"Can't use hooks" error:**
- Add `'use client'` at top of file

**"Window is not defined":**
- Wrap in `typeof window !== 'undefined'`
- Add `'use client'` directive

**Styles not loading:**
- Import global CSS in layout.tsx (already done)
- Check Tailwind config (already done)

**Redux not working:**
- Use `useAppSelector` instead of `useSelector`
- Use `useAppDispatch` instead of `useDispatch`

## 📞 Testing Checklist

Before going to production:

- [ ] Homepage loads with products
- [ ] Categories display correctly
- [ ] Add to cart works
- [ ] Cart persists across refresh
- [ ] User login/logout works
- [ ] Real-time updates via WebSocket
- [ ] Admin panel functions
- [ ] Mobile responsive
- [ ] RTL layout works (Hebrew)
- [ ] SEO metadata on all pages

## 🎊 You're Ready!

The foundation is solid. Follow the MIGRATION_GUIDE.md to migrate components systematically.

Your Next.js app will have:
- ⚡ Better performance
- 🔍 Excellent SEO
- 🎨 Modern architecture
- 📱 Great mobile experience
- 🌐 Full i18n support

**Happy coding! 🚀**
