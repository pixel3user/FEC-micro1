import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The GitHub Pages site is served from /FEC-micro1/. The base is overridable
// via STUDIO_BASE so local dev and other hosts work with base "/".
export default defineConfig({
  base: process.env.STUDIO_BASE ?? "/",
  plugins: [react()],
  server: { port: 5273 },
});
