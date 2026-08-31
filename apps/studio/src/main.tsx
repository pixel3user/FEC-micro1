import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

// Remotion's staticFile() reads this base in the browser Player. Keeping it in
// sync with Vite makes the temporary narration work both locally and from the
// repository's GitHub Pages subpath.
window.remotion_staticBase = import.meta.env.BASE_URL.replace(/\/$/, "");

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element.");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
