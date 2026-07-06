const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongo_url = process.env.MONGO_URL || 'mongodb://localhost:27017/fromagerie_db';

mongoose.connect(mongo_url).then(async () => {
  const Categorie = require('./models/Categorie');
  const Produit = require('./models/Product');
  const User = require('./models/User');
  
  try {
    // Get or create category
    let category = await Categorie.findOne({ nom: 'Fromages' });
    if (!category) {
      category = new Categorie({
        nom: 'Fromages',
        description: 'Fromages frais et affinés',
        image: 'https://via.placeholder.com/150'
      });
      await category.save();
      console.log('✓ Category created:', category._id);
    } else {
      console.log('✓ Category found:', category._id);
    }
    
    // Get or create products
    let product1 = await Produit.findOne({ name: 'Fromage Blanc' });
    if (!product1) {
      product1 = new Produit({
        name: 'Fromage Blanc',
        description: 'Fromage blanc frais',
        prixAchat: 50,
        prixVente: 100,
        prixVenteGros: 80,
        uniteGros: 'kg',
        unite: 'kg',
        quantite: 50,
        venteParGros: true,
        categorie: category._id,
        images: ['https://via.placeholder.com/150']
      });
      await product1.save();
      console.log('✓ Product 1 created:', product1._id);
    } else {
      console.log('✓ Product 1 found:', product1._id);
    }
    
    let product2 = await Produit.findOne({ name: 'Fromage Mozzarella' });
    if (!product2) {
      product2 = new Produit({
        name: 'Fromage Mozzarella',
        description: 'Mozzarella fraîche',
        prixAchat: 80,
        prixVente: 150,
        prixVenteGros: 120,
        uniteGros: 'kg',
        unite: 'kg',
        quantite: 30,
        venteParGros: true,
        categorie: category._id,
        images: ['https://via.placeholder.com/150']
      });
      await product2.save();
      console.log('✓ Product 2 created:', product2._id);
    } else {
      console.log('✓ Product 2 found:', product2._id);
    }
    
    // Get users
    const commercial = await User.findOne({ email: 'test@gmail.com' });
    const client = await User.findOne({ email: 'client@test.com' });
    const admin = await User.findOne({ role: 'admin' });
    
    console.log('\n✓ Users found:');
    console.log('  - Commercial:', commercial.email, '(ID:', commercial._id, ')');
    console.log('  - Client:', client.email, '(ID:', client._id, ')');
    console.log('  - Admin:', admin.email, '(ID:', admin._id, ')');
    
    // Now create an order
    const Order = require('./models/Order');
    const order = new Order({
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
      status: 'pending',
      comment: 'Test order'
    });
    
    await order.save();
    console.log('\n✓ Order created:');
    console.log('  ID:', order._id);
    console.log('  Status:', order.status);
    console.log('  Commercial:', order.commercial);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}).catch(err => {
  console.error('Connection Error:', err.message);
  process.exit(1);
});
