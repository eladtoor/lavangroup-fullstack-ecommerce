require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;
const MONGO_URI = process.env.MONGO_URI;
const BATCH_DELAY = 500;

const isCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.includes('cloudinary.com');
};

const uploadToCloudinary = async (imageUrl) => {
  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        file: imageUrl,
        upload_preset: CLOUDINARY_UPLOAD_PRESET,
      },
      { timeout: 30000 }
    );
    return { success: true, url: response.data.secure_url };
  } catch (error) {
    return { success: false, reason: error.message.substring(0, 50) };
  }
};

const migrateTestCollection = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 MIGRATING **TEST** COLLECTION TO CLOUDINARY');
  console.log('='.repeat(60) + '\n');

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    console.error('❌ Missing Cloudinary configuration');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const testCollection = db.collection('test'); // CORRECT COLLECTION!

    const externalProducts = await testCollection.find({
      תמונות: { $regex: /^https?:\/\/(?!.*cloudinary).*/ }
    }).toArray();

    console.log(`📦 Found ${externalProducts.length} products with external URLs in "test" collection\n`);

    let stats = { migrated: 0, failed: 0, empty: 0 };

    for (let i = 0; i < externalProducts.length; i++) {
      const product = externalProducts[i];
      const productName = product.שם || 'Unnamed Product';
      const percentage = ((i + 1) / externalProducts.length * 100).toFixed(1);

      process.stdout.write(`\r[${i + 1}/${externalProducts.length}] (${percentage}%) Processing...`);

      const imageUrl = product.תמונות;

      if (!imageUrl || imageUrl.trim() === '') {
        stats.empty++;
        continue;
      }

      const result = await uploadToCloudinary(imageUrl);

      if (result.success) {
        await testCollection.updateOne(
          { _id: product._id },
          { $set: { תמונות: result.url } }
        );
        stats.migrated++;
        process.stdout.write(`\r[${i + 1}/${externalProducts.length}] ✅ ${productName.substring(0, 40)}\n`);
      } else {
        await testCollection.updateOne(
          { _id: product._id },
          { $set: { תמונות: '' } }
        );
        stats.failed++;
        process.stdout.write(`\r[${i + 1}/${externalProducts.length}] ❌ ${productName.substring(0, 40)}\n`);
      }

      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Successfully migrated:      ${stats.migrated} products`);
    console.log(`❌ Failed (set to empty):      ${stats.failed} products`);
    console.log(`⏭️  Empty images:              ${stats.empty} products`);
    console.log(`📦 Total processed:            ${externalProducts.length} products`);
    console.log('='.repeat(60));
    
    if (stats.migrated > 0) {
      console.log('\n🎉 Database updated successfully!');
      console.log('💡 Restart backend server to see changes');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB\n');
  }
};

migrateTestCollection();


