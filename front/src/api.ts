import type { Product, SalonState, SavedPlaylist } from "./storage";
import { isAppearance, isPalette } from "./theme";

export type PlaylistHit = SavedPlaylist;

type SalonResponse = {
  shop_name: string;
  tagline: string;
  playlist_url: string;
  live: boolean;
  appearance?: string;
  palette?: string;
  products: Array<{
    id: string;
    name: string;
    description: string;
    image_url: string | null;
  }>;
  playlists?: PlaylistResponse[];
};

type PlaylistResponse = {
  id: string;
  url: string;
  youtube_id: string;
  title?: string | null;
};

export class ApiError extends Error {}

function mapSalon(body: SalonResponse): SalonState {
  return {
    shopName: body.shop_name,
    tagline: body.tagline,
    playlistUrl: body.playlist_url,
    live: body.live,
    appearance: isAppearance(body.appearance) ? body.appearance : "dark",
    palette: isPalette(body.palette) ? body.palette : "ouro",
    playlists: (body.playlists ?? []).map((item) => ({
      id: item.id,
      url: item.url,
      youtubeId: item.youtube_id,
      title: item.title?.trim() ?? "",
    })),
    products: body.products.map(
      (product): Product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        image: product.image_url ?? "",
      }),
    ),
  };
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { errors?: unknown };
    if (Array.isArray(body.errors) && body.errors.every((item) => typeof item === "string") && body.errors.length > 0) {
      return body.errors.join(" ");
    }
  } catch {
    return "Não consegui falar com o salão.";
  }
  return "Não consegui falar com o salão.";
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(path, { ...init, headers: { Accept: "application/json", ...init?.headers } });
  } catch {
    throw new ApiError("Não consegui falar com o salão.");
  }
}

async function readSalon(response: Response): Promise<SalonState> {
  if (!response.ok) throw new ApiError(await readError(response));
  return mapSalon((await response.json()) as SalonResponse);
}

export async function fetchSalon(): Promise<SalonState> {
  return readSalon(await request("/api/salon"));
}

export async function updateSalon(fields: {
  shopName?: string;
  tagline?: string;
  playlistUrl?: string;
  live?: boolean;
  appearance?: SalonState["appearance"];
  palette?: SalonState["palette"];
}): Promise<SalonState> {
  const salon: Record<string, string | boolean> = {};
  if (fields.shopName !== undefined) salon.name = fields.shopName;
  if (fields.tagline !== undefined) salon.tagline = fields.tagline;
  if (fields.playlistUrl !== undefined) salon.playlist_url = fields.playlistUrl;
  if (fields.live !== undefined) salon.live = fields.live;
  if (fields.appearance !== undefined) salon.appearance = fields.appearance;
  if (fields.palette !== undefined) salon.palette = fields.palette;

  return readSalon(
    await request("/api/salon", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salon }),
    }),
  );
}

function productForm(input: { name: string; description: string; image?: Blob }): FormData {
  const body = new FormData();
  body.append("product[name]", input.name);
  body.append("product[description]", input.description);
  if (input.image) body.append("product[image]", input.image, "produto.jpg");
  return body;
}

export async function createProduct(input: { name: string; description: string; image: Blob }): Promise<SalonState> {
  return readSalon(await request("/api/products", { method: "POST", body: productForm(input) }));
}

export async function updateProduct(
  id: string,
  input: { name: string; description: string; image?: Blob },
): Promise<SalonState> {
  if (input.image) {
    return readSalon(await request(`/api/products/${id}`, { method: "PATCH", body: productForm(input) }));
  }
  return readSalon(
    await request(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product: { name: input.name, description: input.description } }),
    }),
  );
}

export async function deleteProduct(id: string): Promise<SalonState> {
  return readSalon(await request(`/api/products/${id}`, { method: "DELETE" }));
}

export async function reorderProducts(ids: string[]): Promise<SalonState> {
  return readSalon(
    await request("/api/product_order", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    }),
  );
}

export async function searchPlaylists(query: string): Promise<PlaylistHit[]> {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  const response = await request(`/api/playlists?${params.toString()}`);
  if (!response.ok) throw new ApiError(await readError(response));
  const body = (await response.json()) as PlaylistResponse[];
  return body.map((item) => ({
    id: item.id,
    url: item.url,
    youtubeId: item.youtube_id,
    title: item.title?.trim() ?? "",
  }));
}

export async function selectPlaylist(id: string): Promise<SalonState> {
  return readSalon(await request(`/api/playlists/${id}/select`, { method: "POST" }));
}
