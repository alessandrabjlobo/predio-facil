import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// ✅ Detecta corretamente as envs no ambiente Vite/Lovable
const envUrl =
  process.env.VITE_SUPABASE_URL || process?.env?.SUPABASE_URL;
const envKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process?.env?.SUPABASE_KEY;

const hasSupabaseEnv = !!envUrl && !!envKey;

console.log("✅ ENV CHECK (vite.config.ts):", {
  hasSupabaseEnv,
  envUrl,
  envKeyPresent: !!envKey,
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
      // ✅ Usa client.ts quando as envs estão setadas corretamente
      {
        find: "@/integrations/supabase/client",
        replacement: hasSupabaseEnv
          ? path.resolve(__dirname, "./src/integrations/supabase/client.ts")
          : path.resolve(__dirname, "./src/integrations/supabase/client-fallback.ts"),
      },
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
  },
}));
