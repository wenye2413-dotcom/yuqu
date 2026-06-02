import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const navigate = useNavigate();

  const items = [
    { icon: "notifications", label: "消息通知", desc: "管理推送通知" },
    { icon: "lock", label: "隐私设置", desc: "账号安全与权限" },
    { icon: "palette", label: "主题", desc: "浅色/深色模式" },
    { icon: "groups", label: "共建社区", desc: "参与 Warm Circle 社区建设" },
    { icon: "info", label: "关于", desc: "v1.0.0" },
  ];

  const handleItemClick = (label) => {
    alert("功能开发中");
  };

  return (
    <main className="px-margin-mobile">
      <div className="flex items-center gap-2 py-3 mb-4">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="font-headline-lg text-headline-lg text-on-surface">设置</span>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => handleItemClick(item.label)}
            className="flex items-center gap-4 bg-white/80 rounded-xl p-4 border border-white/40 active:scale-[0.98] transition-transform text-left"
          >
            <span className="material-symbols-outlined text-on-surface-variant">{item.icon}</span>
            <div className="flex-1">
              <p className="font-label-md text-label-md text-on-surface">{item.label}</p>
              <p className="text-xs text-on-surface-variant">{item.desc}</p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant/40">chevron_right</span>
          </button>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-xs text-on-surface-variant/50">Warm Circle Social v1.0.0</p>
      </div>
    </main>
  );
}
