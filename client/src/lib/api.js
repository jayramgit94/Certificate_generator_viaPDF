import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

// Derive the server origin from VITE_API_URL for static file URLs (/uploads/...)
// e.g. "https://my-server.onrender.com/api" → "https://my-server.onrender.com"
const SERVER_ORIGIN = API_BASE.startsWith("http")
  ? API_BASE.replace(/\/api\/?$/, "")
  : "";

/**
 * Convert a relative /uploads/... path to an absolute URL in production.
 * In dev the Vite proxy handles it, so we return the path as-is.
 */
export function getUploadUrl(relativePath) {
  if (!relativePath) return "";
  if (relativePath.startsWith("http")) return relativePath; // already absolute
  return `${SERVER_ORIGIN}${relativePath}`;
}

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

const ERROR_GUIDE_BY_CODE = {
  VALIDATION_ERROR: {
    whatFailed: "Some fields could not be processed.",
    reason: "One or more values are missing or invalid.",
    nextStep: "Review highlighted fields and submit again.",
  },
  BAD_REQUEST: {
    whatFailed: "The request could not be completed.",
    reason: "The server rejected one or more request values.",
    nextStep: "Check your input and try again.",
  },
  UNAUTHORIZED: {
    whatFailed: "Your session is not authorized.",
    reason: "You are not signed in or the session is invalid.",
    nextStep: "Sign in again and retry the action.",
  },
  TOKEN_EXPIRED: {
    whatFailed: "Your session has expired.",
    reason: "The access token is no longer valid.",
    nextStep: "Sign in again to continue.",
  },
  INVALID_TOKEN: {
    whatFailed: "Your session token is invalid.",
    reason: "The authentication token could not be verified.",
    nextStep: "Sign in again and retry.",
  },
  FORBIDDEN: {
    whatFailed: "You do not have permission for this action.",
    reason: "This action requires additional access rights.",
    nextStep: "Use an authorized account or contact an administrator.",
  },
  NOT_FOUND: {
    whatFailed: "The requested item was not found.",
    reason: "It may have been deleted, moved, or never created.",
    nextStep: "Refresh and verify the item ID or selection.",
  },
  CONFLICT: {
    whatFailed: "The action conflicts with existing data.",
    reason: "A duplicate or incompatible record already exists.",
    nextStep: "Adjust the value and try again.",
  },
  DUPLICATE_ERROR: {
    whatFailed: "This value is already in use.",
    reason: "A record with the same unique value already exists.",
    nextStep: "Use a different value and retry.",
  },
  TEMPLATE_LIMIT_REACHED: {
    whatFailed: "Template limit reached for this account.",
    reason: "A maximum of 5 templates is allowed per user.",
    nextStep: "Delete or archive an existing template, then try again.",
  },
  STORAGE_LIMIT_REACHED: {
    whatFailed: "Storage limit reached for this project.",
    reason: "MongoDB storage usage would exceed the 200MB quota.",
    nextStep: "Delete old assets/certificates or increase storage capacity.",
  },
  INVALID_ID: {
    whatFailed: "The provided ID is invalid.",
    reason: "The identifier format does not match the expected format.",
    nextStep: "Check the item link or ID and try again.",
  },
  TOO_MANY_REQUESTS: {
    whatFailed: "Too many requests were sent.",
    reason: "Rate limits were triggered to protect the service.",
    nextStep: "Wait a moment, then retry.",
  },
  UPLOAD_ERROR: {
    whatFailed: "The file upload failed.",
    reason: "The file may be too large or use an unsupported format.",
    nextStep: "Check file type and size limits, then retry.",
  },
  INTERNAL_ERROR: {
    whatFailed: "The server could not complete this action.",
    reason: "An internal error occurred while processing your request.",
    nextStep: "Retry in a few moments. If it continues, contact support.",
  },
};

const ERROR_GUIDE_BY_STATUS = {
  400: ERROR_GUIDE_BY_CODE.BAD_REQUEST,
  401: ERROR_GUIDE_BY_CODE.UNAUTHORIZED,
  403: ERROR_GUIDE_BY_CODE.FORBIDDEN,
  404: ERROR_GUIDE_BY_CODE.NOT_FOUND,
  409: ERROR_GUIDE_BY_CODE.CONFLICT,
  413: ERROR_GUIDE_BY_CODE.STORAGE_LIMIT_REACHED,
  422: ERROR_GUIDE_BY_CODE.VALIDATION_ERROR,
  429: ERROR_GUIDE_BY_CODE.TOO_MANY_REQUESTS,
  500: ERROR_GUIDE_BY_CODE.INTERNAL_ERROR,
};

const FALLBACK_GUIDE = {
  whatFailed: "The request could not be completed.",
  reason: "An unexpected issue occurred.",
  nextStep: "Retry the action. If it persists, contact support.",
};

const summarizeDetails = (details) => {
  if (!Array.isArray(details) || details.length === 0) return "";
  return details
    .slice(0, 2)
    .map((item) => {
      if (item?.field && item?.message) {
        return `${item.field}: ${item.message}`;
      }
      return item?.message || "Invalid input";
    })
    .join("; ");
};

export function getApiErrorInfo(error, fallbackMessage = "Request failed") {
  const status = error?.response?.status ?? null;
  const responseData = error?.response?.data || {};
  const backendError = responseData.error || {};

  const code = backendError.code || responseData.code || null;
  const details = backendError.details || responseData.details || null;
  const technicalMessage =
    backendError.message || responseData.message || error?.message || fallbackMessage;

  const guide =
    (code && ERROR_GUIDE_BY_CODE[code]) ||
    (status && ERROR_GUIDE_BY_STATUS[status]) ||
    FALLBACK_GUIDE;

  const detailSummary = summarizeDetails(details);
  const reason = detailSummary ? `${guide.reason} ${detailSummary}` : guide.reason;

  return {
    status,
    code,
    details,
    technicalMessage,
    whatFailed: guide.whatFailed,
    reason,
    nextStep: guide.nextStep,
    userMessage: `${guide.whatFailed} ${reason}`.trim(),
  };
}

export function getApiErrorMessage(error, fallbackMessage = "Request failed") {
  return getApiErrorInfo(error, fallbackMessage).userMessage;
}

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 + refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefresh } = data.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefresh);

        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
