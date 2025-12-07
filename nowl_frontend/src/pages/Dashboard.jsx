import React from "react";
import AdminDashboard from "../components/AdminDashboard";
import UserDashboard from "../components/UserDashboard";
import TopNav from "../components/TopNav";

const Dashboard = ({ currentUser }) => {
  if (!currentUser) {
    return <p>ログインしてください。</p>;
  }

  return (
    <div className="font-crimson">
      <div className="mt-20">
        {currentUser.role === "ROLE_ADMIN" || currentUser.role === "ROLE_SUPERADMIN" ? (
          <AdminDashboard currentUser={currentUser} />
        ) : (
          <UserDashboard />
        )}
      </div>
    </div>
  );
};

export default Dashboard;