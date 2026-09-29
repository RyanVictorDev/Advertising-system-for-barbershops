import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { tvViewportWidth } from "./layout";
import "./themes.css";
import "./styles.css";

const tvWidth = tvViewportWidth(window.screen.width, window.screen.height, window.innerWidth, window.outerWidth);
if (tvWidth) {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport instanceof HTMLMetaElement) viewport.content = `width=${tvWidth}, initial-scale=1`;
}

const root = document.getElementById("root");
if (!root) throw new Error("Elemento raiz ausente.");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
