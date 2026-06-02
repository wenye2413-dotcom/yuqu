import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/useToast";

export default function FilterSettingsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [distance, setDistance] = useState(1000);
  const [datetime, setDatetime] = useState("");

  const handleConfirm = () => {
    const distLabel = distance >= 1000 ? `${(distance / 1000).toFixed(1)}km` : `${distance}m`;
    const timeLabel = datetime || "不限时间";
    console.log("筛选条件应用:", { distance, datetime });
    toast(`筛选: ${distLabel} · ${timeLabel}`, "success");
    navigate("/messages");
  };

  return (
    <main className="px-margin-mobile">
      {/* 返回 */}
      <div className="flex items-center gap-2 py-3 mb-4">
        <button onClick={() => navigate("/messages")} className="w-8 h-8 flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="font-headline-lg text-headline-lg text-on-surface">筛选设置</span>
      </div>

      {/* 距离 — 滑块 + 数字输入 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="font-label-md text-label-md text-on-surface">距离</p>
          <div className="flex items-center gap-1 bg-surface-container-low rounded-lg px-3 py-1 border border-outline-variant/30">
            <input
              type="number"
              min={0}
              max={10000}
              step={10}
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value) || 0)}
              className="w-20 bg-transparent border-none focus:ring-0 text-right text-sm font-semibold text-on-surface outline-none"
            />
            <span className="text-xs text-on-surface-variant">m</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-on-surface-variant w-10">0</span>
          <input
            type="range"
            min={0}
            max={10000}
            step={10}
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            className="flex-1 accent-primary h-1.5"
          />
          <span className="text-xs text-on-surface-variant w-10 text-right">10km</span>
        </div>
        <p className="text-xs text-on-surface-variant/60 mt-2 text-center">
          当前: {distance >= 1000 ? `${(distance / 1000).toFixed(1)}km` : `${distance}m`}
        </p>
      </div>

      {/* 时间 — datetime 选择器 */}
      <div className="mb-8">
        <p className="font-label-md text-label-md text-on-surface mb-4">时间</p>
        <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30">
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-sm text-on-surface outline-none [color-scheme:light]"
          />
          {!datetime && (
            <p className="text-xs text-on-surface-variant/50 mt-1">不选择则不限时间</p>
          )}
          {datetime && (
            <button
              onClick={() => setDatetime("")}
              className="text-xs text-primary mt-1"
            >
              清除
            </button>
          )}
        </div>
      </div>

      {/* 确认 */}
      <button
        onClick={handleConfirm}
        className="w-full py-4 bg-primary text-white font-label-md rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-transform mt-8"
      >
        确认
      </button>
    </main>
  );
}
