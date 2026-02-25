import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import { registerServiceWorker } from "./registerSW";

// Register service worker and PWA install prompt handler
registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
