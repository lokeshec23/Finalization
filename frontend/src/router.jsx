import { createBrowserRouter } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Finalization from "./pages/Finalization";
import FinalizationSummary from "./pages/FinalizationSummary";
import Filter from "./pages/Filter";
import ProtectedRoute from "./components/ProtectedRoute";
import TeamSelection from "./pages/TeamSelection"; // ✅ Import new page

const router = createBrowserRouter([
  // ✅ New root route
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <TeamSelection />
      </ProtectedRoute>
    ),
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/finalization",
    element: (
      <ProtectedRoute>
        <Finalization />
      </ProtectedRoute>
    ),
  },
  {
    path: "/finalization/summary",
    element: (
      <ProtectedRoute>
        <FinalizationSummary />
      </ProtectedRoute>
    ),
  },
  {
    path: "/filter",
    element: (
      <ProtectedRoute>
        <Filter />
      </ProtectedRoute>
    ),
  },
]);

export default router;
