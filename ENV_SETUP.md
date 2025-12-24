# קבצי Environment Variables הנדרשים

## 📁 תיקיית Server (`/server`)

צור קובץ `.env` בתיקיית `server` עם המשתנים הבאים:

```env
# MongoDB
MONGO_URI=mongodb+srv://USER:PASSWORD@HOST/DB?retryWrites=true&w=majority

# Firebase Admin SDK (JSON מלא בשורה אחת)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}

# Firebase Database URL
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.region.firebasedatabase.app

# Email (Gmail)
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_app_password

# Cloudinary (אם משתמשים)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000

# Node.js
NODE_ENV=development
NODE_OPTIONS=--max-old-space-size=460

# Payment (אם יש)
GROUP_PRIVATE_TOKEN=your_group_private_token
```

## 📁 תיקיית Web (`/web`)

צור קובץ `.env.local` בתיקיית `web` עם המשתנים הבאים:

```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Firebase Client Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset

# WebSocket (אם משתמשים)
NEXT_PUBLIC_WS_URL=ws://localhost:5000

# WhatsApp (אופציונלי)
NEXT_PUBLIC_WHATSAPP_NUMBER=972500000000

# Payment (אם יש)
NEXT_PUBLIC_GROUP_PRIVATE_TOKEN=your_group_private_token
```

## 📝 הוראות:

1. **Server**: צור קובץ `.env` בתיקיית `server/`
2. **Web**: צור קובץ `.env.local` בתיקיית `web/`
3. העתק את הערכים מהקובץ `web/render.env.example` והתאם אותם לסביבה שלך
4. **חשוב**: אל תעלה את קבצי ה-env ל-Git! הם כבר ב-`.gitignore`

## 🔑 איפה למצוא את הערכים:

- **Firebase**: Firebase Console > Project Settings > General / Service Accounts
- **MongoDB**: MongoDB Atlas > Connect > Connection String
- **Cloudinary**: Cloudinary Dashboard > Settings
- **Gmail**: Google Account > App Passwords (אם יש 2FA)

