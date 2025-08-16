import React from "react";
import AdminDashboard from "../components/AdminDashboard";
import UserDashboard from "../components/UserDashboard";

const Dashboard = ({ currentUser}) => {
  if(!currentUser){
    return <p>ログインしてください。</p>
  }

  return (
    <div>
      {currentUser.role === "ROLE_ADMIN" || currentUser.role === "ROLE_SUPERADMIN" ? (
        <AdminDashboard />
      ) : (
        <UserDashboard />
      )}
    </div>
  )
};

export default Dashboard;