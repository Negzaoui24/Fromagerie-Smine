import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Grid
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import api, { buildApiUrl } from "../api";

const API_URL = buildApiUrl("/subcategories");

const SubCategoryManager = () => {
  const [subCategories, setSubCategories] = useState([]);
  const [form, setForm] = useState({ nom: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [editMode, setEditMode] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchSubCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(API_URL);
      if (data.status === "ok" && Array.isArray(data.subcategories)) {
        setSubCategories(data.subcategories);
      } else {
        setSubCategories([]);
      }
    } catch (error) {
      console.error("Erreur chargement sous-familles:", error);
      setMessage({ text: "Impossible de charger les sous-familles", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom || !form.nom.trim()) {
      setMessage({ text: "Le nom de la sous-famille est requis", type: "error" });
      return;
    }

    try {
      const payload = { nom: form.nom.trim() };
      const response = editMode
        ? await api.put(`${API_URL}/update/${editingSubCategory._id}`, payload)
        : await api.post(`${API_URL}/add`, payload);

      if (response.data.status === "ok") {
        setMessage({
          text: editMode
            ? "Sous-famille modifiée avec succès"
            : "Sous-famille créée avec succès",
          type: "success"
        });
        setForm({ nom: "" });
        setEditMode(false);
        setEditingSubCategory(null);
        setShowForm(false);
        await fetchSubCategories();
      } else {
        setMessage({ text: response.data.msg || "Erreur lors de l'opération", type: "error" });
      }
    } catch (error) {
      console.error("Erreur sous-famille:", error);
      setMessage({ text: error.response?.data?.msg || "Erreur lors de l'opération", type: "error" });
    }
  };

  const handleEdit = (subCategory) => {
    setForm({ nom: subCategory.nom });
    setEditMode(true);
    setEditingSubCategory(subCategory);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setForm({ nom: "" });
    setEditMode(false);
    setEditingSubCategory(null);
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette sous-famille ?")) {
      return;
    }

    try {
      const { data } = await api.delete(`${API_URL}/delete/${id}`);
      if (data.status === "ok") {
        setMessage({ text: "Sous-famille supprimée avec succès", type: "success" });
        await fetchSubCategories();
      } else {
        setMessage({ text: data.msg || "Erreur lors de la suppression", type: "error" });
      }
    } catch (error) {
      console.error("Erreur suppression sous-famille:", error);
      setMessage({ text: "Erreur lors de la suppression", type: "error" });
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        Gestion des sous-familles
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage({ text: "", type: "" })}>
          {message.text}
        </Alert>
      )}

      {!showForm && !editMode && (
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
          <Button variant="contained" onClick={() => setShowForm(true)}>
            Ajouter une sous-famille
          </Button>
        </Box>
      )}

      {(showForm || editMode) && (
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4, p: 3, border: '1px solid #ddd', borderRadius: 2, backgroundColor: '#f9f9f9' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {editMode ? "Modifier la sous-famille" : "Ajouter une sous-famille"}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Nom de la sous-famille"
                value={form.nom}
                onChange={(e) => setForm({ nom: e.target.value })}
                fullWidth
                required
                size="medium"
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button type="submit" variant="contained">
              {editMode ? "Sauvegarder" : "Créer"}
            </Button>
            {editMode && (
              <Button variant="outlined" onClick={handleCancelEdit}>
                Annuler
              </Button>
            )}
          </Box>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : subCategories.length === 0 ? (
        <Alert severity="info">Aucune sous-famille pour le moment.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subCategories.map((subCategory) => (
                <TableRow key={subCategory._id}>
                  <TableCell>{subCategory.nom}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => handleEdit(subCategory)} sx={{ mr: 1 }}>
                      Modifier
                    </Button>
                    <Button size="small" color="error" onClick={() => handleDelete(subCategory._id)}>
                      Supprimer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default SubCategoryManager;
