import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiTarget = process.env.API_PROXY_TARGET || "http://127.0.0.1:3000";

const proxy = {
  "/api": { target: apiTarget, changeOrigin: true },
  "/rails/active_storage": {
    target: apiTarget,
    changeOrigin: true,
    configure: (proxyServer) => {
      proxyServer.on("proxyRes", (proxyRes) => {
        const location = proxyRes.headers.location;
        if (typeof location === "string") {
          proxyRes.headers.location = location.replace(/^https?:\/\/[^/]+/, "");
        }
      });
    },
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: [".trycloudflare.com"],
    watch: {
      usePolling: process.env.CHOKIDAR_USEPOLLING === "true",
    },
    proxy,
  },
  preview: {
    port: 5173,
    host: true,
    proxy,
  },
});
