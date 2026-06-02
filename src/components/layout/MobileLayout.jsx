import { useLocation } from "react-router-dom";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";

const tabPaths = ["/messages", "/groups", "/discovery", "/profile"];

export default function MobileLayout({ children }) {
  const location = useLocation();
  const path = "/" + location.pathname.split("/").filter(Boolean)[0];
  const showNav = tabPaths.includes(path);

  return (
    <>
      {/* Desktop Notice */}
      <div className="hidden md:flex min-h-screen bg-surface p-8 items-center justify-center">
        <div className="max-w-md bg-white p-8 rounded-xl shadow-lg border border-outline-variant text-center">
          <span className="material-symbols-outlined text-4xl text-primary mb-4">
            smartphone
          </span>
          <h2 className="font-headline-lg text-headline-lg mb-2 text-on-surface">
            请在移动设备上查看
          </h2>
          <p className="font-body-md text-on-surface-variant">
            此界面专为移动端原生社交体验设计，请缩小浏览器窗口或使用手机查看以获得最佳效果。
          </p>
        </div>
      </div>

      {/* Mobile App — h-screen flex column shell */}
      <div className="md:hidden h-screen flex flex-col bg-background text-on-background">
        <TopBar />
        <div className="flex-1 flex flex-col min-h-0">
          {children}
        </div>
        {showNav && <BottomNav />}
      </div>
    </>
  );
}
