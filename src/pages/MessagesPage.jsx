import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import Avatar from "../components/common/Avatar";

const timeRanges = ["今天", "昨天", "本周", "本月"];



/**
 * 递归评论组件
 * - reply: 当前回复对象（含 children）
 * - postId: 顶层帖子 ID
 * - activeReplyId: 当前展开输入框的回复 ID
 * - replyTextMap: { [key]: string } 输入内容
 */
function CommentThread({ reply, postId, profiles, currentUserId, onAvatarClick, activeReplyId, onToggleReply, replyTextMap, onReplyTextChange, onSend }) {
  const user = profiles[reply.userId] || { name: "用户", avatar: "User" };
  const isInputOpen = activeReplyId === reply.id;
  const inputText = replyTextMap[reply.id] || "";
  const children = reply.children || [];

  return (
    <div className="ml-1">
      <div className="flex items-start gap-2 py-1.5">
        <div onClick={() => onAvatarClick(reply.userId)} className="cursor-pointer shrink-0 mt-0.5">
          <Avatar name={user?.avatar || "User"} size="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold text-on-surface">{user?.name || "用户"}</span>
            <span className="text-[10px] text-on-surface-variant/50">{reply.time}</span>
          </div>
          <p className="text-sm text-on-surface">{reply.text}</p>
          <button
            onClick={() => onToggleReply(postId, reply.id)}
            className="text-[10px] text-primary mt-0.5 hover:opacity-70"
          >
            {isInputOpen ? "取消回复" : "回复"}
          </button>
        </div>
      </div>

      {/* 展开的回复输入框 */}
      {isInputOpen && (
        <div className="ml-8 mb-2 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border border-outline-variant/30">
            <span className="text-[10px] text-primary shrink-0">@{user?.name || "用户"}</span>
            <textarea
              value={inputText}
              onChange={(e) => onReplyTextChange(reply.id, e.target.value)}
              placeholder="写下回复..."
              rows={1}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none placeholder-on-surface-variant/50 resize-none overflow-hidden"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(postId, reply.id); } }}
              autoFocus
            />
            <button onClick={() => onSend(postId, reply.id)} disabled={!inputText.trim()} className="text-primary disabled:opacity-30">
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
        </div>
      )}

      {/* 递归渲染子回复 */}
      {children.length > 0 && (
        <div className="border-l-2 border-surface-variant/20 ml-3 pl-3">
          {children.map((child) => (
            <CommentThread
              key={child.id}
              reply={child}
              postId={postId}
              profiles={profiles}
              currentUserId={currentUserId}
              onAvatarClick={onAvatarClick}
              activeReplyId={activeReplyId}
              onToggleReply={onToggleReply}
              replyTextMap={replyTextMap}
              onReplyTextChange={onReplyTextChange}
              onSend={onSend}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [fabOpen, setFabOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const [newPostIds, setNewPostIds] = useState([]);

  // 回复输入内容: { [replyId]: text }
  const [replyTextMap, setReplyTextMap] = useState({});
  // 当前展开的回复输入框 ID: { postId, replyId }
  const [activeReply, setActiveReply] = useState(null);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [newMessage, setNewMessage] = useState("");
  const [sendingNewMessage, setSendingNewMessage] = useState(false);
  const newMessageInputRef = useRef(null);
  const newMessageBtnRef = useRef(null);

  const [filterDist, setFilterDist] = useState(5000);
  const [filterTime, setFilterTime] = useState("今天");
  const [filterDateValue, setFilterDateValue] = useState("");
  const [activeDist, setActiveDist] = useState(5000);
  const [activeTime, setActiveTime] = useState("今天");
  const [activeDateLabel, setActiveDateLabel] = useState("");

  const prevPostCountRef = useRef(0);

  // 将 fetchPosts 和 fetchProfiles 提升为函数声明（hoisting），以便在 useEffect 中调用
  function fetchProfiles() {
    supabase.from("profiles").select("*").then(({ data }) => {
      if (data) {
        const map = {};
        data.forEach((p) => { map[p.id] = p; });
        setProfiles(map);
      }
    });
  }

  // 加载帖子 + 所有回复，按 parent_id 构建树
  function fetchPosts() {
    supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .then(async ({ data: postsData, error }) => {
        if (error) {
          console.error("获取消息失败:", error);
          return;
        }
        if (!postsData) return;

        const postIds = postsData.map((p) => p.id);
        const { data: allReplies } = await supabase
          .from("post_replies")
          .select("*")
          .in("post_id", postIds)
          .order("created_at", { ascending: true });

        // 按 post_id 分组
        const repliesByPost = {};
        (allReplies || []).forEach((r) => {
          if (!repliesByPost[r.post_id]) repliesByPost[r.post_id] = [];
          repliesByPost[r.post_id].push({
            id: r.id,
            userId: r.user_id,
            text: r.content,
            time: formatRelativeTime(r.created_at),
            created_at: r.created_at,
            parent_id: r.parent_id || null,
            children: [],
          });
        });

        // 构建树
        Object.keys(repliesByPost).forEach((pid) => {
          const list = repliesByPost[pid];
          const map = {};
          list.forEach((r) => { map[r.id] = r; });
          const roots = [];
          list.forEach((r) => {
            if (r.parent_id && map[r.parent_id]) {
              map[r.parent_id].children.push(r);
            } else {
              roots.push(r);
            }
          });
          repliesByPost[pid] = roots;
        });

        const postsWithReplies = postsData.map((p) => ({
          id: p.id,
          userId: p.user_id,
          time: formatRelativeTime(p.created_at),
          message: p.content,
          created_at: p.created_at,
          replies: repliesByPost[p.id] || [],
        }));
        setPosts(postsWithReplies);
      });
  }

  function formatRelativeTime(ts) {
    if (!ts) return "";
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "刚刚";
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}天前`;
    return new Date(ts).toLocaleDateString("zh-CN");
  }

  useEffect(() => {
    fetchPosts();
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (posts.length > prevPostCountRef.current) {
      const newIds = posts.slice(0, posts.length - prevPostCountRef.current).map((p) => p.id);
      setNewPostIds(newIds);
      const timer = setTimeout(() => setNewPostIds([]), 500);
      prevPostCountRef.current = posts.length;
      return () => clearTimeout(timer);
    } else if (posts.length < prevPostCountRef.current) {
      prevPostCountRef.current = posts.length;
    }
  }, [posts]);

  // 监听键盘弹出高度：使用 window.visualViewport 动态计算
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const diff = Math.max(0, window.innerHeight - window.visualViewport.height);
        setKeyboardHeight(diff);
      }
    };
    window.visualViewport?.addEventListener("resize", handleResize);
    handleResize();
    return () => window.visualViewport?.removeEventListener("resize", handleResize);
  }, []);

  const handleAvatarClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleCardClick = (postId) => {
    setExpandedId(expandedId === postId ? null : postId);
    setActiveReply(null);
  };

  // 点击"回复"按钮 — 切换输入框
  const handleToggleReply = (postId, replyId) => {
    if (activeReply && activeReply.postId === postId && activeReply.replyId === replyId) {
      setActiveReply(null);
    } else {
      setActiveReply({ postId, replyId });
    }
  };

  // 发送回复（postId = 顶层帖子ID, parentReplyId = 被回复的那条ID）
  const handleSendReply = async (postId, parentReplyId = null) => {
    const text = (replyTextMap[parentReplyId] || "").trim();
    if (!text) return;
    const { error } = await supabase.from("post_replies").insert({
      post_id: postId,
      content: text,
      user_id: user.id,
      parent_id: parentReplyId, // null 表示直接回复帖子
    });
    if (error) {
      console.error("回复失败:", error);
      toast("回复失败: " + (error.message || "未知错误"), "error");
      return;
    }
    setReplyTextMap((prev) => ({ ...prev, [parentReplyId]: "" }));
    setActiveReply(null);
    fetchPosts();
    toast("回复成功", "success");
  };

  const applyFilter = () => {
    setActiveDist(filterDist);
    if (filterTime === "自定义" && filterDateValue) {
      const d = new Date(filterDateValue + "T00:00:00");
      const label = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
      setActiveTime(filterDateValue);
      setActiveDateLabel(label);
    } else {
      setActiveTime(filterTime);
      setActiveDateLabel("");
    }
    setFilterOpen(false);
  };

  const profileForPost = (p) => profiles[p.userId] || { name: "用户", avatar: "User" };
  const filteredPosts = posts;

  // 计算树形总回复数
  const countAll = (list) => {
    let n = 0;
    const walk = (arr) => { arr.forEach((r) => { n++; walk(r.children || []); }); };
    walk(list);
    return n;
  };

  // 新增：发送新消息到 posts 表
  const handleSendNewMessage = async () => {
    if (!newMessage.trim() || sendingNewMessage) return;
    setSendingNewMessage(true);
    const { error } = await supabase.from("posts").insert({
      content: newMessage.trim(),
      user_id: user.id,
    });
    setSendingNewMessage(false);
    if (error) {
      console.error("发送消息失败:", error);
      toast("发送失败", "error");
      return;
    }
    setNewMessage("");
    await fetchPosts();
    await fetchProfiles();
    toast("发送成功", "success");
  };

  // 新增：输入框聚焦时滚动到可视区域，防止键盘遮挡
  const handleNewMessageFocus = () => {
    setTimeout(() => {
      if (newMessageInputRef.current) {
        newMessageInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 300);
  };

  const safeBottom = keyboardHeight > 20 ? keyboardHeight : 0;

  return (
    <div className="h-full flex flex-col">
      {/* 消息流 */}
      <div className="flex-1 overflow-y-auto px-margin-mobile pb-2">
        <div className="flex justify-between items-center pt-2 pb-3">
          <div className="font-label-md text-on-surface-variant text-label-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-container" />
            {activeDist >= 1000 ? `${(activeDist / 1000).toFixed(1)}km` : `${activeDist}m`} · {activeDateLabel || activeTime}
          </div>
          <button onClick={() => setFilterOpen(true)} className="text-primary hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>tune</span>
          </button>
        </div>

        <div className="flex flex-col gap-gutter">
          {filteredPosts.map((post) => {
            const usr = profileForPost(post);
            const isExpanded = expandedId === post.id;
            const isNew = newPostIds.includes(post.id);
            const total = countAll(post.replies);
            const postReplyText = replyTextMap["post-" + post.id] || "";

            return (
              <div key={post.id} className={`bg-white/80 backdrop-blur-xl rounded-lg shadow-sm overflow-hidden ${isNew ? "animate-arc-in" : ""}`}>
                {/* 帖子本身 */}
                <div onClick={() => handleCardClick(post.id)} className="p-4 cursor-pointer active:scale-[0.98] transition-transform" style={{ borderLeft: `4px solid ${post.color || "#356668"}` }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div onClick={(e) => { e.stopPropagation(); handleAvatarClick(post.userId); }} className="cursor-pointer shrink-0">
                      <Avatar name={usr?.avatar || "User"} size="w-10 h-10" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className="font-label-md text-label-md font-bold truncate">{usr?.name || "用户"}</h4>
                        <span className="font-label-sm text-label-sm text-on-surface-variant/60 shrink-0 ml-2">{post.time}</span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant/50">{total} 条回复</span>
                    </div>
                  </div>
                  <p className="font-body-md text-body-md">{post.message}</p>
                </div>

                {isExpanded && (
                  <div className="border-t border-surface-variant/20 bg-surface-container-low/30 px-4 py-3">
                    {/* 回复树 */}
                    {post.replies.length > 0 && (
                      <div className="mb-3">
                        <p className="text-[11px] text-on-surface-variant/50 font-semibold uppercase tracking-wider mb-2">回复（{total}）</p>
                        {post.replies.map((reply) => (
                          <CommentThread
                            key={reply.id}
                            reply={reply}
                            postId={post.id}
                            profiles={profiles}
                            currentUserId={user?.id}
                            onAvatarClick={handleAvatarClick}
                            activeReplyId={activeReply?.replyId || null}
                            onToggleReply={handleToggleReply}
                            replyTextMap={replyTextMap}
                            onReplyTextChange={(id, val) => setReplyTextMap((prev) => ({ ...prev, [id]: val }))}
                            onSend={handleSendReply}
                          />
                        ))}
                      </div>
                    )}

                    {/* 直接回复帖子的输入框 */}
                    <div className="flex items-center gap-2">
                      <Avatar name={profiles[user?.id]?.avatar || "User"} size="w-6 h-6" />
                      <div className="flex-1 flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border border-outline-variant/30">
                        <textarea
                          value={postReplyText}
                          onChange={(e) => setReplyTextMap((prev) => ({ ...prev, ["post-" + post.id]: e.target.value }))}
                          placeholder="写下你的公开回复..."
                          rows={1}
                          className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none placeholder-on-surface-variant/50 resize-none overflow-hidden"
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(post.id, null); } }}
                        />
                        <button onClick={() => handleSendReply(post.id, null)} disabled={!postReplyText.trim()} className="text-primary disabled:opacity-30">
                          <span className="material-symbols-outlined text-[18px]">send</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filteredPosts.length === 0 && (
            <p className="text-sm text-on-surface-variant text-center py-12">当前筛选条件下没有消息</p>
          )}
        </div>
        <div className="h-28" />
      </div>

      {/* 底部输入框 + 发送按钮（fixed 定位在 BottomNav 上方，紧挨底部导航栏） */}
      <div className="fixed bottom-[80px] left-0 right-0 z-[60] bg-white border-t border-surface-variant/20 flex items-center gap-2 px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: keyboardHeight > 20 ? `calc(0.75rem + ${keyboardHeight}px)` : "0.75rem" }}>
        <input
          ref={newMessageInputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="输入新消息..."
          autoComplete="off"
          className="flex-1 bg-surface-container-low rounded-full px-4 py-2.5 text-sm outline-none border-none"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSendNewMessage(); } }}
          onFocus={handleNewMessageFocus}
          onTouchStart={() => {
            if (newMessageInputRef.current && document.activeElement !== newMessageInputRef.current) {
              newMessageInputRef.current.focus();
            }
          }}
          onClick={() => {
            if (newMessageInputRef.current) {
              newMessageInputRef.current.focus();
              if (newMessageInputRef.current.setSelectionRange) {
                newMessageInputRef.current.setSelectionRange(
                  newMessageInputRef.current.value.length,
                  newMessageInputRef.current.value.length
                );
              }
            }
          }}
        />
        <button
          ref={newMessageBtnRef}
          onClick={handleSendNewMessage}
          disabled={!newMessage.trim() || sendingNewMessage}
          className="w-9 h-9 flex items-center justify-center bg-[#95490d] text-white rounded-full disabled:opacity-40 shrink-0 transition-all active:scale-90"
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
        </button>
      </div>

      {/* 底部占位，防止内容被 BottomNav 遮挡 */}
      <div className="shrink-0 h-20" />

      <button onClick={() => setFabOpen(true)}
        className="fixed right-4 z-30 w-14 h-14 bg-primary text-white rounded-full shadow-[0_8px_24px_rgba(149,73,13,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        style={{ bottom: safeBottom > 20 ? safeBottom + 16 : 152 }}>
        <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
      </button>

      {filterOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setFilterOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 px-6 pt-4 pb-24 shadow-xl">
            <div className="w-10 h-1 bg-surface-variant rounded-full mx-auto mb-4" />
            <h3 className="font-label-md text-label-md text-center mb-6 text-on-surface">筛选</h3>
            <div className="mb-6">
              <p className="font-label-sm text-label-sm text-on-surface mb-3">距离</p>
              <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3 border border-outline-variant/30">
                <input type="range" min={0} max={5000} step={1} value={filterDist} onChange={(e) => setFilterDist(Number(e.target.value))} className="flex-1 accent-primary h-1.5 w-full" />
                <div className="flex items-center gap-1 shrink-0">
                  <input type="number" min={0} max={5000} value={filterDist} onChange={(e) => setFilterDist(Number(e.target.value))} className="w-16 text-center text-sm text-on-surface bg-white rounded-lg border border-outline-variant/30 py-1.5 outline-none" />
                  <span className="text-xs text-on-surface-variant">m</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-on-surface-variant/60 mt-1"><span>0m</span><span>5km</span></div>
            </div>
            <div className="mb-8">
              <p className="font-label-sm text-label-sm text-on-surface mb-3">时间</p>
              <div className="flex gap-2 flex-wrap">
                {timeRanges.map((t) => (
                  <button key={t} onClick={() => { setFilterTime(t); setFilterDateValue(""); }}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${filterTime === t ? "bg-primary text-white shadow-md" : "bg-surface-container-low text-on-surface-variant border border-outline-variant/30"}`}>{t}</button>
                ))}
                <button onClick={() => setFilterTime("自定义")}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${filterTime === "自定义" ? "bg-primary text-white shadow-md" : "bg-surface-container-low text-on-surface-variant border border-outline-variant/30"}`}>自定义日期</button>
              </div>
              {filterTime === "自定义" && (
                <div className="mt-3 bg-surface-container-low rounded-xl px-4 py-3 border border-outline-variant/30">
                  <input type="date" value={filterDateValue} onChange={(e) => setFilterDateValue(e.target.value)} className="w-full bg-transparent text-sm text-on-surface outline-none" />
                </div>
              )}
            </div>
            <button onClick={applyFilter} className="w-full py-3.5 bg-primary text-white font-label-md text-label-md rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-transform">确认</button>
          </div>
        </>
      )}

      {fabOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setFabOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 px-6 pt-4 pb-24 shadow-xl">
            <div className="w-10 h-1 bg-surface-variant rounded-full mx-auto mb-4" />
            <h3 className="font-label-md text-label-md text-center mb-4 text-on-surface">发布</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setFabOpen(false); navigate("/new-post"); }} className="flex items-center gap-4 px-4 py-4 bg-surface-container-low/50 rounded-xl text-left active:scale-[0.98] transition-transform">
                <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-[20px]">💬</span>
                <div><p className="font-label-md text-label-md text-on-surface">发帖</p><p className="text-xs text-on-surface-variant">分享动态到消息流</p></div>
              </button>
              <button onClick={() => { setFabOpen(false); navigate("/publish-event"); }} className="flex items-center gap-4 px-4 py-4 bg-surface-container-low/50 rounded-xl text-left active:scale-[0.98] transition-transform">
                <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-[20px]">📅</span>
                <div><p className="font-label-md text-label-md text-on-surface">发布活动</p><p className="text-xs text-on-surface-variant">创建一场线下活动</p></div>
              </button>
              <button onClick={() => { setFabOpen(false); navigate("/publish-work"); }} className="flex items-center gap-4 px-4 py-4 bg-surface-container-low/50 rounded-xl text-left active:scale-[0.98] transition-transform">
                <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-[20px]">🔖</span>
                <div><p className="font-label-md text-label-md text-on-surface">发布作品</p><p className="text-xs text-on-surface-variant">展示你的创作</p></div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
