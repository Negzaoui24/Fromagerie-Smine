import React, { useState, useEffect } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardMedia,
  FormControlLabel,
  Checkbox,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { Edit, Delete, CloudUpload } from "@mui/icons-material";
import api, { buildApiUrl } from "../api";
import { resolveMediaUrl } from "../config/media";

const API_URL = buildApiUrl("/produits");

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    quantite: "",
    prixAchat: "",
    prixVente: "",
    unite: "",
    categorieId: "",
    images: [],
    venteParGros: false,
    prixVenteGros: "",
    uniteGros: ""
  });
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    quantite: "",
    prixAchat: "",
    prixVente: "",
    unite: "",
    categorieId: "",
    images: [],
    newImages: [],
    venteParGros: false,
    prixVenteGros: "",
    uniteGros: ""
  });
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [searchText, setSearchText] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Validation en temps réel
  const validateField = (name, value) => {
    const errors = { ...formErrors };
    switch (name) {
      case "name":
        if (!value || value.trim() === "") {
          errors.name = "Le nom du produit est obligatoire";
        } else if (value.length < 2) {
          errors.name = "Le nom doit contenir au moins 2 caractères";
        } else {
          delete errors.name;
        }
        break;
      case "quantite":
        if (!value || value === "") {
          errors.quantite = "La quantité est obligatoire";
        } else if (Number(value) < 0) {
          errors.quantite = "La quantité doit être positive";
        } else {
          delete errors.quantite;
        }
        break;
      case "prixAchat":
        if (!value || value === "") {
          errors.prixAchat = "Le prix d'achat est obligatoire";
        } else if (Number(value) < 0) {
          errors.prixAchat = "Le prix doit être positif";
        } else {
          delete errors.prixAchat;
        }
        break;
      case "prixVente":
        if (!value || value === "") {
          errors.prixVente = "Le prix de vente est obligatoire";
        } else if (Number(value) < 0) {
          errors.prixVente = "Le prix doit être positif";
        } else {
          delete errors.prixVente;
        }
        break;
      case "unite":
        if (!value || value === "") {
          errors.unite = "L'unité est obligatoire";
        } else {
          delete errors.unite;
        }
        break;
      case "categorieId":
        if (!value || value === "") {
          errors.categorieId = "La catégorie est obligatoire";
        } else {
          delete errors.categorieId;
        }
        break;
      default:
        break;
    }
    setFormErrors(errors);
  };

  // Calculer la marge bénéficiaire
  const calculateMargin = () => {
    const prixAchat = Number(form.prixAchat) || 0;
    const prixVente = Number(form.prixVente) || 0;
    if (prixAchat > 0) {
      return (((prixVente - prixAchat) / prixAchat) * 100).toFixed(1);
    }
    return 0;
  };

  // Compter les sections complétées
  const countCompletedSections = () => {
    let completed = 0;
    if (form.name && form.description) completed++;
    if (form.prixAchat && form.prixVente) completed++;
    if (form.quantite && form.unite && form.categorieId) completed++;
    if (form.venteParGros ? form.prixVenteGros && form.uniteGros : true) completed++;
    if (form.images.length > 0) completed++;
    return { completed, total: 5 };
  };

  const progress = countCompletedSections();

  // Récupérer tous les produits (GET /products)
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(API_URL);
      if (data.status === "ok" && data.produits) {
        setProducts(data.produits);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Erreur lors du chargement:", err);
      setMessage({ text: "Erreur de connexion au serveur", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get(buildApiUrl("/categories"));
      if (data.status === "ok" && data.categories) {
        setCategories(data.categories);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("Erreur chargement catégories:", err);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const displayedProducts = products.filter((product) => {
    const search = searchText.trim().toLowerCase();
    if (!search) return true;

    return (
      product.name?.toLowerCase().includes(search) ||
      product.description?.toLowerCase().includes(search) ||
      product.categorie?.nom?.toLowerCase().includes(search) ||
      product.unite?.toLowerCase().includes(search) ||
      product.uniteGros?.toLowerCase().includes(search) ||
      String(product.quantite).includes(search)
    );
  });

  // Ajouter produit (POST /products/add)
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.quantite || !form.prixAchat || !form.prixVente || !form.unite || !form.categorieId) {
      setMessage({ text: "Veuillez remplir tous les champs (choisir une catégorie existante)", type: "error" });
      return;
    }

    if (form.venteParGros && !form.prixVenteGros) {
      setMessage({ text: "Indiquez un prix de vente par groupe lorsque la vente par gros est cochée", type: "error" });
      return;
    }

    try {
      const categorieId = form.categorieId;

      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description || "");
      formData.append('quantite', form.quantite);
      formData.append('prixAchat', form.prixAchat);
      formData.append('prixVente', form.prixVente);
      formData.append('unite', form.unite);
      formData.append('categorie', categorieId);
      formData.append('venteParGros', form.venteParGros);
      formData.append('prixVenteGros', form.prixVenteGros || "");
      formData.append('uniteGros', form.uniteGros || "");
      
      console.log(`Nombre d'images à ajouter: ${form.images.length}`);
      form.images.forEach((image, index) => {
        console.log(`Image ${index}: ${image.name}`);
        formData.append('images', image);
      });

      const response = await api.post(`${API_URL}/add`, formData);
      const data = response.data;
      console.log("Réponse du serveur (add):", data);
      
          if (data.status === "ok") {
        setMessage({ text: "Produit ajouté avec succès", type: "success" });
        setForm({
          name: "",
          description: "",
          quantite: "",
          prixAchat: "",
          prixVente: "",
          unite: "",
          categorieId: "",
          images: [],
          venteParGros: false,
          prixVenteGros: "",
          uniteGros: ""
        });
        setShowAddForm(false);
        await fetchProducts();
      } else {
        setMessage({ text: data.msg || "Erreur lors de l'ajout", type: "error" });
      }
    } catch (err) {
      console.error("Erreur add:", err);
      setMessage({ text: "Erreur lors de l'ajout", type: "error" });
    }
  };

  // Ouvrir modal pour modifier
  const handleEditClick = (product) => {
    setEditingId(product._id);
    setEditForm({
      name: product.name,
      description: product.description || "",
      quantite: product.quantite,
      prixAchat: product.prixAchat || "",
      prixVente: product.prixVente || "",
      unite: product.unite || "",
      categorieId: product.categorie?._id || "",
      images: product.images || [],
      newImages: [], // Pour les nouvelles images à ajouter
      venteParGros: product.venteParGros || false,
      prixVenteGros: product.prixVenteGros ?? "",
      uniteGros: product.uniteGros || ""
    });
    setOpen(true);
  };

  // Modifier produit (PUT /products/update/:id)
  const handleUpdate = async () => {
    if (!editingId) return;

    if (!editForm.name || !editForm.quantite || !editForm.prixAchat || !editForm.prixVente || !editForm.unite || !editForm.categorieId) {
      setMessage({ text: "Veuillez remplir tous les champs (choisir une catégorie existante)", type: "error" });
      return;
    }

    if (editForm.venteParGros && !editForm.prixVenteGros) {
      setMessage({ text: "Indiquez un prix de vente par groupe lorsque la vente par gros est cochée", type: "error" });
      return;
    }

    try {
      const categorieId = editForm.categorieId;

      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('description', editForm.description || "");
      formData.append('quantite', editForm.quantite);
      formData.append('prixAchat', editForm.prixAchat);
      formData.append('prixVente', editForm.prixVente);
      formData.append('unite', editForm.unite);
      formData.append('categorie', categorieId);
      formData.append('venteParGros', editForm.venteParGros);
      formData.append('prixVenteGros', editForm.prixVenteGros || "");
      formData.append('uniteGros', editForm.uniteGros || "");
      
      // Ajouter les nouvelles images si elles existent
      if (editForm.newImages && editForm.newImages.length > 0) {
        console.log(`Envoi de ${editForm.newImages.length} nouvelles images`);
        editForm.newImages.forEach((image, index) => {
          console.log(`Image ${index}: ${image.name}`);
          formData.append('images', image);
        });
      } else {
        console.log("Aucune nouvelle image sélectionnée - les anciennes images seront conservées");
      }

      const response = await api.put(`${API_URL}/update/${editingId}`, formData);
      const data = response.data;
      console.log("Réponse du serveur:", data);
      
      if (data.status === "ok") {
        setMessage({ text: "Produit modifié avec succès", type: "success" });
        setOpen(false);
        await fetchProducts();
      } else {
        setMessage({ text: data.msg || "Erreur lors de la modification", type: "error" });
      }
    } catch (err) {
      console.error("Erreur update:", err);
      setMessage({ text: "Erreur lors de la modification", type: "error" });
    }
  };

  // Supprimer produit (DELETE /products/delete/:id)
  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit?")) {
      try {
        const { data } = await api.delete(`${API_URL}/delete/${id}`);
        if (data.status === "ok") {
          setMessage({ text: "Produit supprimé avec succès", type: "success" });
          await fetchProducts();
        } else {
          setMessage({ text: data.msg || "Erreur lors de la suppression", type: "error" });
        }
      } catch (err) {
        console.error("Erreur delete:", err);
        setMessage({ text: "Erreur lors de la suppression", type: "error" });
      }
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        Gestion des Produits
      </Typography>

      {/* Messages d'alerte */}
      {message.text && (
        <Alert
          severity={message.type}
          sx={{ mb: 3 }}
          onClose={() => setMessage({ text: "", type: "" })}
        >
          {message.text}
        </Alert>
      )}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowAddForm((prev) => !prev)}
        >
          {showAddForm ? "Masquer le formulaire" : "Ajouter un produit"}
        </Button>
        <TextField
          label="Recherche de produit"
          placeholder="Nom, description, catégorie, unité..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          fullWidth
          sx={{ minWidth: 240 }}
        />
      </Box>

      {showAddForm && (
        <Box
          component="form"
          onSubmit={handleAdd}
          sx={{
            mb: 4,
            p: { xs: 2, md: 4 },
            border: "1px solid #ddd",
            borderRadius: 3,
            backgroundColor: "#f9f9f9",
            maxWidth: "100%"
          }}
        >
          {/* Header avec titre et indicateur de progression */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold", color: "#1f2937" }}>
              Ajouter un nouveau produit
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="body2" sx={{ color: "#666" }}>
                Progression de complétion
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: "bold", color: "#1f2937" }}>
                {progress.completed}/{progress.total} sections
              </Typography>
            </Box>
            <Box sx={{ width: "100%", height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
              <Box
                sx={{
                  height: "100%",
                  width: `${(progress.completed / progress.total) * 100}%`,
                  backgroundColor: "#3b82f6",
                  transition: "width 0.3s ease"
                }}
              />
            </Box>
          </Box>

          {/* Section 1: Informations Générales */}
          <Box sx={{ mb: 4, pb: 3, borderBottom: "2px solid #e5e7eb" }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#1f2937", display: "flex", alignItems: "center", gap: 1 }}>
              📋 Informations générales
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12}>
                <TextField
                  fullWidth
                  label="Nom du produit *"
                  placeholder="Ex: Fromage artisanal"
                  id="product-name"
                  aria-label="Nom du produit"
                  aria-describedby={formErrors.name ? "name-error" : undefined}
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    validateField("name", e.target.value);
                  }}
                  error={!!formErrors.name}
                  helperText={formErrors.name || ""}
                  variant="outlined"
                  size="medium"
                  sx={{ minHeight: isMobile ? 56 : "auto" }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description *"
                  placeholder="Décrivez votre produit..."
                  id="product-description"
                  aria-label="Description du produit"
                  value={form.description}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setForm({ ...form, description: e.target.value });
                    }
                  }}
                  multiline
                  minRows={3}
                  maxRows={6}
                  helperText={`${form.description.length}/500 caractères`}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Section 2: Tarification */}
          <Box sx={{ mb: 4, pb: 3, borderBottom: "2px solid #e5e7eb" }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#1f2937", display: "flex", alignItems: "center", gap: 1 }}>
              💰 Tarification
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Prix d'achat (TND) *"
                  id="cost-price"
                  aria-label="Prix d'achat en TND"
                  aria-describedby={formErrors.prixAchat ? "prixAchat-error" : undefined}
                  placeholder="0.00"
                  value={form.prixAchat}
                  onChange={(e) => {
                    setForm({ ...form, prixAchat: e.target.value });
                    validateField("prixAchat", e.target.value);
                  }}
                  type="number"
                  inputProps={{ step: 0.01, min: 0 }}
                  error={!!formErrors.prixAchat}
                  helperText={formErrors.prixAchat || "Coût d'achat unitaire"}
                  variant="outlined"
                  size="medium"
                  sx={{ minHeight: isMobile ? 56 : "auto" }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>TND</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Prix de vente (TND) *"
                  id="sell-price"
                  aria-label="Prix de vente en TND"
                  aria-describedby={formErrors.prixVente ? "prixVente-error" : undefined}
                  placeholder="0.00"
                  value={form.prixVente}
                  onChange={(e) => {
                    setForm({ ...form, prixVente: e.target.value });
                    validateField("prixVente", e.target.value);
                  }}
                  type="number"
                  inputProps={{ step: 0.01, min: 0 }}
                  error={!!formErrors.prixVente}
                  helperText={formErrors.prixVente || "Prix public de vente"}
                  variant="outlined"
                  size="medium"
                  sx={{ minHeight: isMobile ? 56 : "auto" }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>TND</Typography>
                  }}
                />
              </Grid>
              {form.prixAchat && form.prixVente && (
                <Grid item xs={12}>
                  <Box sx={{
                    p: 2,
                    backgroundColor: "#ecfdf5",
                    borderLeft: "4px solid #10b981",
                    borderRadius: 1
                  }}>
                    <Typography variant="body2" sx={{ color: "#065f46" }}>
                      <strong>Marge bénéficiaire:</strong> {calculateMargin()}%
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Section 3: Quantité et Unité */}
          <Box sx={{ mb: 4, pb: 3, borderBottom: "2px solid #e5e7eb" }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#1f2937", display: "flex", alignItems: "center", gap: 1 }}>
              📦 Quantité & Unité
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: "500", color: "#374151" }}>
                    Quantité *
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const newVal = Math.max(0, Number(form.quantite) - 1);
                        setForm({ ...form, quantite: String(newVal) });
                        validateField("quantite", String(newVal));
                      }}
                      sx={{ minWidth: isMobile ? 48 : "auto", height: isMobile ? 48 : "auto" }}
                    >
                      −
                    </Button>
                    <TextField
                      type="number"
                      value={form.quantite}
                      onChange={(e) => {
                        setForm({ ...form, quantite: e.target.value });
                        validateField("quantite", e.target.value);
                      }}
                      inputProps={{ min: 0 }}
                      error={!!formErrors.quantite}
                      sx={{
                        flex: 1,
                        "& input": { textAlign: "center", fontSize: isMobile ? 18 : 16 },
                        minHeight: isMobile ? 48 : "auto"
                      }}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const newVal = Number(form.quantite) + 1;
                        setForm({ ...form, quantite: String(newVal) });
                        validateField("quantite", String(newVal));
                      }}
                      sx={{ minWidth: isMobile ? 48 : "auto", height: isMobile ? 48 : "auto" }}
                    >
                      +
                    </Button>
                  </Box>
                  {formErrors.quantite && (
                    <Typography id="quantite-error" variant="caption" sx={{ color: "#dc2626", display: "block", mt: 0.5 }}>
                      {formErrors.quantite}
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  SelectProps={{ native: true }}
                  label="Unité *"
                  id="unit-select"
                  aria-label="Unité de mesure"
                  aria-describedby={formErrors.unite ? "unite-error" : undefined}
                  value={form.unite}
                  onChange={(e) => {
                    setForm({ ...form, unite: e.target.value });
                    validateField("unite", e.target.value);
                  }}
                  error={!!formErrors.unite}
                  helperText={formErrors.unite || "Sélectionnez une unité"}
                  variant="outlined"
                  size="medium"
                  sx={{ minHeight: isMobile ? 56 : "auto" }}
                >
                  <option value="">-- Choisir --</option>
                  <option value="kg">Kilogramme (kg)</option>
                  <option value="litre">Litre (l)</option>
                  <option value="piece">Pièce</option>
                  <option value="boite">Boîte</option>
                  <option value="carton">Carton</option>
                  <option value="paquet">Paquet</option>
                </TextField>
              </Grid>
            </Grid>
          </Box>

          {/* Section 4: Vente en Gros (conditionnelle) */}
          <Box sx={{ mb: 4 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.venteParGros}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      venteParGros: e.target.checked,
                      prixVenteGros: "",
                      uniteGros: ""
                    });
                  }}
                />
              }
              label={<Typography sx={{ fontWeight: "500" }}>Activer la vente en gros</Typography>}
            />
            <Box
              sx={{
                overflow: "hidden",
                transition: "max-height 0.3s ease, opacity 0.3s ease",
                maxHeight: form.venteParGros ? 400 : 0,
                opacity: form.venteParGros ? 1 : 0,
                mt: form.venteParGros ? 2 : 0,
                pb: 3,
                borderBottom: form.venteParGros ? "2px solid #e5e7eb" : "none"
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, color: "#1f2937", display: "flex", alignItems: "center", gap: 1 }}>
                📊 Tarification en gros
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Prix de vente par groupe (TND) *"
                    id="bulk-price"
                    aria-label="Prix de vente en gros"
                    placeholder="0.00"
                    value={form.prixVenteGros}
                    onChange={(e) => setForm({ ...form, prixVenteGros: e.target.value })}
                    type="number"
                    inputProps={{ step: 0.01, min: 0 }}
                    disabled={!form.venteParGros}
                    variant="outlined"
                    size="medium"
                    sx={{ minHeight: isMobile ? 56 : "auto" }}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>TND</Typography>
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Unité de vente gros (ex: carton) *"
                    id="bulk-unit"
                    aria-label="Unité de vente gros"
                    placeholder="Ex: carton, boîte..."
                    value={form.uniteGros}
                    onChange={(e) => setForm({ ...form, uniteGros: e.target.value })}
                    disabled={!form.venteParGros}
                    variant="outlined"
                    size="medium"
                    sx={{ minHeight: isMobile ? 56 : "auto" }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>

          {/* Section 5: Catégorie et Médias */}
          <Box sx={{ mb: 4, pb: 3, borderBottom: "2px solid #e5e7eb" }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#1f2937", display: "flex", alignItems: "center", gap: 1 }}>
              🏷️ Catégorie
            </Typography>
            <TextField
              fullWidth
              select
              SelectProps={{ native: true }}
              label="Catégorie *"
              id="category-select"
              aria-label="Catégorie du produit"
              aria-describedby={formErrors.categorieId ? "categorieId-error" : undefined}
              value={form.categorieId}
              onChange={(e) => {
                setForm({ ...form, categorieId: e.target.value });
                validateField("categorieId", e.target.value);
              }}
              error={!!formErrors.categorieId}
              helperText={formErrors.categorieId || "Sélectionnez ou créez une catégorie"}
              variant="outlined"
              size="medium"
              sx={{ minHeight: isMobile ? 56 : "auto" }}
            >
              <option value="">-- Sélectionner une catégorie --</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.nom}
                </option>
              ))}
            </TextField>
          </Box>

          {/* Section 6: Images - Drag & Drop */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#1f2937", display: "flex", alignItems: "center", gap: 1 }}>
              🖼️ Médias & Galerie
            </Typography>
            <Box
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
                setForm({ ...form, images: [...form.images, ...files] });
              }}
              sx={{
                border: dragActive ? "2px solid #3b82f6" : "2px dashed #cbd5e1",
                borderRadius: 2,
                p: 3,
                textAlign: "center",
                backgroundColor: dragActive ? "#eff6ff" : "#f8fafc",
                transition: "all 0.2s ease",
                cursor: "pointer"
              }}
            >
              <input
                type="file"
                id="image-upload"
                hidden
                multiple
                accept="image/*"
                onChange={(e) => {
                  const newFiles = Array.from(e.target.files || []);
                  setForm({ ...form, images: [...form.images, ...newFiles] });
                }}
                aria-label="Télécharger des images"
              />
              <Box component="label" htmlFor="image-upload" sx={{ cursor: "pointer", display: "block" }}>
                <CloudUpload sx={{ fontSize: 40, color: "#3b82f6", mb: 1 }} />
                <Typography variant="h6" sx={{ mb: 1, color: "#1f2937" }}>
                  Glissez vos images ici
                </Typography>
                <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
                  ou
                </Typography>
                <Button
                  component="span"
                  variant="contained"
                  size="small"
                >
                  Sélectionner des fichiers
                </Button>
              </Box>
            </Box>

            {form.images.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: "bold", color: "#1f2937" }}>
                  Images sélectionnées ({form.images.length})
                </Typography>
                <Grid container spacing={1}>
                  {form.images.map((image, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <Card sx={{ position: "relative", borderRadius: 2 }}>
                        <CardMedia
                          component="img"
                          height="120"
                          image={URL.createObjectURL(image)}
                          alt={`Image ${index + 1}`}
                          sx={{ borderRadius: 2 }}
                        />
                        <Button
                          size="small"
                          color="error"
                          onClick={() => {
                            const newImages = form.images.filter((_, i) => i !== index);
                            setForm({ ...form, images: newImages });
                          }}
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            minWidth: 32,
                            height: 32,
                            backgroundColor: "rgba(255,255,255,0.9)"
                          }}
                        >
                          ✕
                        </Button>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>

          {/* Bouton Soumettre - Sticky sur mobile */}
          <Box sx={{
            display: "flex",
            gap: 2,
            flexDirection: isMobile ? "column-reverse" : "row",
            position: isMobile ? "fixed" : "relative",
            bottom: isMobile ? 0 : "auto",
            left: isMobile ? 0 : "auto",
            right: isMobile ? 0 : "auto",
            p: isMobile ? 2 : 0,
            backgroundColor: isMobile ? "white" : "transparent",
            borderTop: isMobile ? "1px solid #e5e7eb" : "none",
            zIndex: 10
          }}>
            <Button
              variant="outlined"
              fullWidth={isMobile}
              onClick={() => setShowAddForm(false)}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              fullWidth={isMobile}
              size={isMobile ? "large" : "medium"}
              sx={{ minHeight: isMobile ? 48 : "auto" }}
            >
              ✓ Ajouter le produit
            </Button>
          </Box>
        </Box>
      )}

      {/* Tableau Produits */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : products.length === 0 ? (
        <Alert severity="info">Aucun produit disponible. Commencez par en ajouter un!</Alert>
      ) : (
        <>
          {displayedProducts.length === 0 ? (
            <Alert severity="info">Aucun produit trouvé pour cette recherche.</Alert>
          ) : isMobile ? (
            <Grid container spacing={2}>
              {displayedProducts.map((product) => (
                <Grid item xs={12} key={product._id}>
              <Card variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {product.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {product.categorie ? product.categorie.nom : "Sans catégorie"}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  {product.description || "Aucune description pour ce produit."}
                </Typography>
                <Grid container spacing={1} sx={{ mb: 1 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Quantité</Typography>
                    <Typography>{product.quantite} {product.unite}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Prix vente</Typography>
                    <Typography>{product.prixVente} DT</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Prix achat</Typography>
                    <Typography>{product.prixAchat} DT</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Gros</Typography>
                    <Typography>{product.venteParGros ? "Oui" : "Non"}</Typography>
                  </Grid>
                  {product.venteParGros && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary">Prix gros</Typography>
                      <Typography>{product.prixVenteGros ? `${product.prixVenteGros} DT / ${product.uniteGros || product.unite}` : "-"}</Typography>
                    </Grid>
                  )}
                </Grid>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Button
                    startIcon={<Edit />}
                    onClick={() => handleEditClick(product)}
                    color="warning"
                    size="small"
                    variant="outlined"
                  >
                    Modifier
                  </Button>
                  <Button
                    startIcon={<Delete />}
                    onClick={() => handleDelete(product._id)}
                    color="error"
                    size="small"
                    variant="outlined"
                  >
                    Supprimer
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Nom</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Prix Achat</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Prix Vente</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Vente gros</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Prix gros</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Catégorie</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Images</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedProducts.map((product) => (
                <TableRow key={product._id} hover>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.prixAchat} DT</TableCell>
                  <TableCell>{product.prixVente} DT</TableCell>
                  <TableCell>{product.venteParGros ? "Oui" : "Non"}</TableCell>
                  <TableCell>
                    {product.venteParGros
                      ? product.prixVenteGros
                        ? `${product.prixVenteGros} DT`
                        : "-"
                      : "-"}
                  </TableCell>
                  <TableCell>{product.categorie ? product.categorie.nom : "-"}</TableCell>
                  <TableCell>
                    {product.images && product.images.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {product.images.slice(0, 3).map((image, index) => (
                          <img
                            key={index}
                            src={resolveMediaUrl(image)}
                            alt={`Produit ${index + 1}`}
                            onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/50'; }}
                            style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
                          />
                        ))}
                        {product.images.length > 3 && (
                          <Typography variant="caption">+{product.images.length - 3} autres</Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="textSecondary">Aucune image</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      startIcon={<Edit />}
                      onClick={() => handleEditClick(product)}
                      color="warning"
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1 }}
                    >
                      Modifier
                    </Button>
                    <Button
                      startIcon={<Delete />}
                      onClick={() => handleDelete(product._id)}
                      color="error"
                      size="small"
                      variant="outlined"
                    >
                      Supprimer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
          )}
        </>
      )}

      {/* Modal Modifier */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Modifier le produit</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nom du produit"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                fullWidth
                margin="normal"
                multiline
                minRows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Quantité"
                value={editForm.quantite}
                onChange={(e) => setEditForm({ ...editForm, quantite: e.target.value })}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Prix d'achat"
                value={editForm.prixAchat}
                onChange={(e) => setEditForm({ ...editForm, prixAchat: e.target.value })}
                type="number"
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Prix de vente"
                value={editForm.prixVente}
                onChange={(e) => setEditForm({ ...editForm, prixVente: e.target.value })}
                type="number"
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Unité vente gros"
                value={editForm.uniteGros}
                onChange={(e) => setEditForm({ ...editForm, uniteGros: e.target.value })}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editForm.venteParGros}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        venteParGros: e.target.checked,
                        prixVenteGros: e.target.checked ? editForm.prixVenteGros : ""
                      })
                    }
                  />
                }
                label="Vente par gros"
              />
            </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Prix de vente par groupe"
              value={editForm.prixVenteGros}
              onChange={(e) => setEditForm({ ...editForm, prixVenteGros: e.target.value })}
              type="number"
              fullWidth
              margin="normal"
              disabled={!editForm.venteParGros}
              required={editForm.venteParGros}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              SelectProps={{ native: true }}
              label="Unité"
              value={editForm.unite}
              onChange={(e) => setEditForm({ ...editForm, unite: e.target.value })}
              fullWidth
              margin="normal"
            >
                <option value="">Sélectionner</option>
                <option value="kg">kg</option>
                <option value="litre">litre</option>
                <option value="piece">pièce</option>
                <option value="carton">carton</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                SelectProps={{ native: true }}
                label="Catégorie"
                value={editForm.categorieId}
                onChange={(e) => setEditForm({ ...editForm, categorieId: e.target.value })}
                fullWidth
                margin="normal"
                required
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.nom}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                sx={{ mt: 2, height: 56 }}
                fullWidth
              >
                Ajouter de nouvelles images
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={(e) => setEditForm({ ...editForm, newImages: Array.from(e.target.files) })}
                />
              </Button>
            </Grid>
          </Grid>
          {editForm.images.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Images actuelles:</Typography>
              <Grid container spacing={1}>
                {editForm.images.map((image, index) => (
                  <Grid item xs={6} sm={4} md={3} key={index}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="100"
                        image={resolveMediaUrl(image)}
                        alt={`Image actuelle ${index + 1}`}
                        onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/100'; }}
                      />
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
          {editForm.newImages.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Nouvelles images à ajouter:</Typography>
              <Grid container spacing={1}>
                {editForm.newImages.map((image, index) => (
                  <Grid item xs={6} sm={4} md={3} key={index}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="100"
                        image={URL.createObjectURL(image)}
                        alt={`Nouvelle image ${index + 1}`}
                      />
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleUpdate} color="primary">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProductManager;
