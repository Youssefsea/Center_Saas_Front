import axios, { AxiosError } from "axios";
import { API_BASE } from "../../constants";

export const api = axios.create({
  baseURL: API_BASE,
});

const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const url = error.config?.url ?? "";
    if (
      typeof window !== "undefined" &&
      error.response?.status === 401 &&
      !url.includes("/auth/login") &&
      !url.includes("/auth/register")
    ) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (err: any) =>
  typeof err?.error === "string"
    ? err.error
    : err?.error?.message ?? "حدث خطأ";

export const getErrorCode = (err: any) =>
  typeof err?.error === "object" ? err.error?.code ?? null : null;

export const normalizeApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data ?? {};
    return {
      message: getErrorMessage(data),
      code: getErrorCode(data),
      status: error.response?.status ?? null,
    };
  }
  return {
    message: "حدث خطأ",
    code: null,
    status: null,
  };
};
