import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { AnimatePresence, motion } from "framer-motion"
import Avatar from "../common/Avatar"

const menuItems = [
  { icon: 'edit', label: '编辑资料', key: 'edit-profile' },
  { icon: 'settings', label: '设置', key: 'settings' },
]

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate()
  const { user, profile, logout } = useAuth()

  const handleClick = (key) => {
    onClose()
    switch (key) {
      case 'edit-profile':
        navigate('/profile?edit=1')
        break
      case 'settings':
        navigate('/settings')
        break
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[90]"
          />
          {/* 侧拉面板 */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed left-0 top-0 bottom-0 w-[280px] z-[95] bg-white shadow-2xl flex flex-col"
          >
            {/* 用户信息 */}
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 px-5 pt-12 pb-6">
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={user?.id || 'U'} size="w-14 h-14" />
                <div>
                  <p className="font-bold text-base text-on-surface">{profile?.name || user?.email?.split('@')[0] || '用户'}</p>
                  <p className="text-xs text-on-surface-variant/70 truncate max-w-[180px]">{user?.email || ''}</p>
                </div>
              </div>
            </div>

            {/* 菜单 */}
            <nav className="flex-1 py-2">
              {menuItems.map((item) => (
                <button key={item.key} onClick={() => handleClick(item.key)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors active:scale-[0.98]">
                  <span className="material-symbols-outlined text-[22px] text-on-surface-variant">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            {/* 底部 */}
            <div className="border-t border-outline-variant/20 px-5 py-4">
              <button onClick={() => { onClose(); logout(); }}
                className="flex items-center gap-3 text-sm text-error hover:bg-red-50 w-full px-3 py-2.5 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[20px]">logout</span>
                <span>退出登录</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
