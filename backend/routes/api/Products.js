const router = require("express").Router();
const fs = require("fs");
const path = require("path");
const Produit = require("../../models/Product");
const multer = require("multer");
const { uploadBuffer, destroyImage } = require("../../utils/cloudinary");

const upload = multer({ storage: multer.memoryStorage() });
const LOCAL_UPLOAD_DIR = path.join(__dirname, "../../uploads/products");
const IS_VERCEL = Boolean(process.env.VERCEL);

const parseBoolean = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value === "true" || value === "1" || value === "on";
  }
  return Boolean(value);
};

const saveLocalImage = async (file) => {
  if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
    fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  }

  const extension = path.extname(file.originalname) || ".jpg";
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
  const filePath = path.join(LOCAL_UPLOAD_DIR, filename);

  await fs.promises.writeFile(filePath, file.buffer);
  return `/uploads/products/${filename}`;
};

const deleteLocalImage = async (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith("/uploads/products/")) return;
  const filePath = path.join(__dirname, "../../", imageUrl);
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }
};

router.post("/add", upload.array("images", 10), async (req, res) => {
  const {
    name,
    description = "",
    quantite,
    prixAchat,
    prixVente,
    unite,
    categorie,
    sousCategorie
  } = req.body;
  const uniteGros = typeof req.body.uniteGros === "string" && req.body.uniteGros.trim() ? req.body.uniteGros.trim() : null;
  const venteParGros = parseBoolean(req.body.venteParGros) || false;
  const prixVenteGros = req.body.prixVenteGros !== undefined && req.body.prixVenteGros !== ""
    ? Number(req.body.prixVenteGros)
    : null;

  const quantiteValue = quantite !== undefined && quantite !== "" ? Number(quantite) : 0;
  const prixAchatValue = prixAchat !== undefined && prixAchat !== "" ? Number(prixAchat) : 0;
  const prixVenteValue = prixVente !== undefined && prixVente !== "" ? Number(prixVente) : 0;
  const uniteValue = unite && unite.trim() ? unite : "piece";
  const categorieValue = categorie && categorie.trim() ? categorie : null;

  console.log("=== DEBUG PRODUCT ADD ===");
  console.log("req.body:", req.body);
  console.log("categorie received:", categorie);
  console.log("categorie type:", typeof categorie);
  console.log("categorie is valid ObjectId:", categorieValue ? require('mongoose').Types.ObjectId.isValid(categorieValue) : "N/A");

  if (!name || !name.trim()) {
    console.log("Validation failed - missing name");
    return res.status(400).json({
      status: "notok",
      msg: "Le nom du produit est requis"
    });
  }

  if (!sousCategorie || !sousCategorie.trim()) {
    console.log("Validation failed - missing sousCategorie");
    return res.status(400).json({
      status: "notok",
      msg: "La sous-famille du produit est requise"
    });
  }

  if (categorieValue && !require('mongoose').Types.ObjectId.isValid(categorieValue)) {
    console.log("Invalid categorie ObjectId");
    return res.status(400).json({
      status: "notok",
      msg: "ID de catégorie invalide"
    });
  }

  if (venteParGros && (prixVenteGros == null || Number.isNaN(prixVenteGros))) {
    console.log("Validation failed - prixVenteGros invalid");
    return res.status(400).json({
      status: "notok",
      msg: "Veuillez fournir un prix de vente par gros valide lorsque la vente par gros est activée"
    });
  }

  // Check if categorie exists when provided
  if (categorieValue) {
    const Categorie = require("../../models/Categorie");
    const categorieExists = await Categorie.findById(categorieValue);
    if (!categorieExists) {
      console.log("Categorie not found in database");
      return res.status(400).json({
        status: "notok",
        msg: "Catégorie sélectionnée n'existe pas"
      });
    }
  }

  const sousCategorieValue = sousCategorie && sousCategorie.trim() ? sousCategorie : null;
  if (!sousCategorieValue || !require('mongoose').Types.ObjectId.isValid(sousCategorieValue)) {
    console.log("Invalid sousCategorie ObjectId");
    return res.status(400).json({
      status: "notok",
      msg: "ID de sous-famille invalide"
    });
  }

  const SubCategorie = require("../../models/SubCategorie");
  const sousCategorieExists = await SubCategorie.findById(sousCategorieValue);
  if (!sousCategorieExists) {
    console.log("SousCategorie not found in database");
    return res.status(400).json({
      status: "notok",
      msg: "Sous-famille sélectionnée n'existe pas"
    });
  }

  const cloudinaryReady =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  try {
    console.log("Ajout produit: body=", req.body, "files=", req.files?.length);

    if (IS_VERCEL && req.files?.length && !cloudinaryReady) {
      return res.status(500).json({
        status: "error",
        msg: "Upload d'images impossible: Cloudinary n'est pas configuré (obligatoire sur Vercel)."
      });
    }

    const images =
      req.files && req.files.length > 0
        ? await Promise.all(
            req.files.map(async (file) => {
              if (cloudinaryReady) {
                const uploadedImage = await uploadBuffer(file.buffer, "fromagerie-smine/products");
                if (!uploadedImage || !uploadedImage.secure_url) {
                  throw new Error("Erreur Cloudinary: réponse invalide");
                }
                return uploadedImage.secure_url;
              }

              return await saveLocalImage(file);
            })
          )
        : [];

    const newProduit = new Produit({
      name,
      description,
      quantite: quantiteValue,
      prixAchat: prixAchatValue,
      prixVente: prixVenteValue,
      venteParGros,
      prixVenteGros: venteParGros ? prixVenteGros : null,
      uniteGros: uniteGros || null,
      unite: uniteValue,
      categorie: categorieValue,
      sousCategorie: sousCategorieValue,
      images
    });

    console.log("Produit object before save:", newProduit);
    console.log("Saving product to database...");
    const savedProduit = await newProduit.save();
    console.log("Produit saved successfully:", savedProduit._id);

    res.status(201).json({
      status: "ok",
      msg: "Produit ajoute avec succes",
      produit: savedProduit
    });
  } catch (err) {
    console.error("Erreur ajout produit:", err);
    res.status(500).json({
      status: "error",
      msg: "Erreur serveur lors de l'ajout du produit",
      error: err.message,
      details: err.stack
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const produits = await Produit.find()
      .populate("categorie", "nom")
      .populate("sousCategorie", "nom");
    res.status(200).json({
      status: "ok",
      produits
    });
  } catch (err) {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

router.get("/allProducts", async (req, res) => {
  try {
    const produits = await Produit.find()
      .populate("categorie", "nom")
      .populate("sousCategorie", "nom");
    const data = produits.map((p) => ({
      libelle: p.name,
      description: p.description || "",
      quantite: p.quantite,
      unite: p.unite,
      categorie: p.categorie ? p.categorie.nom : null,
      sousCategorie: p.sousCategorie ? p.sousCategorie.nom : null
    }));
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

router.put("/update/:id", upload.array("images", 10), async (req, res) => {
  const cloudinaryReady =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  try {
    const { name, description, quantite, prixAchat, prixVente, unite, categorie, sousCategorie } = req.body;
    const venteParGros = parseBoolean(req.body.venteParGros);
    const prixVenteGros =
      req.body.prixVenteGros !== undefined && req.body.prixVenteGros !== ""
        ? Number(req.body.prixVenteGros)
        : null;
    const uniteGros =
      typeof req.body.uniteGros === "string" && req.body.uniteGros.trim()
        ? req.body.uniteGros.trim()
        : null;

    if (venteParGros && (prixVenteGros == null || Number.isNaN(prixVenteGros))) {
      return res.status(400).json({
        status: "notok",
        msg: "Lorsque la vente par gros est activée, vous devez fournir un prix de vente par groupe valide."
      });
    }

    const updateData = {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(quantite !== undefined && { quantite: Number(quantite) }),
      ...(prixAchat !== undefined && { prixAchat: Number(prixAchat) }),
      ...(prixVente !== undefined && { prixVente: Number(prixVente) }),
      ...(unite !== undefined && { unite }),
      ...(uniteGros !== undefined && { uniteGros }),
      ...(categorie !== undefined && { categorie }),
      ...(sousCategorie !== undefined && { sousCategorie }),
      ...(venteParGros !== undefined && { venteParGros }),
      ...(prixVenteGros !== undefined && { prixVenteGros: venteParGros ? prixVenteGros : null })
    };

    const existingProduit = await Produit.findById(req.params.id);
    if (!existingProduit) {
      return res.status(404).json({ status: "notok", msg: "Produit non trouve" });
    }

    if (req.files && req.files.length > 0) {
      if (IS_VERCEL && !cloudinaryReady) {
        return res.status(500).json({
          status: "error",
          msg: "Upload d'images impossible: Cloudinary n'est pas configuré (obligatoire sur Vercel)."
        });
      }

      if (existingProduit.images?.length) {
        await Promise.all(
          existingProduit.images.map(async (image) => {
            if (image.startsWith("http")) {
              return destroyImage(image);
            }
            return deleteLocalImage(image);
          })
        );
      }

      updateData.images = await Promise.all(
        req.files.map(async (file) => {
          if (cloudinaryReady) {
            const uploadedImage = await uploadBuffer(file.buffer, "fromagerie-smine/products");
            if (!uploadedImage || !uploadedImage.secure_url) {
              throw new Error("Erreur Cloudinary: réponse invalide");
            }
            return uploadedImage.secure_url;
          }
          return await saveLocalImage(file);
        })
      );
    } else {
      updateData.images = existingProduit.images || [];
    }

    const updatedProduit = await Produit.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedProduit) {
      return res.status(404).json({ status: "notok", msg: "Produit non trouve" });
    }

    res.status(200).json({
      status: "ok",
      msg: "Produit modifie avec succes",
      produit: updatedProduit
    });
  } catch (err) {
    console.error("Erreur modification produit:", err);
    res.status(500).json({ status: "error", msg: "Erreur lors de la modification" });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const deletedProduit = await Produit.findByIdAndDelete(req.params.id);

    if (!deletedProduit) {
      return res.status(404).json({ status: "notok", msg: "Produit non trouve" });
    }

    if (deletedProduit.images?.length) {
      await Promise.all(
        deletedProduit.images.map((image) => {
          if (typeof image === "string" && image.startsWith("http")) {
            return destroyImage(image);
          }
          return deleteLocalImage(image);
        })
      );
    }

    res.status(200).json({
      status: "ok",
      msg: "Produit supprime avec succes"
    });
  } catch (err) {
    console.error("Erreur suppression produit:", err);
    res.status(500).json({ status: "error", msg: "Erreur lors de la suppression" });
  }
});

module.exports = router;
