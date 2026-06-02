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

  if (user) return <Navigate to="/" replace />

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
        <h1 className="text-headline-lg-mobile font-bold text-center mb-6">和合</h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="电子邮件"
            value={email}
            onChange={(e) => { console.log('[Login] email 输入:', e.target.value); setEmail(e.target.value) }}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#95490d]"
            required
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => { console.log('[Login] password 已输入'); setPassword(e.target.value) }}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#95490d]"
            required
          />

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-[#95490d] text-white font-semibold text-sm disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          还没有账号？
          <Link to="/register" className="text-[#95490d] ml-1">注册</Link>
        </div>
      </div>
    </div>
  )
}

export default Login
