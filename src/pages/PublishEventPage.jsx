import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { supabase } from "../supabaseClient";
import { useLocation } from "../hooks/useLocation";
import Avatar from "../components/common/Avatar";

export default function PublishEventPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, profile } = useAuth();
  const { location: pos, requestLocation } = useLocation();
  const [title, setTitle] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [locationText, setLocationText] = useState("");
  const [evLat, setEvLat] = useState("");
  const [evLng, setEvLng] = useState("");
  const [desc, setDesc] = useState("");
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (pos) { setEvLat(pos.lat.toFixed(6)); setEvLng(pos.lng.toFixed(6)) }
  }, [pos]);

  const handlePublish = async () => {
    if (!title.trim() || !eventTime || !desc.trim()) {
      toast("请填写完整信息", "error"); return;
    }
    setPublishing(true);
    const { error } = await supabase.from("events").insert({
      user_id: user.id,
      title: title.trim(),
      description: desc.trim(),
      location: locationText.trim() || `${evLat}, ${evLng}`,
      event_time: new Date(eventTime).toISOString(),
      latitude: evLat ? parseFloat(evLat) : null,
      longitude: evLng ? parseFloat(evLng) : null,
    });
    setPublishing(false);
    if (error) { toast("发布失败: " + error.message, "error"); return; }
    toast("活动已发布", "success");
    navigate("/discovery");
  };

  return (
    <main className="h-full flex flex-col bg-[#fcf9f8]">
      <div className="flex items-center justify-between px-margin-mobile py-3 shrink-0 border-b border-[#f0edea]">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="font-semibold text-base text-on-surface">发布活动</span>
        </div>
        <button onClick={handlePublish} disabled={publishing || !title.trim() || !eventTime || !desc.trim()}
          className="px-5 py-2 bg-[#2d7d4e] text-white rounded-full text-sm font-medium disabled:opacity-40 active:scale-95 transition-all">
          {publishing ? "发布中..." : "发布"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-margin-mobile py-4">
        <div className="flex items-center gap-3 mb-6">
          <Avatar name={user?.id || 'U'} src={profile?.avatar_url} size="w-10 h-10" />
          <p className="font-medium text-sm text-on-surface">{profile?.name || user?.email?.split('@')[0] || '用户'}</p>
        </div>

        <div className="space-y-4">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="活动标题" className="w-full bg-white rounded-xl px-4 py-3.5 text-sm outline-none border border-[#f0edea] focus:border-primary/30 transition-colors" />
          <input type="datetime-local" value={eventTime} onChange={e => setEventTime(e.target.value)}
            className="w-full bg-white rounded-xl px-4 py-3.5 text-sm outline-none border border-[#f0edea] focus:border-primary/30 transition-colors" />

          <div>
            <p className="text-xs text-on-surface-variant/60 mb-2">活动位置（经纬度）</p>
            <div className="flex gap-2 mb-2">
              <input type="text" value={evLat} onChange={e => setEvLat(e.target.value)}
                placeholder="纬度" className="flex-1 bg-white rounded-xl px-4 py-3 text-sm outline-none border border-[#f0edea] font-mono" />
              <input type="text" value={evLng} onChange={e => setEvLng(e.target.value)}
                placeholder="经度" className="flex-1 bg-white rounded-xl px-4 py-3 text-sm outline-none border border-[#f0edea] font-mono" />
            </div>
            <p className="text-[10px] text-on-surface-variant/40 mb-3">
              {pos ? `当前位置: ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}` : '定位中...'}
              <button onClick={requestLocation} className="text-primary ml-1">刷新</button>
            </p>
            <input type="text" value={locationText} onChange={e => setLocationText(e.target.value)}
              placeholder="地点名称（选填，如：朝阳公园）" className="w-full bg-white rounded-xl px-4 py-3 text-sm outline-none border border-[#f0edea]" />
          </div>

          <textarea value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="活动描述..." rows={5}
            className="w-full bg-white rounded-xl px-4 py-3.5 text-sm outline-none border border-[#f0edea] focus:border-primary/30 transition-colors resize-none" />
        </div>
      </div>
    </main>
  );
}
