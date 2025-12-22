# בדיקת ביצועים בלוקאל - מדריך

## שיטות בדיקה

### 1. Lighthouse ב-Chrome DevTools (המומלץ ביותר)

**שלבים:**
1. הרץ את הפרויקט:
   ```bash
   cd gh/web
   npm run dev
   ```

2. פתח את האתר בדפדפן:
   ```
   http://localhost:3000
   ```

3. פתח Chrome DevTools:
   - לחץ `F12` או `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - או: קליק ימני → "Inspect"

4. עבור לטאב **Lighthouse**:
   - אם לא רואה את הטאב, לחץ על `>>` ובחר Lighthouse

5. הגדר את הבדיקה:
   - בחר **Desktop** או **Mobile**
   - סמן את **Performance** (ואפשר גם Accessibility, Best Practices, SEO)
   - לחץ **Analyze page load**

6. חכה לסיום הבדיקה (30-60 שניות)

7. בדוק את התוצאות:
   - **Performance Score**: צריך להיות 90+
   - **Core Web Vitals**:
     - LCP: < 2.5s
     - FCP: < 1.8s
     - TBT: < 200ms
     - CLS: < 0.1

**טיפים:**
- הרץ את הבדיקה מספר פעמים וממוצע
- סגור טאבים אחרים בדפדפן
- השתמש ב-Incognito mode כדי למנוע extensions

---

### 2. Bundle Analyzer (בדיקת גודל הקבצים)

**שלבים:**
1. בנה את הפרויקט עם analyzer:
   ```bash
   cd gh/web
   ANALYZE=true npm run build
   ```

2. זה יפתח אוטומטית דפדפן עם ויזואליזציה של ה-bundles

3. בדוק:
   - גודל כל chunk
   - קבצים גדולים שצריך לספליט
   - תלויות כבדות

---

### 3. Performance Tab ב-Chrome DevTools

**שלבים:**
1. פתח Chrome DevTools (`F12`)
2. עבור לטאב **Performance**
3. לחץ על **Record** (הכפתור האדום)
4. רענן את הדף (`Ctrl+R` / `Cmd+R`)
5. חכה שהדף יטען לגמרי
6. לחץ **Stop** (או `Ctrl+E` / `Cmd+E`)

7. בדוק:
   - **Main Thread** - כמה זמן עובד
   - **Network** - מהירות טעינת קבצים
   - **FPS** - האם יש lag
   - **Long Tasks** - משימות ארוכות (>50ms)

---

### 4. Network Tab (בדיקת מהירות טעינה)

**שלבים:**
1. פתח Chrome DevTools → **Network** tab
2. רענן את הדף (`Ctrl+R`)
3. בדוק:
   - **Load time** - זמן טעינה כולל
   - **DOMContentLoaded** - מתי ה-DOM מוכן
   - **Load** - מתי כל המשאבים נטענו
   - גודל קבצים (Size/Time)
   - **Throttling** - אפשר להאט את החיבור (Slow 3G) לבדיקה

---

### 5. React DevTools Profiler

**שלבים:**
1. התקן את React DevTools extension
2. פתח DevTools → טאב **Profiler**
3. לחץ **Record**
4. אינטראקציה עם האתר
5. לחץ **Stop**
6. בדוק:
   - קומפוננטים שמתרנדרים לאט
   - Re-renders מיותרים

---

## השוואה לפני ואחרי

### לפני התיקונים:
- Performance Score: ~83
- LCP: ~2.2s
- FCP: ~0.6s
- TBT: ~60ms
- CLS: ~0.059
- Bundle Size: גדול יותר

### אחרי התיקונים (צפוי):
- Performance Score: 90-95
- LCP: ~1.5s
- FCP: ~0.5s
- TBT: ~30ms
- CLS: ~0.05
- Bundle Size: קטן יותר (242 KiB פחות)

---

## בדיקות נוספות

### בדיקת Production Build

```bash
cd gh/web
npm run build
npm run start
```

אז בדוק ב-`http://localhost:3000` עם Lighthouse.

**למה זה חשוב?**
- Development mode איטי יותר
- Production build מייצג את הביצועים האמיתיים

---

### בדיקת Mobile Performance

1. ב-Lighthouse, בחר **Mobile**
2. או: Chrome DevTools → Toggle device toolbar (`Ctrl+Shift+M`)
3. בחר מכשיר (iPhone, Pixel, וכו')
4. הרץ Lighthouse

---

## מה לבדוק ספציפית

### ✅ Font Display
- בדוק ב-Network tab: האם הפונטים נטענים מהר?
- בדוק ב-Lighthouse: האם יש אזהרה על "Font display"?

### ✅ Code Splitting
- בדוק ב-Network tab: כמה chunks נטענים בהתחלה?
- בדוק ב-Lighthouse: האם יש "Reduce unused JavaScript"?

### ✅ Third-Party Scripts
- בדוק ב-Network tab: מתי GTM ו-Google Translate נטענים?
- צריך להיות אחרי שהדף כבר נטען

### ✅ Main Thread Work
- בדוק ב-Performance tab: כמה זמן עובד ה-Main Thread?
- צריך להיות פחות מ-2 שניות

---

## פתרון בעיות

### אם הביצועים לא השתפרו:

1. **נקה את ה-cache:**
   ```bash
   cd gh/web
   rm -rf .next
   npm run build
   ```

2. **בדוק שהשינויים נשמרו:**
   - פתח את הקבצים שעדכנתי
   - ודא שהקוד נכון

3. **בדוק ב-Production mode:**
   - Development mode איטי יותר
   - תמיד בדוק עם `npm run build && npm run start`

4. **נקה את ה-cache של הדפדפן:**
   - `Ctrl+Shift+Delete` → Clear cache
   - או: Incognito mode

---

## כלים נוספים

### WebPageTest
- https://www.webpagetest.org/
- בדיקה מפורטת יותר
- אפשר לבדוק ממיקומים שונים

### Chrome User Experience Report
- https://developers.google.com/web/tools/chrome-user-experience-report
- נתונים אמיתיים ממשתמשים

---

## סיכום

**הדרך הכי מהירה לבדוק:**
1. `npm run dev`
2. פתח `http://localhost:3000`
3. `F12` → Lighthouse → Analyze
4. השווה את התוצאות

**לבדיקה מדויקת יותר:**
1. `npm run build && npm run start`
2. Lighthouse ב-Production mode

