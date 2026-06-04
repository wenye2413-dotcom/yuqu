// Cloudflare Pages _worker.js — 同域名 Supabase 代理（含 WebSocket）
const SUPABASE_HOST = 'rczqlxxveukukuuwluzg.supabase.co'

// 需要代理的路径前缀
const PROXY_PREFIXES = ['/auth/', '/rest/', '/storage/', '/realtime/']

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const isWebSocket = request.headers.get('Upgrade')?.toLowerCase() === 'websocket'

    // 判断是否需要代理到 Supabase
    const shouldProxy = PROXY_PREFIXES.some((p) => url.pathname.startsWith(p))

    if (shouldProxy) {
      const targetUrl = `https://${SUPABASE_HOST}${url.pathname}${url.search}`

      // 保留原始 Host 避免 Supabase 拒接
      const headers = new Headers(request.headers)
      headers.set('Host', SUPABASE_HOST)

      try {
        const resp = await fetch(targetUrl, {
          method: request.method,
          headers,
          body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
          redirect: 'follow',
        })

        const respHeaders = new Headers(resp.headers)
        respHeaders.set('Access-Control-Allow-Origin', '*')

        return new Response(resp.body, {
          status: resp.status,
          statusText: resp.statusText,
          headers: respHeaders,
        })
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 502,
          headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })
      }
    }

    // 非 API 请求 → 由 Pages 默认处理（返回静态资源）
    return env.ASSETS.fetch(request)
  },
}
