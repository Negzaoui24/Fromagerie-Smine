import React from "react";
import { Link } from "react-router-dom";

const LoginSelection = () => {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 520, background: "white", borderRadius: 24, boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)", padding: "2.5rem" }}>
        <h1 style={{ marginBottom: "1rem", fontSize: "2rem", color: "#111827" }}>Choisissez votre espace de connexion</h1>
        <p style={{ marginBottom: "1.5rem", color: "#4b5563" }}>
          Sélectionnez l'accès adapté à votre profil pour vous connecter rapidement.
        </p>

        <div style={{ display: "grid", gap: "1rem" }}>
          <Link
            to="/Login"
            style={{
              display: "block",
              textDecoration: "none",
              textAlign: "center",
              padding: "1rem 1.25rem",
              borderRadius: 14,
              background: "#111827",
              color: "white",
              fontWeight: 600
            }}
          >
            Connexion client / admin
          </Link>

          <Link
            to="/gros/login"
            style={{
              display: "block",
              textDecoration: "none",
              textAlign: "center",
              padding: "1rem 1.25rem",
              borderRadius: 14,
              background: "#1f2937",
              color: "white",
              fontWeight: 600
            }}
          >
            Connexion gros
          </Link>

          <Link
            to="/commercial/login"
            style={{
              display: "block",
              textDecoration: "none",
              textAlign: "center",
              padding: "1rem 1.25rem",
              borderRadius: 14,
              background: "#374151",
              color: "white",
              fontWeight: 600
            }}
          >
            Connexion commercial
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginSelection;
