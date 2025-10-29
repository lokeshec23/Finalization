import { createBrowserRouter } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Finalization from "./pages/Finalization";
import FinalizationSummary from "./pages/FinalizationSummary";
import Filter from "./pages/Filter";
import ProtectedRoute from "./components/ProtectedRoute";

const router = createBrowserRouter([
  { path: "/", element: <Login /> },
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
