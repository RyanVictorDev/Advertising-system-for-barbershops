const WEEKDAYS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"] as const;

export function displayShop(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : "Sua barbearia";
}

export function displayTagline(tagline: string): string {
  const trimmed = tagline.trim();
  return trimmed.length > 0 ? trimmed : "Barbearia";
}

export function monogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SB";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function greeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function formatClock(date: Date): string {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function formatDay(date: Date): string {
  const weekday = WEEKDAYS[date.getDay()];
  const rest = date.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
  return `${weekday} · ${rest}`;
}
