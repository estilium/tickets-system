import Dashboard from "./Dashboard";

function getUserRole() {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser)?.role;
  } catch {
    return null;
  }
}

export default function Home() {
  const role = getUserRole();

  if (role === "REQUESTER") {
    return (
      <div className="p-4">
        <h1 className="text-4xl font-bold mb-4">Bienvenido ¿En que podemos ayudarte?</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Aquí podrás ver tus avisos e información de inicio.</p>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}
