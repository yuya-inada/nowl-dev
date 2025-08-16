import React from "react";
import { useLocation } from "react-router-dom";
import AdminDashboard from "../components/AdminDashboard";
import UserDashboard from "../components/UserDashboard";

const Dashboard = () => {
  const location = useLocation();
  const role = location.state?.role || "ROLE_USER";

  return (
    <div>
      {role === "ROLE_ADMIN" || role === "ROLE_SUPERADMIN" ? (
        <AdminDashboard />
      ) : (
        <UserDashboard />
      )}
    </div>
  );
};

export default Dashboard;