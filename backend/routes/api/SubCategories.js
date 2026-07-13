const router = require("express").Router();
const SubCategorie = require("../../models/SubCategorie");
const Produit = require("../../models/Product");

router.get("/", async (req, res) => {
  try {
    const subcategories = await SubCategorie.find();
    res.status(200).json({ status: "ok", subcategories });
  } catch (err) {
    console.error("Erreur sous-familles:", err);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

router.post("/add", async (req, res) => {
  const { nom } = req.body;

  if (!nom || !nom.trim()) {
    return res.status(400).json({ status: "notok", msg: "Nom de sous-famille requis" });
  }

  try {
    const subcategorie = new SubCategorie({ nom: nom.trim() });
    await subcategorie.save();
    res.status(201).json({ status: "ok", subcategorie });
  } catch (err) {
    console.error("Erreur creation sous-famille:", err);
    if (err.code === 11000) {
      return res.status(400).json({ status: "notok", msg: "Sous-famille deja existante" });
    }
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

router.put("/update/:id", async (req, res) => {
  const { id } = req.params;
  const { nom } = req.body;

  if (!nom || !nom.trim()) {
    return res.status(400).json({ status: "notok", msg: "Nom de sous-famille requis" });
  }

  try {
    const subcategorie = await SubCategorie.findById(id);
    if (!subcategorie) {
      return res.status(404).json({ status: "notok", msg: "Sous-famille non trouvee" });
    }
    subcategorie.nom = nom.trim();
    await subcategorie.save();
    res.status(200).json({ status: "ok", subcategorie });
  } catch (err) {
    console.error("Erreur mise a jour sous-famille:", err);
    if (err.code === 11000) {
      return res.status(400).json({ status: "notok", msg: "Sous-famille deja existante" });
    }
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const productCount = await Produit.countDocuments({ sousCategorie: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({
        status: "notok",
        msg: "Impossible de supprimer la sous-famille : des produits y sont encore rattachés"
      });
    }

    const subcategorie = await SubCategorie.findById(req.params.id);
    if (!subcategorie) {
      return res.status(404).json({ status: "notok", msg: "Sous-famille non trouvee" });
    }

    await subcategorie.deleteOne();
    res.status(200).json({ status: "ok", msg: "Sous-famille supprimee avec succes" });
  } catch (err) {
    console.error("Erreur suppression sous-famille:", err);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

module.exports = router;
