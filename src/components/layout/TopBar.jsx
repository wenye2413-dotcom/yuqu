import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { supabase } from "../../supabaseClient";
import Avatar from "../common/Avatar";
import Sidebar from "./Sidebar";

const titles = {
  "/messages": "消息",
  "/location-chats": "地点",
  "/groups": "群组",
  "/discovery": "CREATOR",
  "/profile": "我的",
};

const menuPages = ["/profile", "/discovery", "/messages", "/groups", "/location-chats"];

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const menuRef = useRef(null);

  const path = "/" + location.pathname.split("/").filter(Boolean)[0];
  const title = titles[path] || (path === "/chat" || path === "/group-chat" ? "聊天" : path === "/event" ? "活动" : "返回");
  const isDiscovery = path === "/discovery";
  const isMessages = path === "/messages";
  const showMenu = menuPages.includes(path);

  const hidePaths = ["/chat", "/group-chat", "/event", "/profile/", "/filter-settings", "/settings"];
  const shouldHide = hidePaths.some((p) => location.pathname.startsWith(p) && location.pathname.length > p.length);

  // 未读通知数
  const fetchNotifCount = () => {
    if (!user) return
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false).then(({ count }) => {
      if (count !== null) setNotifCount(count)
    })
  }

  // 路由变化时刷新（离开通知页回到主页面时）
  const prevPath = useRef(location.pathname)
  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      prevPath.current = location.pathname
      fetchNotifCount()
    }
  })

  useEffect(() => {
    fetchNotifCount()

    const channel = supabase.channel('notif-count')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchNotifCount()
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchNotifCount()
      )
      .subscribe()

    const timer = setInterval(fetchNotifCount, 3000)
    const onFocus = () => fetchNotifCount()
    window.addEventListener('focus', onFocus)
    return () => {
      supabase.removeChannel(channel)
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [user?.id])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  if (shouldHide) return null;

  return (
    <>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <header className="w-full shrink-0 z-50 flex justify-between items-center px-margin-mobile h-16 bg-white/80 backdrop-blur-xl border-b-[1.5px] border-white/40">
        {/* 左侧：头像 → 开侧拉框 */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center hover:bg-surface-container-low/50 rounded-full p-1 cursor-pointer relative"
        >
          <Avatar name={user?.id || "User"} size="w-8 h-8" />
          {notifCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-error text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 shadow">
              {notifCount > 99 ? '99+' : notifCount}
            </span>
          )}
        </button>

        {/* 中间：标题 / 消息页占位 */}
        {isMessages ? (
          <div id="top-header-animation" className="flex-1 max-w-[160px]" />
        ) : (
          <h1 className={`font-headline-lg-mobile text-headline-lg-mobile ${isDiscovery ? "text-primary" : "text-on-surface"}`}>
            {isDiscovery ? "CREATOR" : title}
          </h1>
        )}

        {/* 右侧：通知铃铛 + 三点菜单 */}
        {showMenu && (
          <div className="flex items-center gap-0">
            <button onClick={() => navigate('/notifications')}
              className="relative text-on-surface-variant hover:bg-surface-container-low/50 rounded-full p-2 transition-colors">
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-error text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 shadow">
                  {notifCount > 99 ? '99+' : notifCount}
                </span>
              )}
            </button>
            <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-on-surface-variant hover:bg-surface-container-low/50 rounded-full p-2 transition-colors"
            >
              <span className="material-symbols-outlined">more_vert</span>
            </button>

            {menuOpen && (
              <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-outline-variant/20 min-w-[160px] overflow-hidden z-[100]">
                <button
                  onClick={() => { setMenuOpen(false); navigate("/profile?edit=1"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-surface-container-low text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  <span>编辑资料</span>
                </button>
                <button
                  onClick={() => { setMenuOpen(false); navigate("/settings"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-surface-container-low text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                  <span>设置</span>
                </button>
                <div className="h-[1px] bg-outline-variant/20 mx-3" />
                <button
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-surface-container-low text-error"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>退出登录</span>
                </button>
              </div>
            )}
          </div>
          </div>
        )}

        {!showMenu && <div className="w-10" />}
      </header>
    </>
  );
}
