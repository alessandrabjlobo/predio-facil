// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { CondominioAtualProvider } from "@/context/CondominioAtualContext";

console.info("ENV CHECK:", {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: import.meta.env.NEXT_PUBLIC_SUPABASE_URL,
  hasKey: Boolean(
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    import.meta.env.VITE_SUPABASE_ANON_KEY ??
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  ),
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <CondominioAtualProvider>
        <App />
      </CondominioAtualProvider>
    </BrowserRouter>
  </React.StrictMode>
);
