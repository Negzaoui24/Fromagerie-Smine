const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongo_url = process.env.MONGO_URL || 'mongodb://localhost:27017/fromagerie_db';

mongoose.connect(mongo_url).then(async () => {
  const Notification = require('./models/Notification');
  
  // Test different queries
  const stringId = '6a4b8641ebfb8af5691842b2';
  const objectId = new mongoose.Types.ObjectId(stringId);
  
  console.log('Test 1: Direct string (should not work)');
  const test1 = await Notification.countDocuments({ recipient: stringId });
  console.log('Count:', test1);
  
  console.log('\nTest 2: ObjectId');
  const test2 = await Notification.countDocuments({ recipient: objectId });
  console.log('Count:', test2);
  
  console.log('\nTest 3: Find with ObjectId');
  const test3 = await Notification.find({ recipient: objectId });
  console.log('Count:', test3.length);
  test3.forEach((n, i) => {
    console.log(`${i+1}. ${n.title}`);
  });
  
  console.log('\nTest 4: Direct query in Model');
  const Notif = require('./models/Notification');
  const test4 = await Notif.find({ recipient: objectId });
  console.log('Count:', test4.length);
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
