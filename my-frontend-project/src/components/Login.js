import React, { useState } from "react";
import "./Auth.css";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import api, { buildApiUrl } from "../api";

const Login = () => {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Déterminer le type de page selon la route d'origine
    const isGrosPath = location.pathname.includes("gros");
    const isCommercialPath = location.pathname.includes("commercial");

    const getHeadlineContent = () => {
        if (isGrosPath) {
            return {
                kicker: "Espace clients commerciaux",
                title: "Connexion pour vos achats professionnels",
                description: "La consultation du catalogue reste ouverte, mais pour créer une commande ou suivre vos demandes, veuillez vous identifier.",
                features: [
                    "Identité mémorisée pour retrouver vos demandes",
                    "Connexion rapide via email et mot de passe",
                    "Suivi en temps réel de vos commandes"
                ]
            };
        }
        if (isCommercialPath) {
            return {
                kicker: "Espace commerciaux",
                title: "Connexion pour les commerciaux",
                description: "Identifiez-vous pour accéder aux commandes qui vous sont assignées et suivre leur évolution.",
                features: [
                    "Commandes filtrées par votre profil",
                    "Suivi du statut des demandes clients",
                    "Accès aux outils de gestion commerciale"
                ]
            };
        }
        // Par défaut: page admin/client
        return {
            kicker: "Espace membre",
            title: "Connectez-vous et reprenez la main sur votre espace",
            description: "Retrouvez vos produits, vos catégories et votre tableau de bord dans une interface claire, moderne et agréable à utiliser.",
            features: [
                "Accès rapide à votre tableau de bord",
                "Navigation simple et rassurante",
                "Design responsive pour mobile et desktop"
            ]
        };
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage("");

        try {
            const res = await api.post(buildApiUrl("/users/login"), formData, { withCredentials: true });
            const roleRaw = res.data.role || "";
            const role = String(roleRaw).toLowerCase().trim();
            const token = res.data.token;
            
            if (token) {
                localStorage.setItem("token", token);
            }
            localStorage.setItem("name", res.data.username || "");
            localStorage.setItem("email", res.data.email || "");
            localStorage.setItem("role", role);

            // Afficher le message de succès avant redirection
            setMessageType("success");
            setMessage("Connexion réussie ! Redirection en cours...");
            setRedirecting(true);

            // Déterminer la destination selon le rôle
            let redirectPath = "/client/home"; // Par défaut
            
            if (role === "admin" || role === "super_admin") {
                redirectPath = "/admin/dashboard";
            } else if (role === "commercial") {
                redirectPath = "/commercial";
            } else if (role === "gros") {
                redirectPath = "/gros";
            } else if (role === "user") {
                redirectPath = "/client/home";
            }

            // Redirection avec un petit délai pour laisser voir le message
            setTimeout(() => {
                navigate(redirectPath);
            }, 500);
        } catch (error) {
            setMessageType("error");
            console.error("Login error", error);
            const serverMessage = error.response?.data?.msg || error.response?.data?.message;
            const errorMsg = serverMessage || error.message || "Une erreur est survenue lors de la connexion";
            setMessage(errorMsg);
            setRedirecting(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const headlineContent = getHeadlineContent();

    return (
        <div className="auth-shell min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="auth-card mx-auto grid max-w-6xl gap-8 overflow-hidden rounded-[2rem] bg-white p-6 shadow-2xl ring-1 ring-slate-200 sm:p-8 lg:grid-cols-[1.4fr_1fr]">
                <section className="auth-hero space-y-6 rounded-[1.75rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 text-slate-100 shadow-lg sm:p-10">
                    <span className="auth-kicker inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200">
                        {headlineContent.kicker}
                    </span>
                    <div className="space-y-4">
                        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                            {headlineContent.title}
                        </h1>
                        <p className="max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
                            {headlineContent.description}
                        </p>
                    </div>
                    <ul className="auth-feature-list space-y-3 text-sm text-slate-300 sm:text-base">
                        {headlineContent.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="auth-panel flex flex-col justify-center rounded-[1.75rem] bg-slate-50 p-6 shadow-sm sm:p-8">
                    <div className="auth-form-header space-y-2 text-center sm:text-left">
                        <h2 className="text-2xl font-semibold text-slate-900">Connexion</h2>
                        <p className="text-sm text-slate-600">Entrez vos informations pour accéder à votre compte.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form mt-8 space-y-5">
                        <div className="auth-field">
                            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="login-email">Email</label>
                            <input
                                id="login-email"
                                type="email"
                                name="email"
                                placeholder="vous@exemple.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={redirecting}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
                            />
                        </div>

                        <div className="auth-field">
                            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="login-password">Mot de passe</label>
                            <input
                                id="login-password"
                                type="password"
                                name="password"
                                placeholder="Votre mot de passe"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                disabled={redirecting}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
                            />
                        </div>

                        <button
                            type="submit"
                            className="auth-submit inline-flex w-full justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                            disabled={isSubmitting || redirecting}
                        >
                            {redirecting ? "Redirection..." : isSubmitting ? "Connexion..." : "Se connecter"}
                        </button>

                        {message && (
                            <p className={`auth-message ${messageType || "error"} mt-4 text-center text-sm font-medium ${messageType === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                                {message}
                            </p>
                        )}
                    </form>

                    <div className="mt-4 text-center">
                      <Link className="text-sm text-slate-600 hover:underline" to="/forgot-password">Mot de passe oublié ?</Link>
                    </div>

                    <p className="auth-switch mt-4 text-center text-sm text-slate-600">
                        Pas encore de compte ? <Link className="font-semibold text-slate-900 underline-offset-4 hover:text-slate-700" to={isGrosPath ? "/register?target=gros" : isCommercialPath ? "/register?target=commercial" : "/register"}>Créer un compte</Link>
                    </p>
                </section>
            </div>
        </div>
    );
};
export default Login;
