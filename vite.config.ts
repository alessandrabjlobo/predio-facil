import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
        {
          find: /^@\/integrations\/supabase\/client(\.ts)?$/,
          replacement: path.resolve(
            __dirname,
            "./src/integrations/supabase/client-fallback.ts"
          ),
        },
        {
          find: path.resolve(__dirname, "./src/integrations/supabase/client.ts"),
          replacement: path.resolve(
            __dirname,
            "./src/integrations/supabase/client-fallback.ts"
          ),
        },
        { find: "@", replacement: path.resolve(__dirname, "./src") },
      ],
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(env.VITE_SUPABASE_PUBLISHABLE_KEY),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(env.VITE_SUPABASE_PROJECT_ID),
    },
  };
});
