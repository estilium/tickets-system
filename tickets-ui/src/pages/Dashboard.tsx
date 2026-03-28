import { useEffect, useState } from "react";
import { api } from "../api/api";

import type { DashboardData, MTTR } from "../types/metrics";
import MTTRChart from "../components/MTTRChart";
import TicketsByStatusChart from "../components/TicketsByStatusChart";


type CardProps = {
  title: string;
  value: number;
  color?: string;
};

function Card({ title, value, color }: CardProps) {
  return (
    <div className={`bg-white shadow rounded p-4 border-l-4 ${color}`}>
      <h2 className="text-gray-500 text-sm">{title}</h2>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [mttr, setMttr] = useState<MTTR[]>([]);
  const [statusData, setStatusData] = useState([]);

  const loadData = async () => {
    try {
 const [dashboardRes, mttrRes, statusRes] = await Promise.all([
  api.get("/metrics/dashboard"),
  api.get("/metrics/mttr-by-day?days=7"),
  api.get("/metrics/tickets-by-status"),
]);

      setData(dashboardRes.data.data);
      setStatusData(statusRes.data.data);
      setMttr(mttrRes.data.data);
    } catch (err) {
      console.error("Error loading dashboard:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!data) if (!data) {
  return (
    <div className="p-4">
      <p className="text-gray-500">Cargando dashboard...</p>
    </div>
  );
}
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* 🔹 Cards */}  
      <div className="grid grid-cols-4 gap-4">
        <Card title="Total" value={data.total} />
        <Card title="Open" value={data.openTickets} color="border-blue-500" />
        <Card title="In Progress" value={data.inProgressTickets} color="border-yellow-500" />
        <Card title="Closed" value={data.closedTickets} color="border-green-500" />
      </div>

      {/* 🔹 Gráficas lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 🔹 Gráfica MTTR */}
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-400">  Últimos 7 días </p>
          <MTTRChart data={mttr} />
        </div>

        {/* 🔹 Gráfica Tickets por Status */}
        <div className="bg-whi p-4 rounded shadow min-h-[300px]">
          <h2 className="mb-2 font-semibold">Tickets por estado</h2>
          <TicketsByStatusChart data={statusData} />
        </div>
      </div>
    </div>

    

  );
}
