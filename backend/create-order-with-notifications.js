const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongo_url = process.env.MONGO_URL || 'mongodb://localhost:27017/fromagerie_db';

mongoose.connect(mongo_url).then(async () => {
  const Order = require('./models/Order');
  const User = require('./models/User');
  const Notification = require('./models/Notification');
  const Produit = require('./models/Product');

  try {
    // Get product IDs
    const product1 = await Produit.findOne({ name: 'Fromage Blanc' });
    const product2 = await Produit.findOne({ name: 'Fromage Mozzarella' });
    const commercial = await User.findOne({ email: 'test@gmail.com' });
    const client = await User.findOne({ email: 'client@test.com' });
    const admin = await User.findOne({ role: 'admin' });

    // Simulate the buildOrder function to create notifications
    const newOrder = new Order({
      customerName: client._id,
      customerEmail: client.email,
      customerPhone: client.phone,
      customerLocation: '123 Test Street',
      commercial: commercial._id,
      createdBy: client._id,
      items: [
        {
          productId: product1._id,
          name: product1.name,
          quantity: 5,
          price: 80,
          unit: 'kg'
        },
        {
          productId: product2._id,
          name: product2.name,
          quantity: 3,
          price: 120,
          unit: 'kg'
        }
      ],
      comment: 'Test order 2'
    });

    const savedOrder = await newOrder.save();
    
    // Populate the order
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('commercial', 'username email phone')
      .populate('createdBy', 'username email');

    // Now create notifications manually
    const notifications = [];
    
    // Notification for commercial
    notifications.push({
      recipient: commercial._id,
      title: 'Nouvelle commande assignée',
      message: `Une nouvelle commande a été passée pour ${client.email}.`,
      data: {
        orderId: savedOrder._id,
        commercialId: commercial._id,
        customerEmail: client.email
      }
    });

    // Notification for admin
    notifications.push({
      recipient: admin._id,
      title: 'Nouvelle commande client',
      message: `Commande #${savedOrder._id} a été passée par ${client.email}.`,
      data: {
        orderId: savedOrder._id,
        commercialId: commercial._id
      }
    });

    // Save notifications
    if (notifications.length > 0) {
      const savedNotifications = await Notification.insertMany(notifications);
      console.log('✓ Notifications created:', savedNotifications.length);
      savedNotifications.forEach((notif, i) => {
        console.log(`  ${i+1}. Recipient: ${notif.recipient}, Title: ${notif.title}`);
      });
    }

    console.log('\n✓ Order created:', savedOrder._id);
    console.log('  Commercial:', commercial.email);
    console.log('  Client:', client.email);
    console.log('  Status:', savedOrder.status);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}).catch(err => {
  console.error('Connection Error:', err.message);
  process.exit(1);
});
