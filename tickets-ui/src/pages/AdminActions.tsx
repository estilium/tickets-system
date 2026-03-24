import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";

export default function AdminActions() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDeleteAll = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar TODOS los tickets? Esta acción no se puede deshacer.")) {
      return;
    }

    setLoading(true);
    try {
      await api.delete("/tickets/all");
      alert("Todos los tickets han sido eliminados.");
      navigate("/tickets"); // Redirigir a tickets después
    } catch (error) {
      console.error(error);
      alert("Error al eliminar tickets.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Acciones de Administrador</h2>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Eliminar Todos los Tickets</h3>
        <p className="text-gray-600 mb-4">
          Esta acción eliminará permanentemente todos los tickets del sistema.
          Solo debe usarse en entornos de prueba o cuando sea absolutamente necesario.
        </p>
        <button
          onClick={handleDeleteAll}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Eliminando..." : "Eliminar Todos los Tickets"}
        </button>
      </div>

      <button
        onClick={() => navigate(-1)}
        className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
      >
        Volver
      </button>
    </div>
  );
}