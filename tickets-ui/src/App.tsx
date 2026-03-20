import { Routes, Route } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Tickets from "./pages/tickets";
import TicketDetail from "./pages/TicketDetail";
import Metrics from "./pages/Metrics";
import Users from "./pages/Users";
import Login from "./pages/login";
import NewTicket from "./pages/NewTicket"

function App() {
  return (
    <Routes>

      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >

        <Route index element={<Dashboard />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="tickets/new" element={<NewTicket />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
        <Route path="metrics" element={<Metrics />} />
        <Route path="users" element={<Users />} />
      </Route>

    </Routes>
  );
}

export default App;