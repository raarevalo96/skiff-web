import { AdminSection } from "./types";

export function sectionTitle(section: AdminSection): string {
  switch (section) {
    case "dashboard":
      return "Dashboard";
    case "moderation":
      return "Moderation";
    case "live_listings":
      return "Live Listings";
    default:
      return "Admin";
  }
}

export function displayStatus(status: string): string {
  return status
    .replaceAll("_", " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDate(value: string | null): string {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatCents(value: number | null): string {
  if (typeof value !== "number") {
    return "n/a";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value / 100);
}

export function humanizeAction(action: string): string {
  return action
    .replaceAll("_", " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
