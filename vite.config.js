import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const SUPABASE_URL = "https://rczqlxxveukukuuwluzg.supabase.co";

export default defineConfig(({ mode }) => {
  // 手动加载 .env.local 中的变量（Vite 不会自动合并到 process.env）
  const env = loadEnv(mode, process.cwd(), "");
  const serviceKey = env.VITE_SUPABASE_SERVICE_KEY;

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg"],
        manifest: {
          name: "Warm Circle Social",
          short_name: "Warm Circle",
          description: "连接温暖社交圈",
          theme_color: "#95490d",
          background_color: "#fcf9f8",
          display: "standalone",
          scope: "/",
          start_url: "/",
          icons: [
            { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
            { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        },
      }),
      {
        name: "db-setup",
        configureServer(server) {
          server.middlewares.use("/api/setup-db", async (req, res) => {
            if (!serviceKey) {
              res.writeHead(200, { "content-type": "application/json" });
              res.end(JSON.stringify({ ok: false, error: "Missing VITE_SUPABASE_SERVICE_KEY in .env.local" }));
              return;
            }

            const results = [];
            const headers = {
              authorization: `Bearer ${serviceKey}`,
              apikey: serviceKey,
              "content-type": "application/json",
            };

            // 1. 创建 avatars 存储桶
            try {
              const r = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
                method: "POST",
                headers,
                body: JSON.stringify({ id: "avatars", name: "avatars", public: true }),
              });
              const text = await r.text();
              if (r.ok || r.status === 409 || text.includes('already exists')) {
                results.push("✅ avatars bucket ready");
              } else {
                results.push(`⚠️ bucket (${r.status}): ${text.substring(0, 200)}`);
              }
            } catch (e) {
              results.push(`⚠️ bucket error: ${e.message}`);
            }

            // 2. 尝试 exec_sql RPC（需先通过 SQL 编辑器创建该函数）
            try {
              const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
                method: "POST",
                headers: { ...headers, accept: "application/json" },
                body: JSON.stringify({
                  query: `
                    CREATE TABLE IF NOT EXISTS public.profiles (
                      id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
                      name TEXT DEFAULT '',
                      avatar_url TEXT DEFAULT '',
                      bio TEXT DEFAULT '',
                      updated_at TIMESTAMPTZ DEFAULT NOW()
                    );
                    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
                    DO $$ BEGIN
                      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='users_can_select_own') THEN
                        CREATE POLICY "users_can_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
                      END IF;
                      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='users_can_insert_own') THEN
                        CREATE POLICY "users_can_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
                      END IF;
                      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='users_can_update_own') THEN
                        CREATE POLICY "users_can_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
                      END IF;
                    END $$;
                  `,
                }),
              });
              if (r.ok) {
                results.push("✅ profiles table ready");
              } else {
                const t = await r.text();
                results.push(`ℹ️ exec_sql (${r.status}), checking table…`);
                // 检查 profiles 表是否存在
                const check = await fetch(
                  `${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`,
                  { headers: { ...headers, accept: "application/json" } },
                );
                if (check.ok) {
                  results.push("✅ profiles table exists (queryable)");
                } else if (check.status === 406) {
                  results.push("✅ profiles table exists (empty, no rows)");
                } else {
                  const ct = await check.text();
                  results.push(`⚠️ profiles table not found (${check.status}): ${ct.substring(0, 120)}`);
                }
              }
            } catch (e) {
              results.push(`⚠️ exec_sql error: ${e.message}`);
            }

            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify({ ok: true, results, keyLoaded: !!serviceKey }));
          });
        },
      },
    ],
    server: {
      proxy: {
        '/auth/': {
          target: 'https://rczqlxxveukukuuwluzg.supabase.co',
          changeOrigin: true,
        },
        '/rest/': {
          target: 'https://rczqlxxveukukuuwluzg.supabase.co',
          changeOrigin: true,
        },
        '/storage/': {
          target: 'https://rczqlxxveukukuuwluzg.supabase.co',
          changeOrigin: true,
        },
      },
    },
  };
});
