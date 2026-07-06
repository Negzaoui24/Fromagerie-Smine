const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongo_url = process.env.MONGO_URL || 'mongodb://localhost:27017/fromagerie_db';

mongoose.connect(mongo_url).then(async () => {
  const Order = require('./models/Order');
  const Notification = require('./models/Notification');
  
  const orders = await Order.find({}).limit(10).populate('commercial', 'email role').populate('client', 'email');
  console.log('Orders in DB:', orders.length);
  orders.forEach((order, i) => {
    console.log(`Order ${i+1}:`, order._id);
    console.log('  - Commercial:', order.commercial ? order.commercial.email : 'N/A');
    console.log('  - Client:', order.client ? order.client.email : 'N/A');
    console.log('  - Status:', order.status);
    console.log('  - Created:', order.createdAt);
  });
  
  console.log('\n---\n');
  
  const notifications = await Notification.find({}).limit(10);
  console.log('Notifications in DB:', notifications.length);
  notifications.forEach((notif, i) => {
    console.log(`Notification ${i+1}:`, notif.title);
    console.log('  - Recipient:', notif.recipient);
    console.log('  - Read:', notif.read);
  });
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
