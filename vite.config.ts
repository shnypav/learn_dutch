import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/perplexity": {
        target: "https://api.perplexity.ai",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/perplexity/, ""),
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq) => {
            // Log for debugging
            console.log("Proxying request:", proxyReq.path);
          });
        },
      },
    },
  },
});
