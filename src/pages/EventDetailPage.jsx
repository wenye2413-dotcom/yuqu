import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import Avatar from "../components/common/Avatar";
import { getGradientBg } from "../hooks/utils";

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [host, setHost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myReg, setMyReg] = useState(null);
  const [regs, setRegs] = useState([]);
  const isHost = event?.user_id === user?.id;

  useEffect(() => {
    if (!eventId) return;
    supabase.from("events").select("*").eq("id", eventId).single().then(({ data, error }) => {
      if (error || !data) { setLoading(false); return }
      setEvent(data);
      supabase.from("profiles").select("name").eq("id", data.user_id).single().then(({ data: p }) => {
        if (p) setHost(p);
      });
      // 如果是主办方，看报名列表；否则看个人报名状态
      if (user?.id === data.user_id) {
        setMyReg(null);
        supabase.from("event_registrations").select("*").eq("event_id", eventId).order("created_at", { ascending: false }).then(({ data: list }) => {
          if (list) setRegs(list);
        });
      } else {
        supabase.from("event_registrations").select("*").eq("event_id", eventId).eq("user_id", user?.id).maybeSingle().then(({ data: r }) => {
          if (r) setMyReg(r);
        });
      }
      setLoading(false);
    });
  }, [eventId, user?.id]);

  const handleJoin = async () => {
    if (isHost) { toast("你是活动组织者", "info"); return }
    const { error } = await supabase.from("event_registrations").insert({
      event_id: eventId, user_id: user.id, status: 'pending',
    });
    if (error) { toast("报名失败: " + error.message, "error"); return }
    setMyReg({ status: 'pending' });
    toast("✅ 已报名，等待主办方确认", "success");
  };

  const handleApprove = async (regId) => {
    await supabase.from("event_registrations").update({ status: 'approved' }).eq("id", regId);
    setRegs(prev => prev.map(r => r.id === regId ? { ...r, status: 'approved' } : r));
    toast("已通过 ✅", "success");
  };

  const handleReject = async (regId) => {
    await supabase.from("event_registrations").update({ status: 'rejected' }).eq("id", regId);
    setRegs(prev => prev.map(r => r.id === regId ? { ...r, status: 'rejected' } : r));
  };

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full w-8 h-8 border-2 border-primary border-t-transparent" />
    </main>
  );

  if (!event) return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-margin-mobile">
      <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">event_busy</span>
      <p className="text-on-surface-variant">活动不存在或已删除</p>
      <button onClick={() => navigate(-1)} className="text-sm text-primary">返回</button>
    </main>
  );

  const eventDate = event.event_time ? new Date(event.event_time).toLocaleString("zh-CN", {
    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', weekday: 'short'
  }) : "";
  const pendingRegs = regs.filter(r => r.status === 'pending');

  return (
    <main className="min-h-screen bg-background pb-8">
      {/* 顶部渐变图 */}
      <div className="h-40 relative" style={{ background: getGradientBg(event.title) }}>
        <button onClick={() => navigate(-1)}
          className="absolute top-12 left-4 w-9 h-9 bg-white/20 backdrop-blur rounded-full flex items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-white text-[20px]">arrow_back</span>
        </button>
      </div>

      <div className="px-margin-mobile -mt-6 relative">
        {/* 标题卡片 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/40 p-5 mb-4">
          <h1 className="font-headline-xl text-headline-xl text-on-surface mb-3">{event.title}</h1>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 text-sm text-on-surface-variant">
              <span className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
              </span>
              <span>{eventDate || "时间待定"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-on-surface-variant">
              <span className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px] text-secondary">location_on</span>
              </span>
              <span>{event.location || "地点待定"}</span>
            </div>
          </div>
        </div>

        {/* 组织者 */}
        {host && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/40 p-4 mb-4 flex items-center gap-3">
            <Avatar name={event.user_id || 'U'} size="w-12 h-12" />
            <div>
              <p className="font-semibold text-sm text-on-surface">{host.name || "用户"}</p>
              <p className="text-xs text-on-surface-variant/60">活动组织者</p>
            </div>
          </div>
        )}

        {/* 活动详情 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/40 p-5 mb-4">
          <h3 className="font-label-md text-label-md text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">description</span>
            活动详情
          </h3>
          <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{event.description}</p>
        </div>

        {/* 操作按钮 */}
        {isHost ? (
          <div className="card p-5">
            <p className="text-sm font-semibold text-primary text-center mb-3">你是此活动的组织者</p>
            <div className="space-y-2">
              <div className="bg-primary/5 rounded-xl p-4 text-sm text-on-surface-variant">
                共有 <strong>{regs.length}</strong> 人报名
                {pendingRegs.length > 0 && <span>，<strong className="text-primary">{pendingRegs.length}</strong> 人待审核</span>}
              </div>
            </div>
          </div>
        ) : myReg ? (
          <div className={`rounded-2xl p-5 text-center border backdrop-blur ${
            myReg.status === 'approved' ? 'bg-bamboo-50/80 border-bamboo-200' :
            myReg.status === 'rejected' ? 'bg-red-50/80 border-red-200' :
            'bg-secondary/10 border-secondary/20'
          }`}>
            <span className="text-2xl block mb-2">
              {myReg.status === 'approved' ? '🎉' : myReg.status === 'rejected' ? '😢' : '⏳'}
            </span>
            <p className="text-sm font-semibold text-on-surface">
              {myReg.status === 'approved' ? '报名已通过' : myReg.status === 'rejected' ? '报名未通过' : '等待主办方确认'}
            </p>
          </div>
        ) : (
          <button onClick={handleJoin}
            className="w-full py-4 bg-primary text-white font-label-md text-label-md rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
            报名参加
          </button>
        )}

        {/* 审核列表 */}
        {isHost && regs.length > 0 && (
          <div className="mt-6">
            <h3 className="font-label-md text-label-md text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">group</span>
              报名申请
              {pendingRegs.length > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{pendingRegs.length} 待处理</span>
              )}
            </h3>
            <div className="space-y-2">
              {regs.map(reg => (
                <div key={reg.id} className="bg-white/80 backdrop-blur-xl rounded-xl px-4 py-3 shadow-sm border border-white/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={reg.user_id} size="w-9 h-9" />
                    <div>
                      <p className="text-sm font-medium text-on-surface">{reg.user_id.substring(0, 8)}...</p>
                      <p className={`text-xs ${reg.status === 'approved' ? 'text-bamboo-600' : reg.status === 'rejected' ? 'text-red-400' : 'text-secondary'}`}>
                        {reg.status === 'pending' ? '待审核' : reg.status === 'approved' ? '已通过' : '已拒绝'}
                      </p>
                    </div>
                  </div>
                  {reg.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(reg.id)}
                        className="text-xs px-4 py-1.5 bg-bamboo-500 text-white rounded-full font-medium active:scale-95 transition-all">通过</button>
                      <button onClick={() => handleReject(reg.id)}
                        className="text-xs px-4 py-1.5 bg-red-400 text-white rounded-full font-medium active:scale-95 transition-all">拒绝</button>
                    </div>
                  )}
                  {reg.status !== 'pending' && (
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      reg.status === 'approved' ? 'bg-bamboo-50 text-bamboo-600' : 'bg-red-50 text-red-400'
                    }`}>{reg.status === 'approved' ? '已通过' : '已拒绝'}</span>
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
