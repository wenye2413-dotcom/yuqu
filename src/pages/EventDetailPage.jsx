import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { events, currentUser } from "../mocks/data";
import { getGradientBg } from "../hooks/utils";
import { useToast } from "../hooks/useToast";

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const event = events.find((e) => e.id === eventId);
  const isOrganizer = currentUser?.id === event?.hostId;
  const [joinStatus, setJoinStatus] = useState(event?.joinStatus || "none");
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  if (!event) {
    return <main className="p-margin-mobile text-center text-on-surface-variant">活动不存在</main>;
  }

  const handleJoin = () => {
    if (event.isPublic) {
      setJoinStatus("registered");
      toast("✅ 已报名活动", "success");
    } else {
      setJoinStatus("applied");
      toast("申请已发送，等待组织者确认", "info");
    }
  };

  const handleManageEvent = () => {
    toast("管理活动功能开发中", "info");
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    await new Promise((r) => setTimeout(r, 300));
    setComments((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        userId: currentUser.id,
        name: currentUser.name,
        text: commentText.trim(),
        time: "刚刚",
      },
    ]);
    setCommentText("");
    setSubmittingComment(false);
    toast("评论已发送", "success");
  };

  return (
    <main className="pb-6">
      <div className="px-margin-mobile py-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="font-label-md">活动详情</span>
      </div>

      {/* 封面 */}
      <div className={`w-full h-48 bg-gradient-to-br ${getGradientBg(event.title)} flex items-center justify-center`}>
        <span className="material-symbols-outlined text-white text-6xl">
          {eventId === "e1" ? "self_improvement" : "music_note"}
        </span>
      </div>

      <div className="px-margin-mobile -mt-6 relative z-10">
        <div className="bg-white/90 backdrop-blur-xl rounded-xl p-5 shadow-lg border border-white/40">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">{event.title}</h1>
              <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-label-sm">{event.tag}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-label-sm font-bold ${
              isOrganizer ? "bg-secondary/10 text-secondary" :
              joinStatus === "registered" ? "bg-primary-container/50 text-primary" :
              joinStatus === "applied" ? "bg-secondary/10 text-secondary" : "bg-surface-container-low text-on-surface-variant"
            }`}>
              {isOrganizer ? "组织者" : joinStatus === "registered" ? "已报名" : joinStatus === "applied" ? "待审核" : "未报名"}
            </span>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">location_on</span>
              <span className="text-sm">{event.location}</span>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              <span className="text-sm">{event.time}</span>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">person</span>
              <span className="text-sm">组织者: {event.organizer}</span>
            </div>
          </div>
        </div>

        {/* 活动简介 */}
        <div className="mt-4 bg-white/80 rounded-xl p-4 border border-white/40">
          <h3 className="font-label-md mb-2">活动简介</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">{event.desc}</p>
        </div>

        {/* 评论区 */}
        <div className="mt-4 bg-white/80 rounded-xl p-4 border border-white/40">
          <h3 className="font-label-md mb-3">评论区</h3>
          {joinStatus === "none" ? (
            <div className="text-center py-6 text-on-surface-variant text-sm">
              报名后可查看和参与评论
            </div>
          ) : (
            <div>
              {/* 评论列表 */}
              {comments.length > 0 && (
                <div className="space-y-3 mb-4">
                  {comments.map((c) => (
                    <div key={c.id} className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold text-on-surface">{c.name}</span>
                          <span className="text-[10px] text-on-surface-variant/50">{c.time}</span>
                        </div>
                        <p className="text-sm text-on-surface">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {comments.length === 0 && (
                <div className="text-center py-4 text-on-surface-variant text-sm">
                  暂无评论，来发表第一条吧
                </div>
              )}
              {/* 评论输入框 */}
              <div className="flex items-center gap-2 border-t border-outline-variant/20 pt-3">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="写下你的评论..."
                  className="flex-1 bg-surface-container-low rounded-full px-4 py-2 text-sm outline-none"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmitComment(); }}
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || submittingComment}
                  className="w-9 h-9 flex items-center justify-center bg-primary text-white rounded-full disabled:opacity-40 shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="mt-6">
          {joinStatus === "none" && (
            <button onClick={handleJoin} className="w-full py-4 bg-primary text-white font-label-md rounded-full shadow-lg active:scale-95 transition-transform">
              {event.isPublic ? "报名参加" : "申请参加"}
            </button>
          )}
          {joinStatus === "applied" && (
            <button className="w-full py-4 bg-secondary/20 text-secondary font-label-md rounded-full" disabled>
              等待确认中...
            </button>
          )}
          {joinStatus === "registered" && !isOrganizer && (
            <button className="w-full py-4 bg-primary-container/50 text-primary font-label-md rounded-full">
              ✅ 已报名 · 查看详情
            </button>
          )}
          {isOrganizer && (
            <button onClick={handleManageEvent} className="w-full py-4 bg-secondary/10 text-secondary font-label-md rounded-full">
              📋 管理活动 · 查看报名列表
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
