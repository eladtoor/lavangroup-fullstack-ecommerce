# Lavangroup E-Commerce Platform

A production-ready full-stack e-commerce platform for building materials and paints. Built with Next.js 14, Node.js, MongoDB, and Firebase.

**Live Site:** [www.lavangroup.co.il](https://www.lavangroup.co.il)

## Tech Stack

![Next.js](https://img.shields.io/badge/-Next.js_14-000000?logo=next.js&logoColor=white&style=flat)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white&style=flat)
![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=node.js&logoColor=white&style=flat)
![MongoDB](https://img.shields.io/badge/-MongoDB-47A248?logo=mongodb&logoColor=white&style=flat)
![Firebase](https://img.shields.io/badge/-Firebase-FFCA28?logo=firebase&logoColor=white&style=flat)
![Tailwind](https://img.shields.io/badge/-Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white&style=flat)
![Redux](https://img.shields.io/badge/-Redux_Toolkit-764ABC?logo=redux&logoColor=white&style=flat)

## Key Features

- **Server-Side Rendering** - Next.js 14 App Router with SSR/SSG for optimal SEO and performance
- **Admin Dashboard** - Full product, category, and order management with role-based access
- **Dynamic Product System** - Support for variable products with attributes and pricing
- **Real-time Updates** - WebSocket integration for live data synchronization
- **SEO Optimized** - Dynamic meta tags, structured data, and semantic HTML
- **Payment Integration** - Secure checkout with Stripe
- **Multi-language Support** - Google Translate integration

## Architecture

```
├── web/          # Next.js 14 frontend (App Router, TypeScript)
├── server/       # Node.js + Express API
└── mobile/       # React Native app (optional)
```

## Quick Start

```bash
# Clone repository
git clone https://github.com/eladtoor/lavangroup-fullstack-ecommerce.git

# Install dependencies
cd server && npm install
cd ../web && npm install

# Start development servers
# Terminal 1: cd server && npm run dev
# Terminal 2: cd web && npm run dev
```

Requires `.env` files with MongoDB, Firebase, and Stripe credentials.

## Contact

**Elad Toorgeman**
[LinkedIn](https://www.linkedin.com/in/elad-toorgeman-3a27b8233) | [GitHub](https://github.com/eladtoor) | [eladtoorgeman@gmail.com](mailto:eladtoorgeman@gmail.com)
