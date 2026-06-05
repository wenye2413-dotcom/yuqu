import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (user) return <Navigate to="/messages" replace />

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    console.log('[Login] 开始登录 email:', email)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log('[Login] signInWithPassword 结果:', { data, error })

    if (error) {
      console.log('[Login] 失败:', error.message)
      alert(error.message)
      setError(error.message)
      setLoading(false)
      return
    }

    if (data?.user) {
      console.log('[Login] 成功，等待 AuthContext onAuthStateChange 自动跳转, user:', data.user.email)
    } else {
      console.log('[Login] 无用户数据返回')
      setError('登录失败，请重试')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="max-w-md w-full bg-white rounded-xl p-6 shadow-lg border border-outline-variant/30">
        {/* 鲸纬 Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center mb-2">
            <svg className="absolute w-24 h-24" viewBox="0 0 96 96">
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c28a2e" />
                  <stop offset="50%" stopColor="#2d7d4e" />
                  <stop offset="100%" stopColor="#367cb3" />
                </linearGradient>
              </defs>
              <circle cx="48" cy="48" r="44" fill="none" stroke="url(#ringGrad)" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" />
              <circle cx="48" cy="48" r="38" fill="none" stroke="#c28a2e" strokeWidth="0.5" opacity="0.2" />
            </svg>
            <span className="text-5xl font-black tracking-tight" style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              background: 'linear-gradient(135deg, #c28a2e 0%, #2d7d4e 40%, #367cb3 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}>
              鲸纬
            </span>
          </div>
          <p className="text-sm text-on-surface-variant/60">在经纬度相遇</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="电子邮件"
            value={email}
            onChange={(e) => { console.log('[Login] email 输入:', e.target.value); setEmail(e.target.value) }}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2d7d4e]"
            required
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => { console.log('[Login] password 已输入'); setPassword(e.target.value) }}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2d7d4e]"
            required
          />

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-[#2d7d4e] text-white font-semibold text-sm disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          还没有账号？
          <Link to="/register" className="text-[#2d7d4e] ml-1">注册</Link>
        </div>
      </div>
    </div>
  )
}

export default Login
