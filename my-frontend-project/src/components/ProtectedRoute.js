import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, loginPath = "/Login", requiredRoles }) => {
  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const location = useLocation();

  if (!token) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (requiredRoles && !requiredRoles.includes(role)) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
