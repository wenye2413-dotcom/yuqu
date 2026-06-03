// Supabase Proxy Worker — 转发请求到国内可用的 Supabase
const SUPABASE_HOST = 'rczqlxxveukukuuwluzg.supabase.co'

async function handleRequest(event) {
  const request = event.request
  const url = new URL(request.url)
  const targetUrl = `https://${SUPABASE_HOST}${url.pathname}${url.search}`

  const headers = new Headers(request.headers)
  headers.set('Host', SUPABASE_HOST)

  const proxyRequest = new Request(targetUrl, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? null : request.body,
  })

  const response = await fetch(proxyRequest)
  const responseHeaders = new Headers(response.headers)
  responseHeaders.set('Access-Control-Allow-Origin', '*')
  responseHeaders.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH')
  responseHeaders.set('Access-Control-Allow-Headers', '*')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })
}

export default {
  async fetch(event) {
    if (event.request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      })
    }
    return handleRequest(event)
  },
}
