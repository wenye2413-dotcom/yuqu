// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yuqu.pages.dev'
const supabaseAnonKey = 'sb_publishable_6zAx4O5bTDOOSe7Pv3uUpw_2sECW0xR'

// Realtime WebSocket 直连 Supabase（不走代理，WebSocket 必须直连）
const REAL_TIME_URL = 'wss://rczqlxxveukukuuwluzg.supabase.co/realtime/v1'

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