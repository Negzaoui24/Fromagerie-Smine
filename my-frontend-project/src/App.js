import React from "react";
import Register from "./components/Register";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import EditProfile from "./components/EditProfile";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import GrosPage from "./pages/gros";
import LoginSelection from "./pages/LoginSelection";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./pages/Navbar";
import ClientDashboard from "./pages/ClientDashboard";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./pages/CheckoutForm";
import ProtectedRoute from "./components/ProtectedRoute";

const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder"
);

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/client/home" replace />} />
      <Route path="/login-selection" element={<LoginSelection />} />
      <Route path="/register" element={<Register />} />
      <Route path="/Login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/profile" element={
        <ProtectedRoute loginPath="/Login">
          <>
            <Navbar space="client" />
            <EditProfile />
          </>
        </ProtectedRoute>
      } />
      <Route path="/login" element={<Navigate to="/Login" replace />} />
      {/* Redirection des pages de login spécifiques vers la page unifiée */}
      <Route path="/gros/login" element={<Navigate to="/Login?target=gros" replace />} />
      <Route path="/commercial/login" element={<Navigate to="/Login?target=commercial" replace />} />
      <Route path="/client" element={<Navigate to="/client/home" replace />} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

      <Route path="/home" element={<Navigate to="/client/home" replace />} />
      <Route path="/products" element={<Navigate to="/admin/products" replace />} />
      <Route path="/categories" element={<Navigate to="/admin/categories" replace />} />
      <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/client-dashboard" element={<Navigate to="/client/home" replace />} />
      <Route path="/checkout" element={<Navigate to="/client/checkout" replace />} />

      <Route path="/client/home" element={
        <>
          <Navbar space="client" />
          <Home />
        </>
      } />

      <Route path="/commercial" element={
        <ProtectedRoute requiredRoles={["commercial", "admin", "super_admin"]} loginPath="/commercial/login">
          <>
            <Navbar space="admin" />
            <AdminDashboard />
          </>
        </ProtectedRoute>
      } />

      <Route path="/gros" element={
        <ProtectedRoute requiredRoles={["user", "gros"]} loginPath="/gros/login">
          <>
            <Navbar space="gros" />
            <GrosPage />
          </>
        </ProtectedRoute>
      } />

      <Route path="/client/dashboard" element={
        <ProtectedRoute loginPath="/Login">
          <>
            <Navbar space="client" />
            <ClientDashboard />
          </>
        </ProtectedRoute>
      } />

      <Route path="/client/checkout" element={
        <ProtectedRoute loginPath="/Login">
          <>
            <Navbar space="client" />
            <Elements stripe={stripePromise}>
              <CheckoutForm />
            </Elements>
          </>
        </ProtectedRoute>
      } />

      <Route path="/admin/products" element={<Navigate to="/admin/dashboard" replace />} />

      <Route path="/admin/categories" element={<Navigate to="/admin/dashboard" replace />} />

      <Route path="/admin/dashboard" element={
        <ProtectedRoute requiredRoles={["admin", "super_admin"]} loginPath="/Login">
          <>
            <Navbar space="admin" />
            <AdminDashboard />
          </>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/client/home" replace />} />
    </Routes>
  );
};

export default App;
