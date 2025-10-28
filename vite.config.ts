import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// ✅ Helper para detectar se as variáveis de ambiente estão disponíveis
const hasSupabaseEnv =
  !!process.env.VITE_SUPABASE_URL && !!process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log("ENV CHECK (vite.config):", {
  hasSupabaseEnv,
  url: process.env.VITE_SUPABASE_URL,
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },

  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),

  resolve: {
    alias: [
      // ✅ Prioriza o client.ts se o ambiente estiver configurado corretamente
      {
        find: "@/integrations/supabase/client",
        replacement: hasSupabaseEnv
          ? path.resolve(__dirname, "./src/integrations/supabase/client.ts")
          : path.resolve(__dirname, "./src/integrations/supabase/client-fallback.ts"),
      },

      // Alias genérico padrão
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
  },
}));
