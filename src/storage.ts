export type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
};

export type SalonState = {
  shopName: string;
  tagline: string;
  playlistUrl: string;
  products: Product[];
  live: boolean;
};

const KEY = "ever.salao.v1";

export function defaultState(): SalonState {
  return {
    shopName: "",
    tagline: "",
    playlistUrl: "",
    products: [],
    live: false,
  };
}

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.description === "string" &&
    typeof record.image === "string"
  );
}

export function loadState(): SalonState {
  const fallback = defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const data = JSON.parse(raw) as Partial<SalonState>;
    return {
      shopName: typeof data.shopName === "string" ? data.shopName : fallback.shopName,
      tagline: typeof data.tagline === "string" ? data.tagline : fallback.tagline,
      playlistUrl: typeof data.playlistUrl === "string" ? data.playlistUrl : "",
      products: Array.isArray(data.products) ? data.products.filter(isProduct) : [],
      live: data.live === true,
    };
  } catch {
    return fallback;
  }
}

export function saveState(state: SalonState): string | null {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return null;
  } catch {
    return "Não coube no cache deste navegador. Use uma foto menor ou remova um produto.";
  }
}
