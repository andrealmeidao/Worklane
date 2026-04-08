import { useContext } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import AuthContext from "./context/AuthContext";
import RouteTransition from "./components/RouteTransition";
import Board from "./pages/Board";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Settings from "./pages/Settings";

const RootRedirect = () => {
  const { user } = useContext(AuthContext);

  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
};

function AppRoutes() {
  return (
    <RouteTransition>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/board/:id" element={<Board />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/" element={<RootRedirect />} />
      </Routes>
    </RouteTransition>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 2800,
            className:
              "!rounded-2xl !border !border-slate-200 !bg-white !px-4 !py-3 !text-sm !font-medium !text-slate-900 !shadow-xl dark:!border-slate-700 dark:!bg-slate-900 dark:!text-white",
            success: {
              iconTheme: {
                primary: "#0f766e",
                secondary: "#ecfeff",
              },
            },
            error: {
              iconTheme: {
                primary: "#dc2626",
                secondary: "#fef2f2",
              },
            },
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
