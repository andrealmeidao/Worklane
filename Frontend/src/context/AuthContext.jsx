import { createContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import api, { setSessionExpiredHandler } from "../lib/api";

const AuthContext = createContext();

const getStoredUser = () => {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    localStorage.removeItem("user");
    return null;
  }
};

const getResolvedTheme = (theme) => {
  if (theme === "dark") {
    return "dark";
  }

  if (theme === "light") {
    return "light";
  }

  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  return "light";
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const hasNotifiedSessionExpiration = useRef(false);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      return;
    }

    delete api.defaults.headers.common.Authorization;
  }, [token]);

  useEffect(() => {
    const storedTheme = localStorage.getItem("ui-theme");
    const nextTheme = user?.theme ?? storedTheme ?? "system";
    const theme = getResolvedTheme(nextTheme);

    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("ui-theme", nextTheme);
  }, [user?.theme]);

  const clearSession = ({ notify = false, message = "" } = {}) => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    delete api.defaults.headers.common.Authorization;

    if (notify && message) {
      toast.error(message);
    }
  };

  useEffect(() => {
    setSessionExpiredHandler(() => {
      if (hasNotifiedSessionExpiration.current) {
        return;
      }

      hasNotifiedSessionExpiration.current = true;
      clearSession({
        notify: true,
        message: "Sua sessão expirou. Faça login novamente.",
      });
    });

    return () => {
      setSessionExpiredHandler(null);
    };
  }, []);

  const persistSession = (nextUser, nextToken) => {
    hasNotifiedSessionExpiration.current = false;
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
    localStorage.setItem("token", nextToken);
  };

  const syncStoredUser = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));
  };

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      persistSession(res.data.user, res.data.token);
      toast.success("Login realizado com sucesso!");
    } catch (error) {
      toast.error(error.response?.data?.error ?? "Erro no login");
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post("/auth/register", { name, email, password });
      persistSession(res.data.user, res.data.token);
      toast.success("Registro realizado com sucesso!");
    } catch (error) {
      toast.error(error.response?.data?.error ?? "Erro no registro");
      throw error;
    }
  };

  const logout = () => {
    hasNotifiedSessionExpiration.current = false;
    clearSession();
    toast.success("Logout realizado");
  };

  const refreshCurrentUser = async () => {
    const res = await api.get("/users/me");
    syncStoredUser(res.data.user);
    return res.data.user;
  };

  const updateCurrentUser = async (
    payload,
    {
      successMessage = "Perfil atualizado com sucesso!",
      errorMessage = "Erro ao atualizar perfil",
      showToast = true,
    } = {}
  ) => {
    try {
      const res = await api.put("/users/me", payload);
      syncStoredUser(res.data.user);

      if (showToast && successMessage) {
        toast.success(successMessage);
      }

      return res.data.user;
    } catch (error) {
      if (showToast) {
        toast.error(error.response?.data?.error ?? errorMessage);
      }

      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, refreshCurrentUser, updateCurrentUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
