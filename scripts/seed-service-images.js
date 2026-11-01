const mongoose = require('mongoose');

const uri = 'mongodb+srv://sachinthaweerakoon81_db_user:CxCgXmtFChXNmB3c@salonappoinment.jcxcseu.mongodb.net/salon_catalog?retryWrites=true&w=majority&appName=salonappoinment';

const map = {
  'Classic Haircut & Styling': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80',
  'Deluxe Facial Treatment': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80',
  'Gel Manicure & Pedicure': 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80',
  'Balayage Color & Highlights': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
  'Bridal Haute Coiffure': 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
  'Aromatherapy Hair Spa': 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=600&q=80'
};

async function run() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    const col = mongoose.connection.collection('serviceitems');
    for (const [name, imageUrl] of Object.entries(map)) {
      const res = await col.updateMany({ name }, { $set: { imageUrl } });
      console.log(`Updated "${name}": ${res.modifiedCount} documents.`);
    }
    // Also set fallback image for any other items
    const fallbackRes = await col.updateMany(
      { $or: [{ imageUrl: { $exists: false } }, { imageUrl: '' }, { imageUrl: null }] },
      { $set: { imageUrl: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80' } }
    );
    console.log(`Fallback images set for remaining items: ${fallbackRes.modifiedCount}`);
    await mongoose.disconnect();
    console.log('MongoDB image synchronization complete.');
  } catch (err) {
    console.error('Failed to sync images with MongoDB:', err.message);
  }
}

run();
