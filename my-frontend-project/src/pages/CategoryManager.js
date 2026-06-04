import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  IconButton,
  Alert,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Card,
  CardContent,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { Delete, Edit, AddPhotoAlternate } from "@mui/icons-material";
import api, { buildApiUrl } from "../api";
import { resolveMediaUrl } from "../config/media";

const API_URL = buildApiUrl("/categories");

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ nom: "", description: "", image: null });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [editMode, setEditMode] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(API_URL);
      if (data.status === "ok" && Array.isArray(data.categories)) {
        setCategories(data.categories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Erreur chargement categories:", error);
      setMessage({ text: "Impossible de charger les catégories", type: "error" });
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editMode) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [editMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom || form.nom.trim() === "") {
      setMessage({ text: "Le nom de la catégorie est requis", type: "error" });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('nom', form.nom.trim());
      formData.append('description', form.description.trim());
      
      console.log("[CategoryManager] Ajout:", {
        "nom": form.nom,
        "description": form.description,
        "image exists": !!form.image,
        "image name": form.image?.name,
        "image size": form.image?.size
      });
      
      if (form.image) {
        formData.append('image', form.image);
        console.log("[CategoryManager] Image ajoutée au FormData");
      }

      const url = editMode ? `${API_URL}/update/${editingCategory._id}` : `${API_URL}/add`;
      const method = editMode ? "PUT" : "POST";

      console.log(`[CategoryManager] Envoi ${method} vers ${url}`);
      
      const response = editMode
        ? await api.put(url, formData)
        : await api.post(url, formData);
      
      const data = response.data;
      console.log("[CategoryManager] Réponse serveur:", data);

      if (data.status === "ok") {
        setMessage({ text: editMode ? "Catégorie modifiée avec succès" : "Catégorie créée avec succès", type: "success" });
        setForm({ nom: "", description: "", image: null });
        setEditMode(false);
        setEditingCategory(null);
        setShowForm(false);
        await fetchCategories();
      } else {
        setMessage({ text: data.msg || "Erreur lors de l'opération", type: "error" });
      }
    } catch (error) {
      console.error("❌ Erreur fetch:", error);
      setMessage({ text: "Erreur réseau lors de l'opération: " + error.message, type: "error" });
    }
  };

  const handleEdit = (category) => {
    setForm({
      nom: category.nom,
      description: category.description || "",
      image: null // Reset image, will show current if exists
    });
    setEditMode(true);
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setForm({ nom: "", description: "", image: null });
    setEditMode(false);
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Etes-vous sur de vouloir supprimer cette categorie ?")) {
      return;
    }

    try {
      const { data } = await api.delete(`${API_URL}/delete/${id}`);

      if (data.status === "ok") {
        setMessage({ text: "Categorie supprimee avec succes", type: "success" });
        await fetchCategories();
      } else {
        setMessage({ text: data.msg || "Erreur lors de la suppression", type: "error" });
      }
    } catch (error) {
      console.error("Erreur suppression categorie:", error);
      setMessage({ text: "Erreur reseau lors de la suppression", type: "error" });
    }
  };

  let content;
  if (loading) {
    content = (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  } else if (categories.length === 0) {
    content = <Alert severity="info">Aucune catégorie pour le moment.</Alert>;
  } else if (isMobile) {
    content = (
      <List disablePadding>
        {categories.map((cat) => (
          <ListItem
            key={cat._id}
            divider
            secondaryAction={
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <IconButton
                  aria-label="Modifier la catégorie"
                  onClick={() => handleEdit(cat)}
                  size="large"
                  sx={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 1 }}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  aria-label="Supprimer la catégorie"
                  onClick={() => handleDelete(cat._id)}
                  size="large"
                  color="error"
                  sx={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 1 }}
                >
                  <Delete />
                </IconButton>
              </Box>
            }
            sx={{ px: 0 }}
          >
            <ListItemAvatar>
              <Avatar
                variant="rounded"
                src={cat.image ? resolveMediaUrl(cat.image) : undefined}
                imgProps={{
                  onError: (e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/56';
                  }
                }}
                sx={{ width: 56, height: 56, mr: 1 }}
              />
            </ListItemAvatar>
            <ListItemText
              primary={cat.nom}
              secondary={cat.description || "Aucune description"}
            />
          </ListItem>
        ))}
      </List>
    );
  } else {
    content = (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Image</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat._id}>
                <TableCell>{cat.nom}</TableCell>
                <TableCell>{cat.description || "-"}</TableCell>
                <TableCell>
                  <img
                    src={resolveMediaUrl(cat.image)}
                    alt={cat.nom}
                    style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }}
                    onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/60"; }}
                  />
                </TableCell>
                <TableCell>
                  <Button variant="outlined" size="small" onClick={() => handleEdit(cat)} sx={{ mr: 1 }}>
                    Modifier
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<Delete />}
                    onClick={() => handleDelete(cat._id)}
                  >
                    Supprimer
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        Gestion des Catégories
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage({ text: "", type: "" })}>
          {message.text}
        </Alert>
      )}

      {!showForm && !editMode && (
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
          <Button variant="contained" onClick={() => setShowForm(true)}>
            Ajouter une catégorie
          </Button>
        </Box>
      )}

      {(showForm || editMode) && (
        <Box id="category-form" ref={formRef} component="form" onSubmit={handleSubmit} sx={{
          mb: 4,
          p: isMobile ? 2 : 3,
          border: "1px solid #ddd",
          borderRadius: 2,
          backgroundColor: "#f9f9f9"
        }}>
          <Typography variant={isMobile ? "h6" : "h6"} sx={{ mb: 2 }}>
            {editMode ? "Modifier la catégorie" : "Ajouter une catégorie"}
          </Typography>
        <Grid container spacing={isMobile ? 1 : 2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Nom de la catégorie"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              fullWidth
              required
              margin="normal"
              size={isMobile ? "small" : "medium"}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Description (optionnelle)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              fullWidth
              margin="normal"
              size={isMobile ? "small" : "medium"}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<AddPhotoAlternate />}
              sx={{ mt: 2, height: isMobile ? 48 : 56 }}
            >
              {editMode ? "Changer l'image" : "Image catégorie (optionnelle)"}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => setForm({ ...form, image: e.target.files[0] || null })}
              />
            </Button>
            {form.image && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1, fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
                Nouveau fichier: {form.image.name}
              </Typography>
            )}
            {editMode && editingCategory?.image && !form.image && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
                  Image actuelle:
                </Typography>
                <img
                  src={resolveMediaUrl(editingCategory.image)}
                  alt="Current"
                  style={{
                    maxWidth: isMobile ? '80px' : '100px',
                    maxHeight: isMobile ? '80px' : '100px',
                    borderRadius: 4,
                    marginTop: 4
                  }}
                  onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/100'; }}
                />
              </Box>
            )}
          </Grid>
        </Grid>
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexDirection: isMobile ? 'column' : 'row' }}>
          <Button
            type="submit"
            variant="contained"
            fullWidth={isMobile}
            sx={{ flex: isMobile ? 'none' : 1 }}
          >
            {editMode ? "Modifier" : "Créer"}
          </Button>
          {editMode && (
            <Button
              variant="outlined"
              onClick={handleCancelEdit}
              fullWidth={isMobile}
              sx={{ flex: isMobile ? 'none' : 'none' }}
            >
              Annuler
            </Button>
          )}
        </Box>
      </Box>
      )}

      {content}
    </Container>
  );
};

export default CategoryManager;
