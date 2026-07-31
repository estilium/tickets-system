import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import AppWatermark from "../components/AppWatermark";

export default function MainLayout() {

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 md:h-screen md:flex-row">

      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">

        <Header />

        <main className="flex-1 overflow-auto px-3 py-4 pb-24 sm:px-4 md:p-6">
          <Outlet />
        </main>

        <AppWatermark />

      </div>

    </div>
  );
}
