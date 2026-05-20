import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Loader from "../components/common/Loader";

function ProtectedRoute({ adminOnly = false, redirectTo = "/login" }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return <Loader fullScreen />;

  if (!isAuthenticated) return <Navigate to={redirectTo} replace />;

  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}

export default ProtectedRoute;
