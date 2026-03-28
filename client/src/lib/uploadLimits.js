const MB = 1024 * 1024;

const toBytes = (mb) => mb * MB;

const readEnvMb = (envKey, fallbackMb) => {
  const raw = Number(import.meta.env?.[envKey]);
  if (Number.isFinite(raw) && raw > 0) return raw;
  return fallbackMb;
};

export const UPLOAD_LIMITS = {
  recipients: {
    maxSizeMb: readEnvMb("VITE_MAX_FILE_SIZE_MB", 10),
    acceptedExtensions: [".csv", ".xlsx", ".xls", ".json"],
    acceptedMimeTypes: [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/json",
    ],
  },
  template: {
    maxSizeMb: readEnvMb("VITE_MAX_TEMPLATE_SIZE_MB", 25),
    acceptedExtensions: [".pdf", ".png", ".jpg", ".jpeg", ".webp"],
    acceptedMimeTypes: [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ],
  },
  backgroundImage: {
    maxSizeMb: readEnvMb("VITE_MAX_TEMPLATE_SIZE_MB", 25),
    acceptedExtensions: [".png", ".jpg", ".jpeg", ".webp"],
    acceptedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
  },
  signature: {
    maxSizeMb: 2,
    acceptedExtensions: [".png", ".jpg", ".jpeg", ".webp"],
    acceptedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
  },
  font: {
    maxSizeMb: 5,
    acceptedExtensions: [".ttf", ".otf", ".woff", ".woff2"],
    acceptedMimeTypes: [],
  },
};

const getExt = (fileName) => {
  const dot = fileName.lastIndexOf(".");
  if (dot === -1) return "";
  return fileName.slice(dot).toLowerCase();
};

export const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / MB).toFixed(1)} MB`;
};

export const getUploadLimitText = (policy) => {
  if (!policy) return "";
  const extLabel = (policy.acceptedExtensions || []).join(", ").toUpperCase();
  return `${extLabel} (max ${policy.maxSizeMb}MB)`;
};

export const validateUploadFile = (file, policy) => {
  if (!policy) {
    return {
      ok: false,
      reason: "Upload policy is not configured.",
      nextStep: "Try again later or contact support.",
    };
  }

  if (!file) {
    return {
      ok: false,
      reason: "No file selected.",
      nextStep: "Choose a file and try again.",
    };
  }

  const maxBytes = toBytes(policy.maxSizeMb);
  if (file.size > maxBytes) {
    return {
      ok: false,
      reason: `File is too large (${formatFileSize(file.size)}).`,
      nextStep: `Maximum allowed size is ${policy.maxSizeMb}MB. Please compress or choose a smaller file.`,
    };
  }

  const ext = getExt(file.name || "");
  const extOk =
    !policy.acceptedExtensions?.length || policy.acceptedExtensions.includes(ext);
  const mimeOk =
    !policy.acceptedMimeTypes?.length || policy.acceptedMimeTypes.includes(file.type);

  if (!extOk && !mimeOk) {
    return {
      ok: false,
      reason: `Unsupported file type ${ext || "(unknown)"}.`,
      nextStep: `Use one of: ${(policy.acceptedExtensions || []).join(", ").toUpperCase()}`,
    };
  }

  return { ok: true, reason: "", nextStep: "" };
};
