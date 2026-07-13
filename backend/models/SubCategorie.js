const mongoose = require('mongoose');

const SubCategorieSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, "Le nom de la sous-famille est obligatoire"],
    unique: true,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('SubCategorie', SubCategorieSchema);
