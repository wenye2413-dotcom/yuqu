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
  const [myReg, setMyReg] = useState(null);    // 当前用户的报名状态
  const [regs, setRegs] = useState([]);          // 报名列表（主办方可见）
  const isHost = event?.user_id === user?.id;

  useEffect(() => {
    if (!eventId) return;
    supabase.from("events").select("*").eq("id", eventId).single().then(({ data, error }) => {
      if (error || !data) { setLoading(false); return }
      setEvent(data);
      supabase.from("profiles").select("name").eq("id", data.user_id).single().then(({ data: p }) => {
        if (p) setHost(p);
      });
      // 当前用户报名状态
      supabase.from("event_registrations").select("*").eq("event_id", eventId).eq("user_id", user?.id).maybeSingle().then(({ data: r }) => {
        if (r) setMyReg(r);
      });
      // 主办方查看报名列表
      if (user?.id === data.user_id) {
        supabase.from("event_registrations").select("*").eq("event_id", eventId).order("created_at", { ascending: false }).then(({ data: list }) => {
          if (list) setRegs(list);
        });
      }
      setLoading(false);
    });
  }, [eventId, user?.id]);

  const handleJoin = async () => {
    if (isHost) { toast("你是活动主办方", "info"); return }
    const { error } = await supabase.from("event_registrations").insert({
      event_id: eventId, user_id: user.id, status: 'pending',
    });
    if (error) { toast("报名失败: " + error.message, "error"); return }
    setMyReg({ status: 'pending' });
    toast("已报名，等待主办方审核", "success");
  };

  const handleApprove = async (regId) => {
    await supabase.from("event_registrations").update({ status: 'approved' }).eq("id", regId);
    setRegs(prev => prev.map(r => r.id === regId ? { ...r, status: 'approved' } : r));
    toast("已通过", "success");
  };

  const handleReject = async (regId) => {
    await supabase.from("event_registrations").update({ status: 'rejected' }).eq("id", regId);
    setRegs(prev => prev.map(r => r.id === regId ? { ...r, status: 'rejected' } : r));
  };

  if (loading) return <main className="p-margin-mobile text-center text-on-surface-variant py-20">加载中...</main>;
  if (!event) return <main className="p-margin-mobile text-center text-on-surface-variant py-20">活动不存在</main>;

  const eventDate = event.event_time ? new Date(event.event_time).toLocaleString("zh-CN", { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "";

  return (
    <main className="pb-8">
      <div className="px-margin-mobile py-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </div>
      <div className="px-margin-mobile">
        <h1 className="font-headline-xl text-headline-xl text-on-surface mb-2">{event.title}</h1>
        <div className="flex items-center gap-2 mb-3 text-sm text-on-surface-variant">
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

        {/* 操作按钮 */}
        {isHost ? (
          <div className="bg-primary/5 rounded-xl p-4 text-center text-sm text-on-surface-variant">
            你是此活动的组织者
          </div>
        ) : myReg ? (
          <div className={`rounded-xl p-4 text-center text-sm ${myReg.status === 'approved' ? 'bg-bamboo-50 text-bamboo-700' : myReg.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-secondary/10 text-secondary'}`}>
            {myReg.status === 'approved' ? '✅ 报名已通过' : myReg.status === 'rejected' ? '❌ 报名未通过' : '⏳ 等待主办方审核'}
          </div>
        ) : (
          <button onClick={handleJoin}
            className="w-full py-3.5 bg-primary text-white font-label-md text-label-md rounded-full shadow-lg active:scale-95 transition-transform">
            报名参加
          </button>
        )}

        {/* 主办方审核列表 */}
        {isHost && regs.length > 0 && (
          <div className="mt-8">
            <h3 className="font-label-md text-label-md text-on-surface mb-3">报名申请（{regs.length}）</h3>
            <div className="space-y-2">
              {regs.map(reg => (
                <div key={reg.id} className="flex items-center justify-between bg-surface-container-low rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={reg.user_id} size="w-8 h-8" />
                    <span className="text-sm text-on-surface">{reg.user_id?.substring(0, 8)}...</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      reg.status === 'approved' ? 'bg-bamboo-50 text-bamboo-700' :
                      reg.status === 'rejected' ? 'bg-red-50 text-red-600' :
                      'bg-secondary/10 text-secondary'
                    }`}>{reg.status === 'pending' ? '待审核' : reg.status === 'approved' ? '已通过' : '已拒绝'}</span>
                  </div>
                  {reg.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(reg.id)} className="text-xs px-3 py-1.5 bg-bamboo-500 text-white rounded-full">通过</button>
                      <button onClick={() => handleReject(reg.id)} className="text-xs px-3 py-1.5 bg-red-400 text-white rounded-full">拒绝</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
