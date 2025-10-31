// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// ✅ importe o Provider do contexto
import { CondominioAtualProvider } from "@/context/CondominioAtualContext";

// Debug: Log env presence (will not expose secrets, only URL origin)
console.info("ENV CHECK:", {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  hasKey: Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* ✅ envolve toda a app com o Provider */}
      <CondominioAtualProvider>
        <App />
      </CondominioAtualProvider>
    </BrowserRouter>
  </React.StrictMode>
);
