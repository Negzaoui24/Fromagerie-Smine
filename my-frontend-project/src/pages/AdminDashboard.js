import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api, { buildApiUrl } from "../api";
import CategoryManager from "./CategoryManager";
import ProductManager from "./ProductManager";
import "./AdminDashboard.css";

const SUPER_ADMIN_EMAILS = [
  "oussama.negzaoui24@gmail.com",
  "abir@gmail.com"
];

const panels = [
  {
    id: "categories",
    label: "Gerer categories",
    title: "Gestion des categories",
    description: "Ajoutez, modifiez et supprimez les categories."
  },
  {
    id: "products",
    label: "Gerer produits",
    title: "Gestion des produits",
    description: "Administrez le catalogue produit depuis ce panneau."
  },
  {
    id: "admin",
    label: "Creer un admin",
    title: "Creer un nouvel administrateur",
    description: "Ajoutez un nouveau compte admin rapidement."
  },
  {
    id: "video",
    label: "Modifier la video",
    title: "Modifier la video de la page client",
    description: "Definissez l'URL de la video hero affichee sur la page client."
  },
  {
    id: "users",
    label: "Utilisateurs",
    title: "Consulter et mettre a jour les utilisateurs",
    description: "Affichez tous vos utilisateurs, leurs roles et interventions."
  },
  {
    id: "orders",
    label: "Commandes",
    title: "Suivi des commandes",
    description: "Visualisez les commandes et mettez a jour leur statut."
  },
  {
    id: "settings",
    label: "Paramètres",
    title: "Paramètres administrateur",
    description: "Configurez l'affichage des prix et les validations produits."
  }
];

const VALID_ORDER_STATUSES = ["pending", "confirmed", "cancelled"];

function AdminDashboard() {
  const currentAdminEmail = localStorage.getItem("email") || "";
  const currentUserName = localStorage.getItem("name") || "vous";
  const currentUserRole = localStorage.getItem("role") || "";
  const navigate = useNavigate();
  const canCreateAdmin = SUPER_ADMIN_EMAILS.includes(currentAdminEmail) || currentUserRole === "super_admin" || currentUserRole === "admin";
  const isCommercialUser = currentUserRole === "commercial";
  const canViewOrders = currentUserRole === "admin" || currentUserRole === "super_admin" || isCommercialUser;
  const visiblePanels = useMemo(() => {
    if (canCreateAdmin) return panels;
    if (isCommercialUser) return panels.filter(panel => panel.id === "orders");
    return [];
  }, [canCreateAdmin, isCommercialUser]);
  const [searchParams] = useSearchParams();
  const [activePanel, setActivePanel] = useState(() => {
    // Pour utilisateurs commerciaux, afficher le panneau des ordres par défaut
    if (isCommercialUser) {
      return "orders";
    }
    // Pour admins, afficher d'abord les boutons d'action, pas la gestion des categories
    return "";
  });
  const [adminForm, setAdminForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "admin"
  });
  const [adminMessage, setAdminMessage] = useState({ text: "", type: "" });
  const [heroMedia, setHeroMedia] = useState(() => {
    const savedMedia = localStorage.getItem("clientHeroMedia");
    return savedMedia ? JSON.parse(savedMedia) : null;
  });
  const [adminSettings, setAdminSettings] = useState(() => {
    try {
      const savedSettings = localStorage.getItem("adminSettings");
      return savedSettings
        ? JSON.parse(savedSettings)
        : {
            showPriceHome: true,
            showPriceGros: true,
            requireAllProductFields: true,
          };
    } catch (error) {
      return {
        showPriceHome: true,
        showPriceGros: true,
        requireAllProductFields: true,
      };
    }
  });
  const [settingsMessage, setSettingsMessage] = useState("");
  const [videoMessage, setVideoMessage] = useState("");
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [userFeedback, setUserFeedback] = useState({ text: "", type: "" });
  const [editingUserId, setEditingUserId] = useState(null);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [editUserForm, setEditUserForm] = useState({
    username: "",
    email: "",
    role: "user"
  });
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [orderFeedback, setOrderFeedback] = useState({ text: "", type: "" });
  const [selectedCommercialId, setSelectedCommercialId] = useState("");
  const [commercials, setCommercials] = useState([]);
  const [commercialsLoading, setCommercialsLoading] = useState(false);

  const orderRefs = useRef({});
  const [highlightOrderId, setHighlightOrderId] = useState(null);

  // Ref pour scroller vers la section du contenu
  const contentPanelRef = useRef(null);

  // Scroll automatique vers le formulaire quand activePanel change
  useEffect(() => {
    if (contentPanelRef.current) {
      contentPanelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activePanel]);

  useEffect(() => {
    const panelParam = searchParams.get("panel");
    const orderIdParam = searchParams.get("orderId");

    if (panelParam === "orders" && canViewOrders) {
      setActivePanel("orders");
    }
    if (orderIdParam) {
      setHighlightOrderId(orderIdParam);
    }
  }, [searchParams, canViewOrders]);

  useEffect(() => {
    if (activePanel !== "orders" || !highlightOrderId || orders.length === 0) {
      return;
    }

    const highlightedElement = orderRefs.current[highlightOrderId];
    if (highlightedElement) {
      highlightedElement.scrollIntoView({ behavior: "smooth", block: "center" });
      highlightedElement.classList.add("admin-order-card-focused");
      const timer = setTimeout(() => {
        highlightedElement.classList.remove("admin-order-card-focused");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activePanel, highlightOrderId, orders]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === "adminSettings") {
        try {
          setAdminSettings(event.newValue ? JSON.parse(event.newValue) : {
            showPriceHome: true,
            showPriceGros: true,
            requireAllProductFields: true,
          });
        } catch (error) {
          setAdminSettings({
            showPriceHome: true,
            showPriceGros: true,
            requireAllProductFields: true,
          });
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const activeConfig = useMemo(
    () => visiblePanels.find((panel) => panel.id === activePanel),
    [activePanel, visiblePanels]
  );

  const handleCreateAdmin = async (event) => {
    event.preventDefault();
    setIsSubmittingAdmin(true);
    setAdminMessage({ text: "", type: "" });

    try {
      if (!canCreateAdmin) {
        setAdminMessage({
          text: "Seuls les super admins peuvent ajouter d'autres admins.",
          type: "error"
        });
        return;
      }

      // Vérifier que seuls les super admins peuvent créer d'autres super admins
      if (adminForm.role === "super_admin" && !SUPER_ADMIN_EMAILS.includes(currentAdminEmail) && currentUserRole !== "super_admin") {
        setAdminMessage({
          text: "Seuls les super admins peuvent créer d'autres super admins.",
          type: "error"
        });
        return;
      }

      const response = await api.post(
        buildApiUrl("/users/register"),
        {
          username: adminForm.username,
          email: adminForm.email,
          password: adminForm.password,
          role: adminForm.role,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`
          }
        }
      );

      setAdminMessage({
        text: response.data.msg || "Nouvel administrateur cree avec succes.",
        type: "success"
      });
      setAdminForm({
        username: "",
        email: "",
        password: "",
        role: "admin"
      });
    } catch (error) {
      setAdminMessage({
        text: error.response?.data?.msg || "Impossible de creer le nouvel administrateur.",
        type: "error"
      });
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleSaveAdminSettings = (event) => {
    event.preventDefault();
    try {
      const nextSettings = {
        showPriceHome: adminSettings.showPriceHome,
        showPriceGros: adminSettings.showPriceGros,
        requireAllProductFields: adminSettings.requireAllProductFields,
      };
      localStorage.setItem("adminSettings", JSON.stringify(nextSettings));
      setAdminSettings(nextSettings);
      setSettingsMessage("Paramètres enregistrés avec succès.");
    } catch (error) {
      setSettingsMessage("Impossible d'enregistrer les paramètres.");
    }
  };

  const handleSaveVideo = (event) => {
    event.preventDefault();
  };

  const handleMediaSelection = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      setVideoMessage("Selectionnez uniquement une image ou une video.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const nextMedia = {
        kind: isVideo ? "video" : "image",
        src: reader.result,
        name: file.name
      };

      setHeroMedia(nextMedia);
      localStorage.setItem("clientHeroMedia", JSON.stringify(nextMedia));
      localStorage.removeItem("clientHeroVideo");
      setVideoMessage("Le visuel de la page client a ete mis a jour.");
    };
    reader.readAsDataURL(file);
  };

  const fetchUsers = useCallback(async () => {
    if (!canCreateAdmin) {
      return;
    }

    setUsersLoading(true);
    setUsersError("");

    try {
      const response = await api.get(buildApiUrl("/users"), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      setUsers(Array.isArray(response.data.users) ? response.data.users : []);
    } catch (error) {
      setUsersError(error.response?.data?.msg || "Impossible de charger les utilisateurs.");
    } finally {
      setUsersLoading(false);
    }
  }, [canCreateAdmin]);

  const fetchCommercials = useCallback(async () => {
    if (!canCreateAdmin) {
      return;
    }

    setCommercialsLoading(true);

    try {
      const response = await api.get(buildApiUrl("/users/commercials"));
      const commercialUsers = Array.isArray(response.data.commercials) ? response.data.commercials : [];
      setCommercials(commercialUsers);
    } catch (error) {
      console.error("Erreur chargement commerciaux:", error);
      setCommercials([]);
    } finally {
      setCommercialsLoading(false);
    }
  }, [canCreateAdmin]);

  const fetchOrders = useCallback(async () => {
    if (!canViewOrders) {
      return;
    }

    setOrdersLoading(true);
    setOrdersError("");

    try {
      // Admins consulte toutes les commandes, commerciaux consulte seulement les leurs
      const endpoint = isCommercialUser ? "/orders/commercial" : "/orders";
      const response = await api.get(buildApiUrl(endpoint), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      setOrders(Array.isArray(response.data.orders) ? response.data.orders : []);
    } catch (error) {
      setOrdersError(error.response?.data?.msg || "Impossible de charger les commandes.");
    } finally {
      setOrdersLoading(false);
    }
  }, [canViewOrders, isCommercialUser]);

  useEffect(() => {
    if (activePanel === "users" || activePanel === "admin") {
      fetchUsers();
    }
  }, [activePanel, fetchUsers]);

  useEffect(() => {
    if (activePanel === "orders") {
      setSelectedCommercialId("");
      fetchOrders();
      if (canCreateAdmin) {
        fetchCommercials();
      }
    }
  }, [activePanel, fetchOrders, fetchCommercials, canCreateAdmin]);

  const startEditingUser = (user) => {
    setEditingUserId(user._id);
    setEditUserForm({
      username: user.username || "",
      email: user.email || "",
      role: user.role || "user"
    });
    setUserFeedback({ text: "", type: "" });
  };

  const handleEditFieldChange = (field, value) => {
    setEditUserForm((current) => ({ ...current, [field]: value }));
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditUserForm({ username: "", email: "", role: "user" });
  };

  const handleSaveUser = async () => {
    if (!editingUserId) {
      return;
    }

    setUserFeedback({ text: "", type: "" });
    try {
      const payload = {};
      if (editUserForm.username.trim()) payload.username = editUserForm.username.trim();
      if (editUserForm.email.trim()) payload.email = editUserForm.email.trim();
      if (editUserForm.role) payload.role = editUserForm.role;

      const response = await api.put(
        buildApiUrl(`/users/${editingUserId}`),
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`
          }
        }
      );

      const updatedUser = response.data.user;
      setUsers((current) =>
        current.map((user) => (user._id === updatedUser._id ? updatedUser : user))
      );
      setUserFeedback({
        text: response.data.msg || "Utilisateur mis a jour.",
        type: "success"
      });
      handleCancelEdit();
    } catch (error) {
      setUserFeedback({
        text: error.response?.data?.msg || "Impossible de mettre a jour l'utilisateur.",
        type: "error"
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!userId) {
      return;
    }

    setUserFeedback({ text: "", type: "" });
    try {
      await api.delete(buildApiUrl(`/users/${userId}`), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      setUsers((current) => current.filter((user) => user._id !== userId));
      setUserFeedback({
        text: "Utilisateur supprime.",
        type: "success"
      });
    } catch (error) {
      setUserFeedback({
        text: error.response?.data?.msg || "Impossible de supprimer l'utilisateur.",
        type: "error"
      });
    }
  };

  const handleUpdateUserStatus = async (userId, status) => {
    if (!userId || !["pending", "approved", "rejected"].includes(status)) {
      return;
    }

    setUserFeedback({ text: "", type: "" });
    try {
      const response = await api.put(
        buildApiUrl(`/users/${userId}`),
        { accountStatus: status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`
          }
        }
      );
      const updatedUser = response.data.user;
      setUsers((current) =>
        current.map((user) => (user._id === updatedUser._id ? updatedUser : user))
      );
      setUserFeedback({
        text: response.data.msg || "Statut utilisateur mis a jour.",
        type: "success"
      });
    } catch (error) {
      setUserFeedback({
        text: error.response?.data?.msg || "Impossible de mettre à jour le statut utilisateur.",
        type: "error"
      });
    }
  };

  const handleUpdateOrderStatus = async (orderId, nextStatus) => {
    if (!orderId || !VALID_ORDER_STATUSES.includes(nextStatus)) {
      return;
    }

    setOrderFeedback({ text: "", type: "" });
    try {
      const response = await api.patch(
        buildApiUrl(`/orders/${orderId}/status`),
        { status: nextStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`
          }
        }
      );

      const updatedOrder = response.data.order;
      setOrders((current) =>
        current.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        )
      );
      setOrderFeedback({
        text: response.data.msg || "Statut mis a jour.",
        type: "success"
      });
    } catch (error) {
      setOrderFeedback({
        text: error.response?.data?.msg || "Impossible de mettre a jour le statut.",
        type: "error"
      });
    }
  };

  const renderPanelContent = () => {
    if (activePanel === "categories") {
      return <CategoryManager />;
    }

    if (activePanel === "products") {
      return <ProductManager />;
    }

    if (activePanel === "admin") {
      if (!canCreateAdmin) {
        return (
          <div className="admin-simple-card">
            <p className="admin-feedback admin-feedback-error">
              Seuls les super admins peuvent ajouter d'autres admins.
            </p>
          </div>
        );
      }

      return (
        <div className="admin-simple-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3>Administrateurs existants</h3>
            {!showAdminForm ? (
              <button type="button" className="admin-primary-button" onClick={() => setShowAdminForm(true)}>Cr�er un nouvel admin</button>
            ) : (
              <div>
                <button type="button" className="admin-secondary-button" onClick={() => setShowAdminForm(false)}>Masquer le formulaire</button>
              </div>
            )}
          </div>

          {users && users.filter(u => u.role === 'admin' || u.role === 'super_admin').length === 0 ? (
            <p>Aucun administrateur trouv�.</p>
          ) : (
            <div className="admin-users-table" style={{ marginBottom: 16 }}>
              {users.filter(u => u.role === 'admin' || u.role === 'super_admin').map(u => (
                <div key={u._id} className="admin-users-row">
                  <div className="admin-users-info">
                    <strong>{u.username}</strong>
                    <span>{u.email}</span>
                    <span className="admin-users-role">{u.role}</span>
                  </div>
                  <div className="admin-users-actions">
                    <button type="button" onClick={() => startEditingUser(u)}>Modifier</button>
                    <button type="button" onClick={() => handleDeleteUser(u._id)}>Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showAdminForm && (
            <form className="admin-form-grid" onSubmit={handleCreateAdmin}>
              <label className="admin-form-field">
              <span>Nom d'utilisateur</span>
              <input
                type="text"
                value={adminForm.username}
                onChange={(event) =>
                  setAdminForm({ ...adminForm, username: event.target.value })
                }
                required
              />
            </label>

            <label className="admin-form-field">
              <span>Email</span>
              <input
                type="email"
                value={adminForm.email}
                onChange={(event) =>
                  setAdminForm({ ...adminForm, email: event.target.value })
                }
                required
              />
            </label>

            <label className="admin-form-field">
              <span>Mot de passe</span>
              <input
                type="password"
                value={adminForm.password}
                onChange={(event) =>
                  setAdminForm({ ...adminForm, password: event.target.value })
                }
                required
              />
            </label>

            <label className="admin-form-field">
              <span>Type d'administrateur</span>
              <div className="admin-role-selection">
                <label className="admin-radio-option">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={adminForm.role === "admin"}
                    onChange={(event) =>
                      setAdminForm({ ...adminForm, role: event.target.value })
                    }
                  />
                  <span>Admin</span>
                </label>
                <label className="admin-radio-option">
                  <input
                    type="radio"
                    name="role"
                    value="super_admin"
                    checked={adminForm.role === "super_admin"}
                    onChange={(event) =>
                      setAdminForm({ ...adminForm, role: event.target.value })
                    }
                  />
                  <span>Super Admin</span>
                </label>
                <label className="admin-radio-option">
                  <input
                    type="radio"
                    name="role"
                    value="commercial"
                    checked={adminForm.role === "commercial"}
                    onChange={(event) =>
                      setAdminForm({ ...adminForm, role: event.target.value })
                    }
                  />
                  <span>Commercial</span>
                </label>
              </div>
            </label>

            <button className="admin-primary-button" type="submit" disabled={isSubmittingAdmin}>
              {isSubmittingAdmin ? "Creation..." : "Creer le nouvel admin"}
            </button>
            </form>
          )}

          {adminMessage.text && (
            <p className={`admin-feedback admin-feedback-${adminMessage.type}`}>
              {adminMessage.text}
            </p>
          )}
        </div>
      );
    }

    if (activePanel === "settings") {
      return (
        <div className="admin-simple-card">
          <form className="admin-form-grid" onSubmit={handleSaveAdminSettings}>
            <div className="admin-form-field">
              <label>
                <input
                  type="checkbox"
                  checked={adminSettings.showPriceHome}
                  onChange={(e) =>
                    setAdminSettings({
                      ...adminSettings,
                      showPriceHome: e.target.checked,
                    })
                  }
                />
                <span>Afficher les prix sur la page client (Home)</span>
              </label>
            </div>

            <div className="admin-form-field">
              <label>
                <input
                  type="checkbox"
                  checked={adminSettings.showPriceGros}
                  onChange={(e) =>
                    setAdminSettings({
                      ...adminSettings,
                      showPriceGros: e.target.checked,
                    })
                  }
                />
                <span>Afficher les prix sur la page de vente en gros</span>
              </label>
            </div>

            <div className="admin-form-field">
              <label>
                <input
                  type="checkbox"
                  checked={adminSettings.requireAllProductFields}
                  onChange={(e) =>
                    setAdminSettings({
                      ...adminSettings,
                      requireAllProductFields: e.target.checked,
                    })
                  }
                />
                <span>Exiger tous les champs lors de la création de produits</span>
              </label>
            </div>

            <button type="submit" className="admin-primary-button">
              Enregistrer les paramètres
            </button>
          </form>

          {settingsMessage && (
            <p className="admin-feedback admin-feedback-success" style={{ marginTop: "1rem" }}>
              {settingsMessage}
            </p>
          )}
        </div>
      );
    }

    if (activePanel === "video") {
      return (
        <div className="admin-simple-card">
          <form className="admin-form-grid" onSubmit={handleSaveVideo}>
            <label className="admin-form-field">
              <span>Choisir une image ou une video</span>
              <input type="file" accept="image/*,video/*" onChange={handleMediaSelection} />
            </label>

            <div className="admin-inline-actions">
              <button className="admin-primary-button" type="submit">
                Garder ce fichier
              </button>
              <button
                className="admin-secondary-button"
                type="button"
                onClick={() => {
                  setHeroMedia(null);
                  localStorage.removeItem("clientHeroMedia");
                  localStorage.removeItem("clientHeroVideo");
                  setVideoMessage("Le visuel personnalise a ete retire.");
                }}
              >
                Reinitialiser
              </button>
            </div>
          </form>

          {heroMedia && (
            <div className="admin-media-preview">
              <p className="admin-hint">Fichier actuel: {heroMedia.name}</p>
              {heroMedia.kind === "video" ? (
                <video className="admin-preview-box" src={heroMedia.src} controls />
              ) : (
                <img className="admin-preview-box" src={heroMedia.src} alt={heroMedia.name} />
              )}
            </div>
          )}

          <p className="admin-hint">
            Astuce: si aucun fichier n'est defini, la page client garde son fond visuel par defaut.
          </p>

          {videoMessage && <p className="admin-feedback admin-feedback-success">{videoMessage}</p>}
        </div>
      );
    }

    if (activePanel === "users") {
      return (
        <div className="admin-simple-card admin-users-card">
          {usersError && (
            <p className="admin-feedback admin-feedback-error">{usersError}</p>
          )}
          {usersLoading ? (
            <div className="admin-empty-state">
              <p>Chargement des utilisateurs...</p>
            </div>
          ) : (
            <div className="admin-users-table">
              {users.map((user) => (
                <div key={user._id} className="admin-users-row">
                  {editingUserId === user._id ? (
                    <div className="admin-users-editing">
                      <label>
                        <span>Nom</span>
                        <input
                          value={editUserForm.username}
                          onChange={(event) =>
                            handleEditFieldChange("username", event.target.value)
                          }
                        />
                      </label>
                      <label>
                        <span>Email</span>
                        <input
                          type="email"
                          value={editUserForm.email}
                          onChange={(event) =>
                            handleEditFieldChange("email", event.target.value)
                          }
                        />
                      </label>
                      <label>
                        <span>Role</span>
                        <select
                          value={editUserForm.role}
                          onChange={(event) =>
                            handleEditFieldChange("role", event.target.value)
                          }
                        >
                          {["user", "commercial", "admin", "super_admin"].map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ) : (
                    <div className="admin-users-info">
                      <strong>{user.username}</strong>
                      <span>{user.email}</span>
                      <span className="admin-users-role">{user.role}</span>
                      <span className={`admin-users-status admin-users-status-${user.accountStatus || 'approved'}`}>
                        {user.accountStatus ? user.accountStatus : 'approved'}
                      </span>
                      <span className="admin-users-fiscal">
                        Matricule fiscale: {user.fiscalId || "-"}
                      </span>
                      <span className="admin-users-address">
                        Adresse: {user.address || "Non renseignée"}
                      </span>
                    </div>
                  )}
                  <div className="admin-users-actions">
                    {editingUserId === user._id ? (
                      <>
                        <button type="button" onClick={handleSaveUser}>
                          Enregistrer
                        </button>
                        <button type="button" onClick={handleCancelEdit}>
                          Annuler
                        </button>
                      </>
                    ) : (
                      <>
                        {user.accountStatus === "pending" && (
                          <>
                            <button type="button" onClick={() => handleUpdateUserStatus(user._id, "approved")}>Approuver</button>
                            <button type="button" onClick={() => handleUpdateUserStatus(user._id, "rejected")}>Refuser</button>
                          </>
                        )}
                        <button type="button" onClick={() => startEditingUser(user)}>
                          Modifier
                        </button>
                        <button type="button" onClick={() => handleDeleteUser(user._id)}>
                          Supprimer
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {userFeedback.text && (
            <p className={`admin-feedback admin-feedback-${userFeedback.type}`}>
              {userFeedback.text}
            </p>
          )}
        </div>
      );
    }

    if (activePanel === "orders") {
      const filteredOrders = selectedCommercialId
        ? orders.filter((order) => order.commercial._id === selectedCommercialId)
        : orders;

      return (
        <div className="admin-simple-card admin-orders-card">
          {ordersError && (
            <p className="admin-feedback admin-feedback-error">{ordersError}</p>
          )}
          
          {/* Selector de commercial solo para admins */}
          {canCreateAdmin && (
            <div className="admin-form-field" style={{ marginBottom: "2rem" }}>
              <label>
                <span>Filtrer par commercial</span>
                <select
                  value={selectedCommercialId}
                  onChange={(event) => setSelectedCommercialId(event.target.value)}
                  disabled={commercialsLoading}
                >
                  <option value="">Tous les commerciaux</option>
                  {commercials.map((commercial) => (
                    <option key={commercial._id} value={commercial._id}>
                      {commercial.username} ({commercial.email})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {ordersLoading ? (
            <div className="admin-empty-state">
              <p>Chargement des commandes...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="admin-empty-state">
              <p>{selectedCommercialId ? "Aucune commande pour ce commercial." : "Aucune commande enregistrée pour le moment."}</p>
            </div>
          ) : (
            <div className="admin-orders-grid">
              {filteredOrders.map((order) => (
                    <article
                      key={order._id}
                      ref={(node) => {
                        if (node) {
                          orderRefs.current[order._id] = node;
                        }
                      }}
                      className={`admin-order-card${order._id === highlightOrderId ? " admin-order-card-highlight" : ""}`}
                    >
                  <div className="admin-order-meta">
                    <h3>{order.customerName}</h3>
                    <span className={`admin-order-status admin-order-status-${order.status || "pending"}`}>
                      {order.status || "pending"}
                    </span>
                  </div>
                  <p className="admin-order-detail">{order.customerEmail} · {order.customerPhone}</p>
                  {order.customerLocation && (
                    <p className="admin-order-detail">{order.customerLocation}</p>
                  )}
                  <p className="admin-order-detail">
                    Commercial: {order.commercial?.username || "Non attribué"} (
                    {order.commercial?.email || "sans email"})
                  </p>
                  <p className="admin-order-detail">
                    Commandée par {order.createdBy?.username || order.createdBy?.email || "Utilisateur"}
                    {" le "}
                    {new Date(order.createdAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                  <ul className="admin-order-items">
                    {order.items.map((item) => (
                      <li key={`${order._id}-${item.productId}`}>
                        {item.quantity} × {item.name} ({item.price} DT / {item.unit})
                      </li>
                    ))}
                  </ul>
                  <label className="admin-order-status-picker">
                    <span>Statut</span>
                    <select
                      value={order.status || "pending"}
                      onChange={(event) =>
                        handleUpdateOrderStatus(order._id, event.target.value)
                      }
                    >
                      {VALID_ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                </article>
              ))}
            </div>
          )}
          {orderFeedback.text && (
            <p className={`admin-feedback admin-feedback-${orderFeedback.type}`}>
              {orderFeedback.text}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="admin-empty-state">
        <p>Choisissez une action pour commencer.</p>
      </div>
    );
  };

  return (
    <main className="admin-dashboard-page">
      <section className="admin-simple-hero">
        <div className="admin-simple-hero-content">
          <p className="admin-kicker">
            {isCommercialUser ? "Espace commercial" : "Espace admin"}
          </p>
          <h1>
            {isCommercialUser
              ? "Gestion des commandes"
              : "Administration simple et rapide"}
          </h1>
          <p>
            {isCommercialUser
              ? "Consultez les commandes qui vous sont assignées et suivez leur evolution."
              : "Utilisez les boutons ci-dessous pour gerer les categories, les produits, creer un admin ou modifier la video de la page client."}
          </p>
          {isCommercialUser && (
            <div className="admin-hero-actions">
              <button
                type="button"
                className="admin-primary-button"
                onClick={() => setActivePanel("orders")}
              >
                Consulter mes commandes
              </button>
              <p className="admin-hint">
                Commandes passées avec le commercial {currentUserName}.
              </p>
            </div>
          )}
        </div>
      </section>

      {visiblePanels.length > 0 ? (
        <section className="admin-actions-wrapper">
          <div className="admin-action-grid">
            {visiblePanels.map((panel) => (
              <button
                key={panel.id}
                type="button"
                className={`admin-action-button${activePanel === panel.id ? " is-active" : ""}`}
                onClick={() => setActivePanel(panel.id)}
              >
                <strong>{panel.label}</strong>
                <span>{panel.description}</span>
              </button>
            ))}
          </div>

          <section className="admin-content-panel" ref={contentPanelRef}>
            <div className="admin-content-header">
              <h2>{activeConfig?.title || "Actions disponibles"}</h2>
              <p>
                {activeConfig?.description ||
                  "Selectionnez un bouton pour ouvrir le panneau correspondant."}
              </p>
            </div>

            <div className="admin-content-body">{renderPanelContent()}</div>
          </section>
        </section>
      ) : (
        <section className="admin-actions-wrapper">
          <div className="admin-simple-card admin-restricted-card">
            <p>
              {isCommercialUser
                ? "Les commerciaux utilisent la page de vente en gros pour suivre leurs demandes."
                : "Acces reserve aux administrateurs."}
            </p>
            {isCommercialUser && (
              <button
                type="button"
                className="admin-primary-button"
                onClick={() => navigate("/commercial")}
              >
                Acceder a la vente en gros
              </button>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

export default AdminDashboard;
