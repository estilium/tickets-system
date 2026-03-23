import { useEffect, useState } from "react";
import { api } from "../api/api";

import type { DashboardData, MTTR } from "../types/metrics";
import MTTRChart from "../components/MTTRChart";
import TicketsByStatusChart from "../components/TicketsByStatusChart";


type CardProps = {
  title: string;
  value: number;
};

function Card({ title, value }: CardProps) {
  return (
    <div className="bg-white shadow rounded p-4">
      <h2 className="text-gray-500">{title}</h2>
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

  if (!data) return <p>Cargando dashboard...</p>;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* 🔹 Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card title="Total" value={data.total} />
        <Card title="Open" value={data.openTickets} />
        <Card title="In Progress" value={data.inProgressTickets} />
        <Card title="Closed" value={data.closedTickets} />
      </div>

      {/* 🔹 Gráfica MTTR */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="mb-2 font-semibold">MTTR últimos 7 días</h2>
        <MTTRChart data={mttr} />
      </div>

      {/* 🔹 Gráfica Tickets por Status */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="mb-2 font-semibold">Tickets por estado</h2>
        <TicketsByStatusChart data={statusData} />
      </div>
    </div>

    

  );
}