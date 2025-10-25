// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// Debug: Log env presence (will not expose secrets, only URL origin)
console.info("ENV CHECK:", {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  hasKey: Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
