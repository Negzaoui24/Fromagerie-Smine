import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import "./Auth.css";
import { buildApiUrl } from "../config/api";

const Register = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    role: "user"
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const target = searchParams.get("target");
    if (target === "commercial") {
      setFormData(prev => ({ ...prev, role: "commercial" }));
    } else if (target === "gros") {
      setFormData(prev => ({ ...prev, role: "gros" }));
    } else {
      setFormData(prev => ({ ...prev, role: "user" }));
    }
  }, [location.search]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await axios.post(
        buildApiUrl("/users/register"),
        formData
      );
      setMessageType("success");
      setMessage(response.data.msg);
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.msg || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCommercialRegistration = formData.role === "commercial";
  const isGrosRegistration = formData.role === "gros";

  return (
    <div className="auth-shell min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="auth-card mx-auto grid max-w-6xl gap-8 overflow-hidden rounded-[2rem] bg-white p-6 shadow-2xl ring-1 ring-slate-200 sm:p-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="auth-hero space-y-6 rounded-[1.75rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 text-slate-100 shadow-lg sm:p-10">
          <span className="auth-kicker inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200">
            {isCommercialRegistration ? "Inscription commercial" : isGrosRegistration ? "Inscription gros" : "Nouvelle inscription"}
          </span>

          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {isCommercialRegistration
                ? "Créez votre compte commercial"
                : isGrosRegistration
                ? "Créez votre compte grossiste"
                : "Creez votre compte et lancez votre espace en quelques secondes."
              }
            </h1>
            <p className="max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
              {isCommercialRegistration
                ? "Rejoignez l'équipe commerciale et accédez aux outils de gestion des commandes clients."
                : isGrosRegistration
                ? "Rejoignez notre plateforme de vente en gros et accédez à des tarifs préférentiels."
                : "Commencez avec une experience plus soignee, une meilleure lisibilite et un formulaire pense pour inspirer confiance des le premier ecran."
              }
            </p>
          </div>

          <ul className="auth-feature-list space-y-3 text-sm text-slate-300 sm:text-base">
            {isCommercialRegistration ? (
              <>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />Accès aux commandes clients
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />Interface dédiée aux commerciaux
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />Suivi des demandes professionnelles
                </li>
              </>
            ) : isGrosRegistration ? (
              <>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />Accès aux tarifs en gros
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />Gestion simplifiée des commandes
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />Suivi en temps réel de vos achats
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />Creation de compte simple et guidee
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />Interface nette avec hierarchy visuelle claire
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />Compatible mobile sans perte de confort
                </li>
              </>
            )}
          </ul>
        </section>

        <section className="auth-panel flex flex-col justify-center rounded-[1.75rem] bg-slate-50 p-6 shadow-sm sm:p-8">
          <div className="auth-form-header space-y-2 text-center sm:text-left">
            <h2 className="text-2xl font-semibold text-slate-900">
              {isCommercialRegistration ? "Inscription commercial" : isGrosRegistration ? "Inscription grossiste" : "Inscription"}
            </h2>
            <p className="text-sm text-slate-600">
              {isCommercialRegistration
                ? "Renseignez vos informations pour créer votre compte commercial."
                : isGrosRegistration
                ? "Renseignez vos informations pour créer votre compte grossiste."
                : "Renseignez vos informations pour creer votre compte."
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form mt-8 space-y-5">
            <div className="auth-field">
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="register-username">Nom d'utilisateur</label>
              <input
                id="register-username"
                type="text"
                name="username"
                placeholder="Votre nom d'utilisateur"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="auth-field">
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="register-email">Email</label>
              <input
                id="register-email"
                type="email"
                name="email"
                placeholder="vous@exemple.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="auth-field">
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="register-password">Mot de passe</label>
              <input
                id="register-password"
                type="password"
                name="password"
                placeholder="Choisissez un mot de passe"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="auth-field">
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="register-phone">Téléphone</label>
              <input
                id="register-phone"
                type="tel"
                name="phone"
                placeholder="+216 ..."
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="auth-field">
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="register-address">Adresse</label>
              <input
                id="register-address"
                type="text"
                name="address"
                placeholder="Votre adresse"
                value={formData.address}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <button
              type="submit"
              className="auth-submit inline-flex w-full justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Inscription..." : "S'inscrire"}
            </button>

            {message && (
              <p className={`auth-message ${messageType || "error"} mt-4 text-center text-sm font-medium ${messageType === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                {message}
              </p>
            )}
          </form>

          <p className="auth-switch mt-6 text-center text-sm text-slate-600">
            Vous avez deja un compte ? <Link className="font-semibold text-slate-900 underline-offset-4 hover:text-slate-700" to="/Login">Se connecter</Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Register;
