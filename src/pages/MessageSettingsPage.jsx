import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/useToast";

export default function MessageSettingsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [soundOn, setSoundOn] = useState(true);
  const [previewOn, setPreviewOn] = useState(true);
  const [dndOn, setDndOn] = useState(false);

  const handleClearCache = () => {
    toast("缓存已清理", "success");
  };

  return (
    <main className="px-margin-mobile pb-12">
      <div className="flex items-center gap-2 py-3 mb-4">
        <button onClick={() => navigate("/messages")} className="w-8 h-8 flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="font-headline-lg text-headline-lg text-on-surface">消息设置</span>
      </div>

      <div className="flex flex-col gap-2">
        {/* 通知声音 */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-xl rounded-xl px-4 py-4 border border-white/40 shadow-sm">
          <div>
            <p className="font-label-md text-label-md text-on-surface">通知声音</p>
            <p className="text-xs text-on-surface-variant">收到新消息时播放提示音</p>
          </div>
          <button
            onClick={() => setSoundOn(!soundOn)}
            className={`w-12 h-7 rounded-full relative transition-colors ${soundOn ? "bg-primary" : "bg-surface-variant"}`}
          >
            <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${soundOn ? "translate-x-[22px]" : "translate-x-0.5"}`} />
          </button>
        </div>

        {/* 消息预览 */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-xl rounded-xl px-4 py-4 border border-white/40 shadow-sm">
          <div>
            <p className="font-label-md text-label-md text-on-surface">消息预览</p>
            <p className="text-xs text-on-surface-variant">在通知栏显示消息内容</p>
          </div>
          <button
            onClick={() => setPreviewOn(!previewOn)}
            className={`w-12 h-7 rounded-full relative transition-colors ${previewOn ? "bg-primary" : "bg-surface-variant"}`}
          >
            <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${previewOn ? "translate-x-[22px]" : "translate-x-0.5"}`} />
          </button>
        </div>

        {/* 消息免打扰 */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-xl rounded-xl px-4 py-4 border border-white/40 shadow-sm">
          <div>
            <p className="font-label-md text-label-md text-on-surface">消息免打扰</p>
            <p className="text-xs text-on-surface-variant">开启后不会收到消息通知</p>
          </div>
          <button
            onClick={() => setDndOn(!dndOn)}
            className={`w-12 h-7 rounded-full relative transition-colors ${dndOn ? "bg-primary" : "bg-surface-variant"}`}
          >
            <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${dndOn ? "translate-x-[22px]" : "translate-x-0.5"}`} />
          </button>
        </div>

        {/* 清理缓存 */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-xl rounded-xl px-4 py-4 border border-white/40 shadow-sm">
          <div>
            <p className="font-label-md text-label-md text-on-surface">清理缓存</p>
            <p className="text-xs text-on-surface-variant">清除本地缓存数据</p>
          </div>
          <button
            onClick={handleClearCache}
            className="px-4 py-2 bg-surface-container-low text-on-surface text-sm rounded-full border border-outline-variant/30 active:scale-95 transition-transform"
          >
            清理
          </button>
        </div>
      </div>
    </main>
  );
}
