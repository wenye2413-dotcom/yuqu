import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { path: "/messages", icon: "chat", label: "消息" },
  { path: "/location-chats", icon: "map", label: "地点" },
  { path: "/groups", icon: "groups", label: "群组" },
  { path: "/discovery", icon: "explore", label: "发现" },
  { path: "/profile", icon: "person", label: "我的" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = "/" + location.pathname.split("/").filter(Boolean)[0];

  return (
    <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center h-20 px-margin-mobile pb-4 bg-white/80 backdrop-blur-xl border-t-[1.5px] border-white/40 shadow-[0_-4px_20px_0_rgba(255,157,92,0.1)] rounded-t-lg">
      {tabs.map((tab) => {
        const isActive = currentPath === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center justify-center gap-1 active:scale-95 transition-all duration-200 ${
              isActive
                ? "text-primary"
                : "text-on-surface-variant/60 hover:opacity-80"
            }`}
          >
            <span
              key={isActive ? `${tab.path}-active` : `${tab.path}-inactive`}
              className={`material-symbols-outlined text-[24px] ${isActive ? "animate-taichi-icon-spin" : ""}`}
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {tab.icon}
            </span>
            <span
              className={`font-label-sm text-[10px] ${isActive ? "font-bold" : ""}`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
