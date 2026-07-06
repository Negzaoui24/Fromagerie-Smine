const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongo_url = process.env.MONGO_URL || 'mongodb://localhost:27017/fromagerie_db';

mongoose.connect(mongo_url).then(async () => {
  const Notification = require('./models/Notification');
  
  // Test with string ID (like from JWT)
  const stringId = '6a4b8641ebfb8af5691842b2';
  const objectId = new mongoose.Types.ObjectId(stringId);
  
  console.log('Query 1: String ID');
  const result1 = await Notification.find({ recipient: stringId });
  console.log('Results:', result1.length);
  
  console.log('\nQuery 2: ObjectId');
  const result2 = await Notification.find({ recipient: objectId });
  console.log('Results:', result2.length);
  
  console.log('\nAll notifications:');
  const all = await Notification.find({});
  console.log('Total:', all.length);
  all.forEach((n, i) => {
    console.log(i+1 + '. Recipient: ' + n.recipient + ', Title: ' + n.title);
  });
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
