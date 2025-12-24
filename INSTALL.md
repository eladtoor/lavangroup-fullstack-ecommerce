# 📦 הוראות התקנה

## שלב 1: התקנת תלויות Server

```bash
cd server
npm install
```

## שלב 2: התקנת תלויות Web

```bash
cd ../web
npm install
```

## שלב 3: הגדרת קבצי Environment

### Server (`.env`)
צור קובץ `.env` בתיקיית `server/` עם המשתנים הנדרשים (ראה `ENV_SETUP.md`)

### Web (`.env.local`)
צור קובץ `.env.local` בתיקיית `web/` עם המשתנים הנדרשים (ראה `ENV_SETUP.md`)

## שלב 4: הרצת הפרויקט

### אופציה 1: הרצה נפרדת (2 טרמינלים)

**טרמינל 1 - Server:**
```bash
cd server
npm start
# או לפיתוח:
npm run dev  # אם יש script כזה
```

**טרמינל 2 - Web:**
```bash
cd web
npm run dev
```

### אופציה 2: הרצה משולבת (טרמינל אחד)

```bash
cd web
npm run dev:all
```

זה יריץ את השרת והווב יחד (דורש `concurrently`).

## ✅ בדיקה

- Server אמור לרוץ על: `http://localhost:5000`
- Web אמור לרוץ על: `http://localhost:3000`

## 📝 הערות

- ודא שיש לך Node.js גרסה 18 ומעלה
- ודא שקבצי ה-env מוגדרים לפני ההרצה
- אם יש שגיאות, בדוק את הקונסול

