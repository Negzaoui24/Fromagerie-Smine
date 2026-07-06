#!/usr/bin/env node

/**
 * Script pour afficher la liste des administrateurs et commerciaux avec leurs numéros
 * Utilisation: node list-users.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
      console.error('❌ MONGO_URL non défini dans .env');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUrl);
    console.log('✅ Connecté à MongoDB\n');
  } catch (err) {
    console.error('❌ Erreur connexion MongoDB:', err.message);
    process.exit(1);
  }
};

const listUsers = async () => {
  try {
    const users = await User.find({
      role: { $in: ['admin', 'super_admin', 'commercial'] }
    }).sort({ role: -1, createdAt: -1 });

    if (users.length === 0) {
      console.log('ℹ️ Aucun admin ou commercial trouvé\n');
      return;
    }

    console.log('═'.repeat(80));
    console.log('👥 ADMINISTRATEURS & COMMERCIAUX');
    console.log('═'.repeat(80) + '\n');

    users.forEach((user, i) => {
      const statusPhone = user.phone ? '✅' : '❌';
      console.log(`${i + 1}. ${user.username}`);
      console.log(`   Rôle: ${user.role}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ${statusPhone} Téléphone: ${user.phone || '(aucun)'}`);
      console.log('');
    });

    const withPhone = users.filter(u => u.phone).length;
    console.log('═'.repeat(80));
    console.log(`\n📊 Résumé:`);
    console.log(`   • Total: ${users.length}`);
    console.log(`   • Avec téléphone: ${withPhone}`);
    console.log(`   • Sans téléphone: ${users.length - withPhone}\n`);

  } catch (err) {
    console.error('❌ Erreur:', err.message);
  }
};

const main = async () => {
  await connectDB();
  await listUsers();
  await mongoose.disconnect();
};

main().catch((err) => {
  console.error('Erreur:', err);
  process.exit(1);
});
