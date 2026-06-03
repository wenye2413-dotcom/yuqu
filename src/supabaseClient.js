// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// 请把下方单引号里的内容替换成你的 Project URL 和 anon key
const supabaseUrl = 'https://yuqu.pages.dev'
const supabaseAnonKey = 'sb_publishable_6zAx4O5bTDOOSe7Pv3uUpw_2sECW0xR'

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

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
console.log('[Supabase] URL:', supabaseUrl)
console.log('[Supabase] Domain:', new URL(supabaseUrl).hostname)
export { supabaseUrl }