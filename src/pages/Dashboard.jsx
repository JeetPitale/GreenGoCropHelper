import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import FarmerDashboard from "@/components/dashboard/FarmerDashboard";
import ExpertDashboard from "@/components/dashboard/ExpertDashboard";
import WholesalerDashboard from "@/components/dashboard/WholesalerDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";

const Dashboard = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  switch (userRole) {
    case "expert":
      return <ExpertDashboard />;
    case "wholesaler":
      return <WholesalerDashboard />;
    case "admin":
      return <AdminDashboard />;
    default:
      return <FarmerDashboard />;
  }
};

export default Dashboard;
