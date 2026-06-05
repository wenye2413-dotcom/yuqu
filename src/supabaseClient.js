// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// 开发模式直连 Supabase，生产模式走 Pages 代理
const SUPABASE_HOST = 'rczqlxxveukukuuwluzg.supabase.co'
const supabaseAnonKey = 'sb_publishable_6zAx4O5bTDOOSe7Pv3uUpw_2sECW0xR'

const isDev = import.meta.env.DEV
// 开发模式走 Vite proxy（localhost:5173/auth → Supabase）
const supabaseUrl = isDev
  ? 'http://localhost:5173'
  : 'https://yuqu.pages.dev'

// Realtime WebSocket — 始终直连 Supabase
const REAL_TIME_URL = `wss://${SUPABASE_HOST}/realtime/v1`

// 强制清理所有 Supabase 本地缓存，防止旧的 .co 域名干扰
try {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-')) {
      localStorage.removeItem(key);
    }
  });
} catch (e) {
  // 非浏览器环境忽略
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    endpoint: REAL_TIME_URL,
  },
})
console.log('[Supabase] URL:', supabaseUrl)
console.log('[Supabase] Realtime:', REAL_TIME_URL)
export { supabaseUrl }