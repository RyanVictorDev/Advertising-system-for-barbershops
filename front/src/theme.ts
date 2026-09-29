export const appearances = ["dark", "light"] as const;
export const paletteIds = ["ouro", "vinho", "floresta", "oceano"] as const;

export type Appearance = (typeof appearances)[number];
export type PaletteId = (typeof paletteIds)[number];

export const appearanceNames: Record<Appearance, string> = {
  dark: "Escuro",
  light: "Claro",
};

export const palettes: Array<{ id: PaletteId; name: string; swatch: string }> = [
  { id: "ouro", name: "Ouro", swatch: "#c6a56a" },
  { id: "vinho", name: "Vinho", swatch: "#c4818a" },
  { id: "floresta", name: "Floresta", swatch: "#8eae86" },
  { id: "oceano", name: "Oceano", swatch: "#8aa0bb" },
];

export function isAppearance(value: unknown): value is Appearance {
  return typeof value === "string" && appearances.some((item) => item === value);
}

export function isPalette(value: unknown): value is PaletteId {
  return typeof value === "string" && paletteIds.some((item) => item === value);
}
