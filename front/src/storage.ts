import type { Appearance, PaletteId } from "./theme";

export type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
};

export type SavedPlaylist = {
  id: string;
  url: string;
  youtubeId: string;
  title: string;
};

export type SalonState = {
  shopName: string;
  tagline: string;
  playlistUrl: string;
  products: Product[];
  playlists: SavedPlaylist[];
  live: boolean;
  appearance: Appearance;
  palette: PaletteId;
  updatedAt: string;
};

