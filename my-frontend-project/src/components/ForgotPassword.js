import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api, { buildApiUrl } from "../api";
import "./Auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      await api.post(buildApiUrl("/users/forgot-password"), { email });
      setMessageType("success");
      setMessage("Si cet email existe dans notre système, vous recevrez un lien de réinitialisation.");

      // Rediriger après 3 secondes
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      setMessageType("error");
      const serverMessage = error.response?.data?.msg || error.message || "Une erreur est survenue";
      setMessage(serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="auth-card mx-auto grid max-w-4xl gap-8 overflow-hidden rounded-[2rem] bg-white p-6 shadow-2xl ring-1 ring-slate-200 sm:p-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="auth-hero space-y-6 rounded-[1.75rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 text-slate-100 shadow-lg sm:p-10">
          <span className="auth-kicker inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200">
            Réinitialisation
          </span>
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Mot de passe oublié ?
            </h1>
            <p className="max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
          </div>
          <ul className="auth-feature-list space-y-3 text-sm text-slate-300 sm:text-base">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Processus simple et sécurisé
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Lien de réinitialisation valide 1 heure
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Votre sécurité est notre priorité
            </li>
          </ul>
        </section>

        <section className="auth-panel flex flex-col justify-center rounded-[1.75rem] bg-slate-50 p-6 shadow-sm sm:p-8">
          <div className="auth-form-header space-y-2 text-center sm:text-left">
            <h2 className="text-2xl font-semibold text-slate-900">Réinitialiser le mot de passe</h2>
            <p className="text-sm text-slate-600">Entrez votre email pour recevoir les instructions.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form mt-8 space-y-5">
            <div className="auth-field">
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <button
              type="submit"
              className="auth-submit inline-flex w-full justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Envoi en cours..." : "Envoyer le lien"}
            </button>

            {message && (
              <p className={`auth-message ${messageType || "error"} mt-4 text-center text-sm font-medium ${messageType === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                {message}
              </p>
            )}
          </form>

          <p className="auth-switch mt-6 text-center text-sm text-slate-600">
            Vous vous souvenez de votre mot de passe ? <Link className="font-semibold text-slate-900 underline-offset-4 hover:text-slate-700" to="/login">Se connecter</Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default ForgotPassword;
