# Render Deployment Optimizations

## בעיות שתוקנו (Issues Fixed)

### 1. **502 Bad Gateway - Server Crashes**
**בעיה:** השרת קורס בגלל מחסור בזיכרון (Render Free Tier = 512MB RAM)

**פתרון:**
- ✅ הוספת הגבלות זיכרון: `--max-old-space-size=460`
- ✅ כיבוי אופטימיזציית תמונות של Next.js בפרודקשן
- ✅ הגבלת connection pool של MongoDB
- ✅ תיקון Change Streams עם timeout וסגירה נכונה
- ✅ Graceful shutdown למניעת חיבורים תלויים

### 2. **תמונות לא עולות / איטיות**
**בעיה:** Next.js מנסה לבצע אופטימיזציה לתמונות בשרת (אוכל זיכרון)

**פתרון:**
```javascript
images: {
  unoptimized: true, // Use Cloudinary optimization instead
}
```

**המלצה:** השתמש ב-Cloudinary transformations:
```
https://res.cloudinary.com/YOUR_CLOUD/image/upload/w_400,f_auto,q_auto/image.jpg
```

## הגדרות נדרשות ב-Render

### Environment Variables
```bash
# Memory limit
NODE_OPTIONS=--max-old-space-size=460

# MongoDB with connection pooling
MONGO_URI=mongodb+srv://...

# Firebase Admin (REQUIRED)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Next.js
NEXT_PUBLIC_API_URL=https://your-site.onrender.com
NODE_ENV=production
```

### Build Command
```bash
cd web && npm install && npm run build
```

### Start Command
```bash
cd server && npm install && npm start
```

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

### בדיקת זיכרון לוקלית:
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

