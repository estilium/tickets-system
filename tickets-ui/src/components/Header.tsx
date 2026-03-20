import { useNavigate } from "react-router-dom";

export default function Header() {

  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <div className="h-16 bg-white border-b flex items-center justify-between px-6">

      <span className="font-semibold">Bienvenido</span>

      <button
        onClick={logout}
        className="text-red-500 font-bold"
      >
        Salir
      </button>

    </div>
  );
}