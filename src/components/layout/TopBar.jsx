import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../supabaseClient";
import Avatar from "../common/Avatar";
import Sidebar from "./Sidebar";

const titles = {
  "/messages": "消息",
  "/discovery": "发现",
  "/profile": "我的",
};

const menuPages = ["/profile", "/discovery", "/messages"];

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const path = "/" + location.pathname.split("/").filter(Boolean)[0];
  const title = titles[path] || (path === "/chat" || path === "/group-chat" ? "聊天" : path === "/event" ? "活动" : "返回");
  const isDiscovery = path === "/discovery";
  const isMessages = path === "/messages";
  const showMenu = menuPages.includes(path);

  const hidePaths = ["/chat", "/group-chat", "/event", "/profile/", "/filter-settings", "/settings"];
  const shouldHide = hidePaths.some((p) => location.pathname.startsWith(p) && location.pathname.length > p.length);

  const fetchNotifCount = () => {
    if (!user) return
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false).then(({ count }) => {
      if (count !== null) setNotifCount(count)
    })
  }

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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => fetchNotifCount())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => fetchNotifCount())
      .subscribe()
    const timer = setInterval(fetchNotifCount, 3000)
    const onFocus = () => fetchNotifCount()
    window.addEventListener('focus', onFocus)
    return () => { supabase.removeChannel(channel); clearInterval(timer); window.removeEventListener('focus', onFocus) }
  }, [user?.id])

  const handleRefresh = async () => {
    setRefreshing(true)
    // 触发页面刷新（通过路由参数变化）
    navigate('.', { replace: true, state: { refresh: Date.now() } })
    setTimeout(() => setRefreshing(false), 1000)
  }

  if (shouldHide) return null;

  return (
    <>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <header className="w-full shrink-0 z-50 flex justify-between items-center px-margin-mobile h-16 bg-white/80 backdrop-blur-xl border-b-[1.5px] border-white/40">
        {/* 左侧：头像 → 开侧拉框 */}
        <button onClick={() => setSidebarOpen(true)}
          className="flex items-center hover:bg-surface-container-low/50 rounded-full p-1 cursor-pointer relative">
          <Avatar name={user?.id || "User"} src={profile?.avatar_url} size="w-8 h-8" />
          {notifCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-error text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 shadow">
              {notifCount > 99 ? '99+' : notifCount}
            </span>
          )}
        </button>

        {/* 中间：标题 */}
        {isMessages ? (
          <div id="top-header-animation" className="flex-1 max-w-[160px]" />
        ) : (
          <h1 className={`font-headline-lg-mobile text-headline-lg-mobile ${isDiscovery ? "text-primary" : "text-on-surface"}`}>
            {isDiscovery ? "鲸纬" : title}
          </h1>
        )}

        {/* 右侧空闲 */}
        {!showMenu && <div className="w-10" />}
      </header>
    </>
  );
}
