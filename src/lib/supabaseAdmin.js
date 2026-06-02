import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY

let supabaseAdmin = null
if (serviceKey) {
  if (import.meta.env.PROD) {
    console.warn('⚠️ service_role key detected in production build — this is dangerous!')
  }
  supabaseAdmin = createClient(supabaseUrl, serviceKey)
}

export default supabaseAdmin
