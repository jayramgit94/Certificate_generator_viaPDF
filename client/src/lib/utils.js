import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date, options = {}) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const defaults = { year: "numeric", month: "short", day: "numeric" };
  return d.toLocaleDateString("en-US", { ...defaults, ...options });
}

export function formatDateTime(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncate(str, length = 50) {
  if (!str) return "";
  return str.length > length ? str.substring(0, length) + "..." : str;
}

export function getInitials(name) {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num?.toString() || "0";
}

export function getStatusColor(status) {
  const colors = {
    active: "badge-success",
    draft: "badge-warning",
    archived: "badge-danger",
    sent: "badge-success",
    failed: "badge-danger",
    pending: "badge-warning",
    generated: "badge-success",
    revoked: "badge-danger",
    delivered: "badge-success",
    bounced: "badge-danger",
    opened: "badge-primary",
  };
  return colors[status] || "badge-primary";
}

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
