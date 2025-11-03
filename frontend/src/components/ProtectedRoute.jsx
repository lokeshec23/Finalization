import { Navigate } from "react-router-dom";
import Header from "./Header";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? (
    <>
      <Header />
      {children}
    </>
  ) : (
    <Navigate to="/login" replace />
  );
};

export default ProtectedRoute;
