import { Navigate, useLocation } from "react-router-dom";

function getUserRole() {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser)?.role;
  } catch {
    return null;
  }
}

export default function ProtectedRoute({ children }: any) {

  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" />;
  }

  const role = getUserRole();

  if (role === "REQUESTER") {
    const allowed =
      location.pathname === "/" || location.pathname.startsWith("/tickets");
    if (!allowed) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}