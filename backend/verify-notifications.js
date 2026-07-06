const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongo_url = process.env.MONGO_URL || 'mongodb://localhost:27017/fromagerie_db';

mongoose.connect(mongo_url).then(async () => {
  const Order = require('./models/Order');
  const Notification = require('./models/Notification');
  
  const orders = await Order.find({}).limit(10);
  console.log('Orders in DB:', orders.length);
  orders.forEach((order, i) => {
    console.log(`\nOrder ${i+1}:`);
    console.log('  ID:', order._id);
    console.log('  Commercial:', order.commercial);
    console.log('  CreatedBy:', order.createdBy);
    console.log('  Status:', order.status);
  });
  
  const notifications = await Notification.find({}).limit(10);
  console.log('\n\nNotifications in DB:', notifications.length);
  notifications.forEach((notif, i) => {
    console.log(`\nNotification ${i+1}:`);
    console.log('  Title:', notif.title);
    console.log('  Message:', notif.message);
    console.log('  Recipient:', notif.recipient);
    console.log('  Read:', notif.read);
    console.log('  Data:', notif.data);
  });
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
