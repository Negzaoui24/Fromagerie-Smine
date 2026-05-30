import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { buildApiUrl } from "../config/api";
import "./Auth.css";

const EditProfile = () => {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [form, setForm] = useState({ username: "", email: "", phone: "", address: "", currentPassword: "", newPassword: "" });
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(buildApiUrl("/users/profile/me"), {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const user = res.data?.user || {};
        setForm((f) => ({ ...f, username: user.username || user.name || "", email: user.email || "", phone: user.phone || "", address: user.address || "" }));
      } catch (err) {
        console.error("Erreur chargement profil", err);
        setMessageType("error");
        setMessage("Impossible de charger le profil.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (form.newPassword && form.newPassword.length < 6) {
      setMessageType("error");
      setMessage("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    try {
      const payload = {
        username: form.username,
        email: form.email,
        phone: form.phone,
        address: form.address,
        currentPassword: form.currentPassword || undefined,
        newPassword: form.newPassword || undefined
      };

      const res = await axios.put(buildApiUrl("/users/profile/update"), payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      setMessageType("success");
      setMessage(res.data?.msg || "Profil mis à jour avec succès.");

      // Mettre à jour le localStorage si le nom ou l'email a changé
      if (res.data?.user) {
        if (res.data.user.username) localStorage.setItem("name", res.data.user.username);
        if (res.data.user.email) localStorage.setItem("email", res.data.user.email);
      }

      setForm((f) => ({ ...f, currentPassword: "", newPassword: "" }));

      setTimeout(() => {
        navigate("/client/home");
      }, 1200);
    } catch (err) {
      console.error("Erreur mise à jour profil", err);
      const serverMessage = err.response?.data?.msg || err.response?.data?.message || err.message;
      setMessageType("error");
      setMessage(serverMessage || "Erreur lors de la mise à jour.");
    }
  };

  if (loading) return <div className="auth-shell"><div className="auth-card mx-auto p-6">Chargement...</div></div>;

  return (
    <div className="auth-shell min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="auth-card mx-auto grid max-w-4xl gap-8 overflow-hidden rounded-[2rem] bg-white p-6 shadow-2xl ring-1 ring-slate-200 sm:p-8">
        <section className="auth-panel flex flex-col justify-center rounded-[1.75rem] bg-slate-50 p-6 shadow-sm sm:p-8">
          <div className="auth-form-header space-y-2 text-center sm:text-left">
            <h2 className="text-2xl font-semibold text-slate-900">Modifier mon profil</h2>
            <p className="text-sm text-slate-600">Mettez à jour vos informations personnelles.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form mt-6">
            <div className="auth-field">
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="username">Nom</label>
              <input id="username" name="username" value={form.username} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900" />
            </div>

            <div className="auth-field">
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900" />
            </div>

            <div className="auth-field">
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="phone">Téléphone</label>
              <input id="phone" name="phone" value={form.phone} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900" />
            </div>

            <div className="auth-field">
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="address">Adresse</label>
              <input id="address" name="address" value={form.address} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900" />
            </div>

            <hr />

            <div className="auth-field">
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="currentPassword">Mot de passe actuel (nécessaire pour changer)</label>
              <input id="currentPassword" name="currentPassword" type="password" value={form.currentPassword} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900" />
            </div>

            <div className="auth-field">
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="newPassword">Nouveau mot de passe</label>
              <input id="newPassword" name="newPassword" type="password" value={form.newPassword} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900" />
            </div>

            <button type="submit" className="auth-submit inline-flex w-full justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white mt-4">
              Enregistrer les modifications
            </button>

            {message && (
              <p className={`auth-message ${messageType || "error"} mt-4 text-center text-sm font-medium ${messageType === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                {message}
              </p>
            )}
          </form>

        </section>
      </div>
    </div>
  );
};

export default EditProfile;
