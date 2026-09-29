import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./themes.css";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Elemento raiz ausente.");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
