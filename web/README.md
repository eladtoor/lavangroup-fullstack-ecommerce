# Lavangroup E-commerce - Next.js Migration

This is a Next.js 14 migration of the Lavangroup e-commerce platform with App Router for improved SEO and performance.

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Express backend server running on port 5000 (from /server directory)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
   - Copy Firebase config from `/web/.env` or Firebase console
   - Update `.env.local` with your values

3. Copy public assets:
```bash
# Copy from React app
cp -r ../web/public/textures ./public/
cp -r ../web/public/icons ./public/
cp -r ../web/public/docs ./public/
cp ../web/public/manifest.json ./public/
cp ../web/public/logo.png ./public/
```

### Running the Development Server

1. Start the Express backend (in /server directory):
```bash
cd ../server
npm start
```

2. Start Next.js development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles
│   └── providers.tsx      # Redux & Firebase providers
├── components/            # React components
│   ├── NavBar.tsx        # Navigation (client component)
│   ├── Footer.tsx        # Footer
│   └── pages/            # Page components
├── lib/                  # Core libraries
│   ├── redux/           # Redux store & slices
│   ├── firebase.ts      # Firebase configuration
│   └── api.ts           # API client
└── utils/               # Utility functions
```

## Key Features

### SEO Optimizations
- ✅ Server-Side Rendering (SSR) for dynamic pages
- ✅ Static Site Generation (SSG) for category pages
- ✅ Metadata API for dynamic SEO tags
- ✅ Image optimization with next/image
- ✅ Automatic sitemap generation

### Architecture
- **State Management**: Redux Toolkit with Redux Persist
- **Authentication**: Firebase Auth
- **Database**: Firestore for cart, MongoDB for products
- **Real-time Updates**: WebSocket connection to Express server
- **Styling**: Tailwind CSS with RTL support
- **Internationalization**: Hebrew (default) + English

### Backend Integration
- Express API proxied through Next.js rewrites
- WebSocket connection for real-time product updates
- Firebase for authentication and cart persistence

## Migration Status

- [x] Next.js 14 project setup
- [x] Tailwind CSS configuration
- [ ] Redux store migration
- [ ] Firebase auth migration
- [ ] Component migration (in progress)
- [ ] Page routes migration
- [ ] API integration
- [ ] WebSocket setup
- [ ] i18n setup with RTL

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

See `.env.local` for required environment variables.

## Deployment

The application can be deployed to:
- Vercel (recommended for Next.js)
- Any Node.js hosting platform
- Docker container

Keep the Express backend running separately or migrate API routes to Next.js API routes for serverless deployment.
