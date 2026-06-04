import { useState } from "react";
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
  const { location: pos } = useLocation();
  const [title, setTitle] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [desc, setDesc] = useState("");
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    if (!title.trim() || !eventTime || !location.trim() || !desc.trim()) {
      toast("请填写完整信息", "error");
      return;
    }
    setPublishing(true);
    const { error } = await supabase.from("events").insert({
      user_id: user.id,
      title: title.trim(),
      description: desc.trim(),
      location: location.trim(),
      event_time: new Date(eventTime).toISOString(),
      latitude: pos?.lat || null,
      longitude: pos?.lng || null,
    });
    setPublishing(false);
    if (error) {
      toast("发布失败: " + error.message, "error");
      return;
    }
    toast("活动已发布", "success");
    navigate("/discovery");
  };

  return (
    <main className="px-margin-mobile pb-8">
      <div className="flex items-center justify-between py-3 mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="font-headline-lg text-headline-lg text-on-surface">发布活动</span>
        </div>
        <button onClick={handlePublish} disabled={publishing || !title.trim() || !eventTime || !location.trim() || !desc.trim()}
          className="px-5 py-2 bg-primary text-white rounded-full font-label-sm text-label-sm disabled:opacity-40 active:scale-95 transition-transform">
          {publishing ? "发布中..." : "发布"}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Avatar name={user?.id || 'U'} size="w-12 h-12" />
        <div>
          <p className="font-label-md text-label-md text-on-surface">{profile?.name || user?.email?.split('@')[0] || '用户'}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-on-surface-variant font-semibold mb-1 block">活动标题</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="给活动起个名字"
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant/30 outline-none placeholder-on-surface-variant/50" />
        </div>
        <div>
          <label className="text-xs text-on-surface-variant font-semibold mb-1 block">活动时间</label>
          <input type="datetime-local" value={eventTime} onChange={(e) => setEventTime(e.target.value)}
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant/30 outline-none" />
        </div>
        <div>
          <label className="text-xs text-on-surface-variant font-semibold mb-1 block">活动地点</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
            placeholder="在哪里举办？"
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant/30 outline-none placeholder-on-surface-variant/50" />
        </div>
        <div>
          <label className="text-xs text-on-surface-variant font-semibold mb-1 block">活动描述</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="详细介绍你的活动..."
            className="w-full min-h-[120px] bg-surface-container-low rounded-xl p-4 text-sm text-on-surface border border-outline-variant/30 outline-none resize-none placeholder-on-surface-variant/50" />
        </div>
      </div>
    </main>
  );
}
