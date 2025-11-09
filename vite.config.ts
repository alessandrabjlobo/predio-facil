import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// ✅ Strictly use Vite envs (no fallbacks)
const envUrl = process.env.VITE_SUPABASE_URL;
const envKey = process.env.VITE_SUPABASE_ANON_KEY;

const hasSupabaseEnv = !!envUrl && !!envKey;

console.log("✅ ENV CHECK (vite.config.ts):", {
  hasSupabaseEnv,
  envUrl,
  anonKeyPresent: !!envKey,
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "::",
      port: 8080,
    },

    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),

    resolve: {
      alias: [
        // Always use real client - env vars are required
        {
          find: "@/integrations/supabase/client",
          replacement: path.resolve(__dirname, "./src/integrations/supabase/client.ts"),
        },
        { find: "@", replacement: path.resolve(__dirname, "./src") },
      ],
    },

    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      // Support NEXT_PUBLIC_* envs as requested
      "import.meta.env.NEXT_PUBLIC_SUPABASE_URL": JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL),
      "import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": JSON.stringify(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    },
  };
});
