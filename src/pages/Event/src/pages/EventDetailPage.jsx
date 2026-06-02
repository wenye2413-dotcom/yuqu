import { useParams, useNavigate } from "react-router-dom";
import { useState/utils";
import { useToast } from "../hooks/ } from "react";
import { events, currentUser } from "../mocks/data";
import { getGradientBg } from "../hooks/utils";
import { useToast } from "../hooks/useToast";

export default functionuseToast";

export default function EventDetailPage() {
  EventDetailPage() {
  const { eventId } = const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const event = events.find((e) => e.id === eventId);
  const isOrganizer = currentUser?.id === event?. useParams();
  const navigatehostId;
  const [ = useNavigate();
  const toast = useToast();

  const event = events.find((joinStatus, setJoinStatus] = useState(event?.joinStatus || "none");
  const [comments, setCommentse) => e.id ===] = useState([]);
  const [commentText, set eventId);
  const isOrganizer = currentCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  ifUser?.id === event?.hostId;
  const [joinStatus, setJoinStatus] = useState(event?.joinStatus || "none");
  (!event) {
    return <main className="p-margin-mobile text-center text-on-surface-variant">活动不存在</main>;
  }

  const handleJoin = () => {
    if (event const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  if (!event) {
    return <main className="p-margin-mobile.isPublic) {
      setJoinStatus("registered");
      text-center text-on toast-surface-variant">活动不存在</main>;
  }

 ("✅ 已报名活动", "success");
    } else {
      setJoinStatus("applied");
      const handleJoin = () => {
    if (event.isPublic) {
      set toast("申请已发送，等待组织者确认", "info");
    }
  };

JoinStatus("registered");
      toast("✅ 已  const handleManageEvent = () => {
    toast("报名活动", "success");
    } else {
      set管理活动功能开发中", "info");
  };

 JoinStatus("applied");
      toast("申请已发送 const handleSubmitComment = async () => {
    if (!，等待组织者确认", "info");
   commentText.trim() || submitting }
  };

  const handleManageEvent = () => {
    toast("管理活动功能开发中", "info");
Comment) return;
    setSubmittingComment(true);
    await new Promise((r) => setTimeout(r, 300));
    setComments((  };

  const handleSubmitComment = async () => {
    if (!commentText.trimprev) => [
      ...prev,
      {
        id() || submittingComment) return;
    setSub: Date.now().toString(),
        userId: currentUser.idmittingComment(true);
    await new Promise((r) =>,
        name: currentUser.name,
        text: comment setTimeout(r, 300));
Text.trim(),
        time: "刚刚",
      },
       setComments((prev) => [
      ...prev,
 ]);
    setCommentText("");
      {
        id: Date.now().toString(),
        userId    setSubmittingComment(false);
    toast("评论已发送", "success");
 : currentUser.id,
        name: currentUser.name,
        text: commentText.trim(),
        time: "刚刚",
      },
    ]);
    setCommentText("");
    setSubmittingComment(false);
 };

  return (
    <main className="pb-6">
      <div className="px-margin-mobile py-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="w-    toast("评论已发送", "success");
  };

  return (
    <main className="pb-6">
8 h-8 flex items      <div className="px-margin-mobile-center justify-center">
          <span className="material-symbols-outlined">arrow_back py-3 flex items-center gap-2">
       </span>
        </button>
        <span className="font-label-md">活动详情 <button onClick={() => navigate(-1)} className="w-8 h-8 flex items</span>
      </-center justify-center">
          <span className="material-symboldiv>

      {/* 封面 */}
      <div className={`ws-outlined">arrow_back</span>
        </button-full h-48 bg-gradient-to-br ${getG>
        <span className="font-label-md">活动详情radientBg(event.title)} flex items-center justify-center`}>
        <span className="material</span>
      </div>

      {/* 封面 */}
-symbols-outlined text     -white text-6xl">
          {eventId === "e1" ? "self <div className={`w_improvement" : "music_note"}
        </span>
      </div>

-full h-48 bg-gradient-to-br ${getGradientBg(event.title)} flex items-center justify-center`}>
        <span className="material-symbols-outlined text-white text-6xl">
          {eventId === "e1" ? "self_improvement" : "      <div className="px-margin-mobile -mt-6 relative z-10">
       music_note"}
        </span>
      </div>

 <div className="bg-white/90 backdrop-blur-xl rounded-xl p-5 shadow-lg border border-white/40      <div className="px-margin-m">
          <div className="flex justify-between items-start mbobile -mt-6 relative z-10">
       -3">
            <div>
              <h1 className <div className="bg-white/90 backdrop-blur-xl rounded="font-headline-lg text-headline-lg text-on-surface-xl p-5 shadow-lg border border-white/40">
          <div className=" mb-1">{event.title}</h1>
             flex justify-between items-start mb-3">
            <div <span className="px-2>
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">{event.title py-0.5 rounded-full bg-secondary/10 text-secondary text-label-sm">{event.tag}</span>
            </div>
           }</h1>
              <span className="px-2 <span className={`px-3 py-1 rounded py-0.5 rounded-full text-label-sm font-bold-full bg-secondary/10 text-secondary text-label-sm">{event.tag ${
              isOrganizer ? "bg-secondary/10 text-secondary" :
              joinStatus === "registered}</span>
            </div>
            <span className={`px-3 py-1" ? "bg-primary-container/50 text-primary" :
 rounded-full text-label-sm font-bold ${
              isOrgan              joinStatus === "appliedizer ? "bg-secondary/10 text-secondary" :
" ? "bg-secondary/10 text-secondary" : "bg-surface-container-low text-on-surface-variant"
              joinStatus === "registered" ? "bg-primary-container/50 text-primary" :
              joinStatus === "applied" ? "bg-secondary/10 text-secondary" : "bg-surface-container-low text-on-surface-variant"
            }`}>
              {isOrganizer ? "组织者" : joinStatus ===            }`}>
              {isOrganizer ? "组织 "registered" ? "已报名" : joinStatus ===者" : joinStatus === "registered" ? "已报名" : joinStatus === "applied" ? "待审核" : "未报名"}
            </span>
          </div>

          <div className="space-y-2 mb-4">
            "applied" ? "待审核" : "未 <div className="flex items-center gap-2 text-on-surface-variant">
             报名"}
            </span>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbol <span className="material-symbols-outlined text-[18px]">location_ons-outlined text-[18px]">location_on</span>
</span>
              <span className="text-sm">{event.location}</span>
                         <span className="text-sm">{ </div>
            <div classNameevent.location}</span>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
="flex items-center gap-2 text-on-surface-variant              <span className="text-sm">{event.time}</span>
            </div>
            <div className="flex items">
              <span className="material-symbols-outlined text-[18px]">-center gap-2 text-on-surface-variant">
             schedule</span>
              <span className="text-sm <span className="material-symbols-outlined text-[18">{event.time}</span>
px]">person</span            </div>
            <div className="flex items-center>
              <span className="text-sm">组织者: {event.organizer gap-2 text-on-surface}</span>
            </div>
          </div>
        </div>

        {/* 活动简介 */}
        <div className="mt-variant">
              <span className="material-symbols-outlined text-[18px]">person</span>
-4 bg-white/80 rounded-xl p-              <span className="text-sm">组织者: {event.organizer}</span>
            </div>
         4 border border-white/40">
          <h </div>
        </div>

        {/* 活动简介 */}
        <div className="3 className="font-label-md mb-2">活动mt-4 bg-white/简介</h3>
          <p className="text-sm text80 rounded-xl p-4 border border-white/40">
         -on-surface-variant leading-relaxed">{event.desc <h3 className="font-label-md mb-2">活动简介</h3}</p>
        </div>

        {/* 评论区 */}
        <div className="mt-4 bg-white/80 rounded-xl p-4>
          <p className="text-sm text-on-surface-variant leading-relaxed">{ border border-white/40">
          <h3 className="event.desc}</p>
        </div>

        {/*font-label-md mb-3"> 评论区 */}
        <div className="mt-4 bg-white/80 rounded-xl p评论区</h3>
          {joinStatus === "none" ? (
            <div className="-4 border border-white/40text-center py-6 text-on-surface-variant text-sm">
          <h3 className="font-label-md mb-3">评论区</h">
              报名后可查看和参与评论
           3>
          {joinStatus === "none" ? (
            <div </div>
          ) : (
            className="text-center py <div>
              {/*-6 text-on-surface-variant text-sm">
              报名后可查看和参与评论
            </div>
          ) : (
            <div>
 评论列表 */}
              {comments.length > 0 && (
                <div className="              {/* 评论列表 */}
              {comments.length > 0 && (
                <div className="space-y-3space-y-3 mb-4">
                  {comments.map((c) => (
                    <div key={c.id} className="flex items-start gap-2">
                      <span className="w-7 h-7 rounded-full bg-primary/10 flex mb-4">
                  { items-center justify-center text-xs font-bold text-primary shrinkcomments.map((c) => (
                    <div key={c.id} className="flex items-start gap-2">
                      <div-0">
                        {c.name.charAt className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink(-0">
                        {c.name.charAt0)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="(0)}
                      </div>
text-xs font-semibold text-on-surface">{c.name                      <div className="flex-1 min-w-0">
                        <div className="flex items-b}</span>
                          <span classNameaseline gap-2">
="text-[10px] text-on-surface-variant/50">{c.time                          <span className="text-xs font-semibold text}</span>
                        </div>
                        <p className="text-on-surface">{c.name}</span>
                          <span className="-sm text-on-surface">{c.text}</p>
                     text-[10px] text-on-surface-variant/50 </div>
                    </div>
                  ))}
               ">{c.time}</span>
                        </div>
                        <p className="text-sm </div>
              )}
              {comments.length === 0 && (
                <div className="text-center py-4 text-on-surface">{c.text}</p>
                      </div text-on-surface-variant text-sm">
                  暂无评论，>
                    </div>
                  ))}
                </div>
              )}
来发表第一条吧
                </div>
              )}
                           {comments.length === 0 && (
                < {/* 评论输入框 */}
              <divdiv className="text-center py-4 text-on-surface-variant text-sm">
                  暂无评论，来发表第一条吧
                </div>
              )}
              {/* 评论输入框 */}
              <div className="flex items-center gap-2 border-t border-outline-variant/20 pt-3">
                <input
                  type="text"
                  value={ className="flex items-center gap-2 bg-surfacecommentText}
                  onChange={(e) => setCommentText(e-container-low rounded-full px-4.target.value)}
                  placeholder py-2 border border-outline-variant/30">
="写下你的评论..."
                  className="flex-1 bg-surface-container-low rounded-full                <input
                  type="text"
                  value={comment px-4 py-2 textText}
                  onChange={(-sm outline-none"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmitComment(); }}
                />
                <button
                  onClick={handleSubmite) => setCommentText(e.target.value)}
                  placeholder="写下你的评论..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm outlineComment-none"
                  onKeyDown={(e) => {}
                  disabled={!commentText.trim() || submittingComment}
                  className="w-9 h-9 flex items-center justify-center bg-primary text-white rounded-full disabled:opacity-40 shrink if (e.key === "Enter") handleSubmitComment(); }}
                />
                <button
                  onClick={handleSubmit-0"
                >
                  <span className="material-sComment}
                  disabled={!commentText.trim() || submittingComment}
                  className="text-primary disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-[18px]">send</spanymbols-outlined text-[18px]">send</span>
                </button>
              </div>
            </div>
          )}
       >
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮 </div>

        {/* 操作 */}
        <div className="mt-6">
          {join按钮 */}
        <div className="mt-6">
          {joinStatus === "none" && (
            <button onClick={handleJoin} classNameStatus === "none="w-full py-4 bg-primary text-white font-label" && (
            <button onClick={handleJoin} className-md rounded-full shadow-lg active:scale-95 transition-transform">
              {event.isPublic ? "报名参加="w-full py-4 bg-primary text-white font-label" : "申请参加"}
            </button>
          )}
          {joinStatus === "applied" && (
            <button className="w-full py-4 bg-secondary/20 text-secondary font-label-md rounded-full" disabled>
              等待确认中...
            </button>
          )}
          {joinStatus === "registered" && !isOrganizer-md rounded-full shadow-lg active:scale-95 transition-transform">
              {event.isPublic ? "报名参加" : "申请参加"}
            </button>
          )}
          {joinStatus === "applied" && (
            <button className="w-full py-4 bg-secondary/20 text-secondary font-label-md rounded-full" disabled>
              等待确认中...
            </button>
          )}
          {joinStatus === "registered" && && (
            <button className="w-full py-4 bg-primary-container/50 text-primary font-label-md !isOrganizer && (
 rounded-full">
                         <button className="w-full py-4 bg-primary ✅ 已报名 · 查看详情
           -container/50 text-primary font-label-md rounded-full">
              ✅ 已报名 ·  </button>
          )}
          {isOrganizer && (
            <button onClick={handleManage查看详情
            </button>
          )}
          {isEvent} className="w-full py-4 bg-secondary/10 text-secondary font-label-md rounded-full">
             Organizer && (
            <button onClick={handleManageEvent} className="w-full py-4 bg-secondary/10 📋 管理活动 · 查看报名列表
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
