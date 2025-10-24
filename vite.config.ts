import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [dyadComponentTagger(), react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      port: 8080,
    },
    // Ensure Vite inlines required environment variables at build time
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        env.VITE_SUPABASE_URL || "https://epzyiotfdrqesllqmgtz.supabase.co"
      ),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwenlpb3RmZHJxZXNsbHFtZ3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzU1NTIsImV4cCI6MjA3NjcxMTU1Mn0.QUpFl5zkSsG9kfq0t4Lr6wtAbzlm-Il9zxLtXCtfKTE"
      ),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(
        env.VITE_SUPABASE_PROJECT_ID || "epzyiotfdrqesllqmgtz"
      ),
      // Back-compat for any code using ANON_KEY naming
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
        env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwenlpb3RmZHJxZXNsbHFtZ3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzU1NTIsImV4cCI6MjA3NjcxMTU1Mn0.QUpFl5zkSsG9kfq0t4Lr6wtAbzlm-Il9zxLtXCtfKTE"
      ),
    },
  };
});
