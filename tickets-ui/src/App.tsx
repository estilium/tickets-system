import { Routes, Route } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Tickets from "./pages/tickets";
import TicketDetail from "./pages/TicketDetail";
import Users from "./pages/Users";
import Login from "./pages/login";
import NewTicket from "./pages/NewTicket"
import Kanban from "./pages/Kanban";
import AdminActions from "./pages/AdminActions";

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

        <Route index element={<Home />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="tickets/new" element={<NewTicket />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
        <Route path="users" element={<Users />} />
        <Route path="kanban" element={<Kanban />} />
        <Route path="admin/actions" element={<AdminActions />} />
      </Route>

    </Routes>
  );
}

export default App;