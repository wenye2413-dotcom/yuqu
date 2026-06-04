import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import Avatar from "../components/common/Avatar";

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [host, setHost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("events").select("*").eq("id", eventId).single().then(({ data, error }) => {
      if (error || !data) { setLoading(false); return }
      setEvent(data);
      supabase.from("profiles").select("name").eq("id", data.user_id).single().then(({ data: p }) => {
        if (p) setHost(p);
      });
      setLoading(false);
    });
  }, [eventId]);

  const handleJoin = async () => {
    toast("✅ 已报名", "success");
  };

  if (loading) return <main className="p-margin-mobile text-center text-on-surface-variant">加载中...</main>;
  if (!event) return <main className="p-margin-mobile text-center text-on-surface-variant">活动不存在或已删除</main>;

  const eventDate = event.event_time ? new Date(event.event_time).toLocaleString("zh-CN") : "";

  return (
    <main className="pb-8">
      <div className="px-margin-mobile py-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </div>

      <div className="px-margin-mobile">
        <h1 className="font-headline-xl text-headline-xl text-on-surface mb-2">{event.title}</h1>
        <div className="flex items-center gap-2 mb-4 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">schedule</span>
          <span>{eventDate}</span>
        </div>
        <div className="flex items-center gap-2 mb-4 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">location_on</span>
          <span>{event.location || "待定"}</span>
        </div>

        {host && (
          <div className="flex items-center gap-3 mb-4 bg-surface-container-low rounded-xl p-3">
            <Avatar name={event.user_id || 'U'} size="w-10 h-10" />
            <div>
              <p className="text-sm font-semibold text-on-surface">{host.name || "用户"}</p>
              <p className="text-xs text-on-surface-variant">活动组织者</p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="font-label-md text-label-md text-on-surface mb-2">活动详情</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{event.description}</p>
        </div>

        <button onClick={handleJoin}
          className="w-full py-3.5 bg-primary text-white font-label-md text-label-md rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-transform">
          报名参加
        </button>
      </div>
    </main>
  );
}
