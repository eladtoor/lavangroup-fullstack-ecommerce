# Render Deployment Optimizations

## ⚡ Configured for Render Plan (512MB RAM, 0.5 CPU)

## בעיות שתוקנו (Issues Fixed)

### 1. **502 Bad Gateway - Server Crashes**
**בעיה:** השרת קורס בגלל מחסור בזיכרון

**פתרון (512MB RAM, 0.5 CPU):**
- ✅ הגבלות זיכרון: `--max-old-space-size=460`
- ✅ Next.js image optimization כבוי (חוסך זיכרון)
- ✅ Connection pool מוגבל: `maxPoolSize: 10`
- ✅ תיקון Change Streams עם timeout וסגירה נכונה
- ✅ Graceful shutdown למניעת חיבורים תלויים
- ✅ CPU מהיר יותר (0.5 במקום 0.1) = builds מהירים יותר

### 2. **תמונות לא עולות / איטיות**
**בעיה:** תמונות לוקחות זמן להיטען

**פתרון (512MB RAM):**
```javascript
images: {
  unoptimized: true, // Use Cloudinary instead
}
```

**חובה:** השתמש ב-Cloudinary transformations:
```
https://res.cloudinary.com/YOUR_CLOUD/image/upload/w_400,f_auto,q_auto/image.jpg
```

**פרמטרים חשובים:**
- `w_400` - רוחב 400px
- `f_auto` - פורמט אוטומטי (WebP/AVIF)
- `q_auto` - איכות אוטומטית
- `c_fill` - חיתוך חכם

## הגדרות נדרשות ב-Render

### Environment Variables (512MB RAM)
```bash
# Memory limit - 460MB for Node (leaves 52MB for system)
NODE_OPTIONS=--max-old-space-size=460

# MongoDB with connection pooling
MONGO_URI=mongodb+srv://...

# Firebase Admin (REQUIRED)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Next.js
NEXT_PUBLIC_API_URL=https://your-site.onrender.com
NODE_ENV=production
```

### Build Command (with caching)
```bash
cd web && npm ci --prefer-offline && npm run build
```

**Why `npm ci`?**
- Faster than `npm install`
- Uses `package-lock.json` exactly
- Cleans node_modules first
- Better caching on Render

### Start Command
```bash
cd server && npm ci && npm start
```

### Build Cache Warning
If you see: `⚠ No build cache found`

**Fix:**
1. Use `npm ci` instead of `npm install` (done ✅)
2. Add to Render Environment Variables:
   ```
   NEXT_TELEMETRY_DISABLED=1
   ```
3. Render automatically caches `node_modules` and `.next/cache`

## מעקב אחרי קריסות (Monitoring)

### סימנים לבעיות:
1. **High Memory** → Server restart
2. **MongoDB timeouts** → Connection pool מלא
3. **WebSocket errors** → Change stream crashed

### לוגים חשובים:
```bash
✅ MongoDB connected
✅ Combined server listening on 3000
🟢 Change Stream initialized
⚠️ Change Stream closed, will retry...
```

## אופטימיזציות נוספות (Optional)

### 1. השתמש ב-Redis לקאשינג (במקום localStorage)
```bash
# Render Redis (Free 25MB)
REDIS_URL=redis://...
```

### 2. העבר תמונות ל-CDN
- כל התמונות ב-Cloudinary
- הגדר auto-format: `f_auto`
- הגדר auto-quality: `q_auto`

### 3. הקטן bundle size
```bash
npm run build -- --analyze
```

## טיפים לפיתוח

### בדיקת זיכרון לוקלית (512MB):
```bash
node --max-old-space-size=460 server/combined.js
```

### מעקב אחרי זיכרון:
```javascript
console.log('Memory:', process.memoryUsage().heapUsed / 1024 / 1024, 'MB');
```

## שאלות נפוצות (FAQ)

**Q: למה התמונות איטיות?**
A: Next.js Image Optimization כבוי. השתמש ב-Cloudinary transformations.

**Q: השרת עדיין קורס?**
A: בדוק:
1. `NODE_OPTIONS` מוגדר ב-Render
2. MongoDB connection pool לא מלא
3. אין memory leaks ב-WebSocket

**Q: איך אני משדרג ל-Render Paid?**
A: Render Starter ($7/mo) = 512MB → 2GB RAM. כדאי!

