const mongoose = require('mongoose');

const ProduitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  quantite: { type: Number, default: 0 },
  prixAchat: { type: Number, default: 0 },
  prixVente: { type: Number, default: 0 },
  venteParGros: { type: Boolean, default: false },
  prixVenteGros: { type: Number, default: null },
  uniteGros: { type: String, default: null },
  unite: {
    type: String,
    enum: ['kg', 'litre', 'piece', 'carton'],
    default: 'piece'
  },
  
  // Liaison vers la catégorie
  categorie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categorie',
    required: false,
    default: null
  },

  images: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Produit', ProduitSchema);
