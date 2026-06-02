import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { getAvatarUrl } from "../../hooks/utils";

const titles = {
  "/messages": "消息",
  "/groups": "群组",
  "/discovery": "CREATOR",
  "/profile": "我的",
};

const menuPages = ["/profile", "/discovery", "/messages", "/groups"];

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const path = "/" + location.pathname.split("/").filter(Boolean)[0];
  const title = titles[path] || (path === "/chat" || path === "/group-chat" ? "聊天" : path === "/event" ? "活动" : "返回");
  const isDiscovery = path === "/discovery";
  const isMessages = path === "/messages";
  const showMenu = menuPages.includes(path);

  const hidePaths = ["/chat", "/group-chat", "/event", "/profile/", "/filter-settings", "/settings"];
  const shouldHide = hidePaths.some((p) => location.pathname.startsWith(p) && location.pathname.length > p.length);

  const avatarSrc = profile?.avatar_url || getAvatarUrl(user?.email || "User");

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
    <header className="w-full shrink-0 z-50 flex justify-between items-center px-margin-mobile h-16 bg-white/80 backdrop-blur-xl border-b-[1.5px] border-white/40">
      {/* 左侧：头像 */}
      <button
        onClick={() => navigate("/profile")}
        className="flex items-center hover:bg-surface-container-low/50 rounded-full p-1 cursor-pointer"
      >
        <img
          src={avatarSrc}
          alt="Profile"
          className="w-8 h-8 rounded-full object-cover"
        />
      </button>

      {/* 中间：标题 / 消息页占位 */}
      {isMessages ? (
        <div id="top-header-animation" className="flex-1 max-w-[160px]" />
      ) : (
        <h1 className={`font-headline-lg-mobile text-headline-lg-mobile ${isDiscovery ? "text-primary" : "text-on-surface"}`}>
          {isDiscovery ? "CREATOR" : title}
        </h1>
      )}

      {/* 右侧：三点菜单 */}
      {showMenu && (
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
      )}

      {/* 没有菜单的页面保留占位 */}
      {!showMenu && <div className="w-10" />}
    </header>
  );
}
