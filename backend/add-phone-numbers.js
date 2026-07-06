#!/usr/bin/env node

/**
 * Script pour ajouter des numéros de téléphone aux administrateurs et commerciaux
 * Format accepté: +33612345678 (international avec +)
 * 
 * Utilisation:
 * node add-phone-numbers.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

const User = require('./models/User');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
};

const normalizePhone = (phone) => {
  // Supprimer les espaces et caractères spéciaux
  let cleaned = phone.replace(/[\s\-().]/g, '');
  
  // Ajouter le + s'il manque
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
};

const validatePhone = (phone) => {
  const cleaned = normalizePhone(phone);
  // Vérifier format basique: + suivi d'au moins 10 chiffres
  return /^\+\d{10,}$/.test(cleaned);
};

const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
      console.error('❌ MONGO_URL non défini dans .env');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUrl);
    console.log('✅ Connecté à MongoDB');
  } catch (err) {
    console.error('❌ Erreur connexion MongoDB:', err.message);
    process.exit(1);
  }
};

const addPhoneNumbers = async () => {
  try {
    // Récupérer les admins et commerciaux
    const users = await User.find({
      role: { $in: ['admin', 'super_admin', 'commercial'] }
    }).sort({ createdAt: -1 });

    if (users.length === 0) {
      console.log('ℹ️ Aucun admin ou commercial trouvé');
      return;
    }

    console.log(`\n📋 ${users.length} utilisateur(s) trouvé(s):\n`);

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`${i + 1}. ${user.username} (${user.role})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Téléphone actuel: ${user.phone || '(aucun)'}\n`);
    }

    console.log('═'.repeat(60));
    console.log('AJOUT DES NUMÉROS DE TÉLÉPHONE');
    console.log('═'.repeat(60) + '\n');

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      let phone = '';
      let isValid = false;

      while (!isValid) {
        phone = await question(
          `Numéro pour ${user.username} (${user.role}) [format: +33612345678 ou vide pour passer]: `
        );

        if (phone === '') {
          console.log('↷ Passé\n');
          break;
        }

        if (!validatePhone(phone)) {
          console.log('❌ Format invalide! Utilisez +33612345678 ou 33612345678\n');
          continue;
        }

        isValid = true;
      }

      if (phone) {
        user.phone = normalizePhone(phone);
        await user.save();
        console.log(`✅ ${user.username} → ${user.phone}\n`);
      }
    }

    console.log('\n✅ Mise à jour terminée!');
    
    // Afficher un résumé
    const updated = await User.find({
      role: { $in: ['admin', 'super_admin', 'commercial'] },
      phone: { $ne: '' }
    });

    console.log(`\n📊 Résumé:`);
    console.log(`   • Total utilisateurs: ${users.length}`);
    console.log(`   • Avec téléphone: ${updated.length}`);
    console.log(`   • Sans téléphone: ${users.length - updated.length}\n`);

  } catch (err) {
    console.error('❌ Erreur:', err.message);
  }
};

const main = async () => {
  console.log('═'.repeat(60));
  console.log('🔐 GESTIONNAIRE DE NUMÉROS DE TÉLÉPHONE');
  console.log('═'.repeat(60) + '\n');

  await connectDB();
  await addPhoneNumbers();

  rl.close();
  await mongoose.disconnect();
  console.log('✅ Déconnecté de MongoDB\n');
};

main().catch((err) => {
  console.error('Erreur:', err);
  process.exit(1);
});
