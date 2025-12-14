# Image Migration to Cloudinary

This script migrates all external product images to Cloudinary.

## What it does

1. Connects to your MongoDB database
2. Finds all products with external image URLs (not Cloudinary)
3. Uploads each image to Cloudinary
4. Updates the database with the new Cloudinary URLs
5. Shows a progress report

## Prerequisites

Make sure your `.env` file contains:
```
MONGO_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=deajzugwj
CLOUDINARY_UPLOAD_PRESET=f3fhtmsf
```

## How to run

From the **nextjs** directory:

```bash
node server/scripts/migrateImagesToCloudinary.js
```

## What happens

- ✅ **Already on Cloudinary** → Skipped (no action needed)
- 📤 **External URL** → Uploads to Cloudinary and updates database
- ⏭️ **No image** → Skipped
- ❌ **Upload fails** → Logged as error (product not updated)

## After migration

Once all images are migrated, you can:
1. Remove external domains from `next.config.js`
2. Only keep Cloudinary domains:
   ```js
   remotePatterns: [
     { protocol: 'https', hostname: 'res.cloudinary.com' },
     { protocol: 'https', hostname: '**.cloudinary.com' }
   ]
   ```

## Safety

- ✅ **Non-destructive** - Original URLs are backed up in MongoDB
- ✅ **Idempotent** - Can be run multiple times safely
- ✅ **Progress tracking** - Shows which products are processed
- ✅ **Error handling** - Failed uploads don't crash the script

## Example output

```
🚀 Starting image migration to Cloudinary...

✅ Connected to MongoDB

📦 Found 150 products in database

[1/150] Processing: מוצר לדוגמה
  📤 Uploading: https://tambour.co.il/image.jpg...
  ✅ Migrated successfully!

[2/150] Processing: מוצר אחר
  ✓ Already on Cloudinary - skipping

...

==================================================
📊 MIGRATION SUMMARY
==================================================
✅ Successfully migrated: 87
⏭️  Skipped (already migrated): 60
❌ Failed: 3
📦 Total products: 150
==================================================

🎉 Migration complete! You can now remove external domains from next.config.js
```


