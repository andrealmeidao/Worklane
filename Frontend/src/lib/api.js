import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000"}/api`,
});

let sessionExpiredHandler = null;

export const isSessionError = (error) => {
  const status = error?.response?.status;
  const requestUrl = error?.config?.url ?? "";

  return (
    (status === 401 || status === 403) &&
    !requestUrl.startsWith("/auth/login") &&
    !requestUrl.startsWith("/auth/register")
  );
};

export const setSessionExpiredHandler = (handler) => {
  sessionExpiredHandler = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isSessionError(error) && typeof sessionExpiredHandler === "function") {
      sessionExpiredHandler(error);
    }

    return Promise.reject(error);
  }
);

export default api;
