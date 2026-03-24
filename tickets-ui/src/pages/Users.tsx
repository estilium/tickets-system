import { useNavigate } from "react-router-dom";

export default function Users() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Users</h2>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Acciones de Administrador</h3>
        <button
          onClick={() => navigate("/admin/actions")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Ir a Acciones de Admin
        </button>
      </div>
    </div>
  );
}