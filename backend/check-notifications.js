const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongo_url = process.env.MONGO_URL || 'mongodb://localhost:27017/fromagerie_db';

mongoose.connect(mongo_url).then(async () => {
  const User = require('./models/User');
  const Order = require('./models/Order');
  const Notification = require('./models/Notification');
  
  // Find the commercial user
  const commercial = await User.findOne({ email: 'test@gmail.com' });
  console.log('Commercial found:', commercial ? 'Yes' : 'No');
  if (commercial) {
    console.log('Commercial ID:', commercial._id);
    console.log('Commercial Role:', commercial.role);
    console.log('Commercial Phone:', commercial.phone);
    
    // Check for orders for this commercial
    const orders = await Order.find({ commercial: commercial._id }).limit(5);
    console.log('\nOrders for this commercial:', orders.length);
    if (orders.length > 0) {
      orders.forEach((order, i) => {
        console.log(`Order ${i+1} ID:`, order._id, 'Status:', order.status);
      });
    }
  }
  
  // Check all notifications
  const allNotifications = await Notification.find({}).limit(10);
  console.log('\nTotal notifications in DB:', allNotifications.length);
  
  if (commercial) {
    // Check notifications for this commercial
    const commercialNotifications = await Notification.find({ recipient: commercial._id }).limit(5);
    console.log('Notifications for this commercial:', commercialNotifications.length);
    if (commercialNotifications.length > 0) {
      commercialNotifications.forEach((notif, i) => {
        console.log(`Notification ${i+1}: ${notif.title} - Read: ${notif.read}`);
      });
    }
  }
  
  // Also check for admin notifications (from orders)
  const admins = await User.find({ role: 'admin' });
  console.log('\nAdmin users found:', admins.length);
  admins.forEach(admin => {
    console.log('Admin email:', admin.email);
  });
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
