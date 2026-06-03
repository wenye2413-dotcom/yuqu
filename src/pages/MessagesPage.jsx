import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { useLocation, calcDistance, formatDistance } from "../hooks/useLocation";
import Avatar from "../components/common/Avatar";

const timeRanges = ["今天", "昨天", "本周", "本月"];
const RADII = [50, 100, 200, 500, 1000, 2000, 5000]

/**
 * 递归评论组件（纯展示，回复走底部统一输入框）
 */
function CommentThread({ reply, postId, profiles, currentUserId, onAvatarClick, onReply }) {
  const user = profiles[reply.userId] || { name: "用户", avatar: "User" };
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
            onClick={() => onReply(reply)}
            className="text-[10px] text-primary mt-0.5 hover:opacity-70"
          >
            回复
          </button>
        </div>
      </div>

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
              onReply={onReply}
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

  // 统一回复状态: { postId, replyId (null=直接回复帖子), userName }
  const [replyingTo, setReplyingTo] = useState(null);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [newMessage, setNewMessage] = useState("");
  const [sendingNewMessage, setSendingNewMessage] = useState(false);
  const newMessageInputRef = useRef(null);
  const newMessageBtnRef = useRef(null);

  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [showEmoji, setShowEmoji] = useState(false);
  const scrollRef = useRef(null);
  const pullStartY = useRef(0);
  const isPulling = useRef(false);

  const emojis = ['😀','😊','😂','🤣','❤️','🔥','👍','😍','🥰','😎','🙏','💪','😅','🤔','😭','😘','🥺','😤','🤩','✨','🎉','💯','😈','👏','😏','🙄','😴','🤗','😱','🤯']

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchPosts(), fetchProfiles()])
    setRefreshing(false)
    setPullDistance(0)
    toast("已刷新", "success")
  }

  // 下拉刷新
  const handleTouchStart = (e) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      pullStartY.current = e.touches[0].clientY
      isPulling.current = true
    }
  }

  const handleTouchMove = (e) => {
    if (!isPulling.current) return
    const diff = e.touches[0].clientY - pullStartY.current
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 80))
      if (diff > 100) {
        // 触及刷新阈值 — 立即触发
        isPulling.current = false
        setPullDistance(0)
        handleRefresh()
      }
    }
  }

  const handleTouchEnd = () => {
    if (isPulling.current) {
      if (pullDistance > 50) {
        handleRefresh()
      } else {
        setPullDistance(0)
      }
      isPulling.current = false
    }
  }

  const insertEmoji = (emoji) => {
    setNewMessage((prev) => prev + emoji)
    setShowEmoji(false)
  }

  const [filterDist, setFilterDist] = useState(5000);
  const [filterTime, setFilterTime] = useState("今天");
  const [filterDateValue, setFilterDateValue] = useState("");
  const [activeDist, setActiveDist] = useState(5000);
  const [activeTime, setActiveTime] = useState("今天");
  const [activeDateLabel, setActiveDateLabel] = useState("");

  // 位置相关
  const { location, loading: locLoading, error: locError, permissionDenied, requestLocation } = useLocation()
  const [radius, setRadius] = useState(100)        // 默认100米
  const [showRadiusPicker, setShowRadiusPicker] = useState(false)

  const prevPostCountRef = useRef(0);

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

        const postsWithReplies = postsData.map((p) => {
          const d = (p.latitude && p.longitude && location)
            ? calcDistance(location.lat, location.lng, p.latitude, p.longitude)
            : null
          return {
            id: p.id,
            userId: p.user_id,
            time: formatRelativeTime(p.created_at),
            message: p.content,
            created_at: p.created_at,
            latitude: p.latitude,
            longitude: p.longitude,
            distance: d,
            replies: repliesByPost[p.id] || [],
          }
        });
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
  }, [location]); // location 变化时重新拉取

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
  };

  // 点击"回复" — 设置到底部统一输入框
  const handleReply = (postId, reply) => {
    const userName = reply
      ? (profiles[reply.userId]?.name || "用户")
      : (profiles[posts.find(p => p.id === postId)?.userId]?.name || "用户");
    setReplyingTo({ postId, replyId: reply ? reply.id : null, userName });
    setExpandedId(postId);
    // 聚焦到底部输入框
    setTimeout(() => newMessageInputRef.current?.focus(), 100);
  };

  // 取消回复
  const cancelReply = () => {
    setReplyingTo(null);
  };

  // 统一发送：有 replyingTo 就走回复，否则走新帖
  const handleSendNewMessage = async () => {
    if (!newMessage.trim() || sendingNewMessage) return;

    if (replyingTo) {
      // 发送回复
      setSendingNewMessage(true);
      const { error } = await supabase.from("post_replies").insert({
        post_id: replyingTo.postId,
        content: newMessage.trim(),
        user_id: user.id,
        parent_id: replyingTo.replyId, // null=直接回复帖子，非null=嵌套回复
      });
      setSendingNewMessage(false);
      if (error) {
        console.error("回复失败:", error);
        toast("回复失败: " + (error.message || "未知错误"), "error");
        return;
      }
      setNewMessage("");
      setReplyingTo(null);
      await fetchPosts();
      toast("回复成功", "success");
    } else {
      // 发送新帖（带位置）
      setSendingNewMessage(true);
      const postData = {
        content: newMessage.trim(),
        user_id: user.id,
      }
      if (location) {
        postData.latitude = location.lat
        postData.longitude = location.lng
      }
      const { error } = await supabase.from("posts").insert(postData);
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
    }
  };

  const handleNewMessageFocus = () => {
    setTimeout(() => {
      if (newMessageInputRef.current) {
        newMessageInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 300);
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

  // 时间过滤
  const isInTimeRange = (createdAt) => {
    if (!createdAt) return true
    const now = new Date()
    const d = new Date(createdAt)
    switch (activeTime) {
      case "今天":
        return d.toDateString() === now.toDateString()
      case "昨天":
        const y = new Date(now)
        y.setDate(y.getDate() - 1)
        return d.toDateString() === y.toDateString()
      case "本周":
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        return d >= weekStart
      case "本月":
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      default:
        // 自定义日期
        if (activeDateLabel) {
          return d.toDateString() === new Date(activeTime + "T00:00:00").toDateString()
        }
        return true
    }
  }

  const filteredPosts = posts.filter((p) => {
    if (!isInTimeRange(p.created_at)) return false
    // 有位置数据时按半径过滤，没位置数据时显示
    if (location && p.distance !== null) {
      return p.distance <= radius
    }
    return true
  })

  const countAll = (list) => {
    let n = 0;
    const walk = (arr) => { arr.forEach((r) => { n++; walk(r.children || []); }); };
    walk(list);
    return n;
  };

  const safeBottom = keyboardHeight > 20 ? keyboardHeight : 0;

  return (
    <div className="h-full flex flex-col">
      {/* 消息流 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-margin-mobile pb-2 overscroll-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 下拉刷新指示器 */}
        {pullDistance > 0 && (
          <div className="flex items-center justify-center py-2 transition-all" style={{ height: pullDistance, opacity: Math.min(pullDistance / 50, 1) }}>
            <span className={`material-symbols-outlined text-primary ${pullDistance > 50 ? '' : 'animate-spin'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
              {pullDistance > 50 ? 'arrow_downward' : 'refresh'}
            </span>
            <span className="text-xs text-primary ml-2">{pullDistance > 50 ? '释放刷新' : '下拉刷新'}</span>
          </div>
        )}
        {/* 加载中指示器 */}
        {refreshing && (
          <div className="flex items-center justify-center py-3">
            <span className="material-symbols-outlined text-primary animate-spin text-[18px]">refresh</span>
            <span className="text-xs text-primary ml-2">刷新中...</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-2 pb-3">
          <div className="flex items-center gap-2">
            {/* 当前半径 — 可点击切换 */}
            <button onClick={() => setShowRadiusPicker(!showRadiusPicker)}
              className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
              <span className="material-symbols-outlined text-[14px]">my_location</span>
              {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}
            </button>
            {/* 时间筛选 */}
            <span className="text-xs text-on-surface-variant/60">{activeDateLabel || activeTime}</span>
          </div>
          <div className="flex items-center gap-1">
            {/* 定位状态 */}
            {locLoading && <span className="material-symbols-outlined text-on-surface-variant/40 text-[16px] animate-spin">location_searching</span>}
            {permissionDenied && (
              <button onClick={requestLocation} className="text-xs text-red-400" title="定位被拒绝，点击重试">
                <span className="material-symbols-outlined text-[16px]">location_off</span>
              </button>
            )}
            <button onClick={handleRefresh} disabled={refreshing} className="text-primary hover:opacity-80 transition-opacity p-1">
              <span className={`material-symbols-outlined text-[20px] ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
            </button>
            <button onClick={() => setFilterOpen(true)} className="text-primary hover:opacity-80 transition-opacity p-1">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>tune</span>
            </button>
          </div>
        </div>

        {/* 半径选择器 */}
        {showRadiusPicker && (
          <div className="flex gap-1.5 pb-3 flex-wrap">
            {RADII.map((r) => (
              <button key={r} onClick={() => { setRadius(r); setShowRadiusPicker(false) }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${r === radius ? 'bg-primary text-white shadow-sm' : 'bg-surface-container-low text-on-surface-variant'}`}>
                {r >= 1000 ? `${r / 1000}km` : `${r}m`}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-gutter">
          {filteredPosts.map((post) => {
            const usr = profileForPost(post);
            const isExpanded = expandedId === post.id;
            const isNew = newPostIds.includes(post.id);
            const total = countAll(post.replies);

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
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-on-surface-variant/50">{total} 条回复</span>
                        {post.distance !== null && (
                          <span className="text-[10px] text-primary/60">{formatDistance(post.distance)}</span>
                        )}
                      </div>
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
                            onReply={(r) => handleReply(post.id, r)}
                          />
                        ))}
                      </div>
                    )}

                    {/* 回复帖子的入口 */}
                    <button
                      onClick={() => handleReply(post.id, null)}
                      className="text-xs text-primary/70 hover:opacity-70 mt-1"
                    >
                      {post.replies.length === 0 ? "写下第一条回复..." : "回复帖子"}
                    </button>
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

      {/* 底部统一输入框 */}
      <div className="fixed bottom-[80px] left-0 right-0 z-[60] bg-white border-t border-surface-variant/20 px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: keyboardHeight > 20 ? `calc(0.75rem + ${keyboardHeight}px)` : "0.75rem" }}>
        <div className="flex items-center gap-2">
          {/* 回复上下文提示 */}
          {replyingTo && (
            <div className="flex items-center gap-1 shrink-0 max-w-[120px]">
              <span className="text-[10px] text-on-surface-variant/60 bg-surface-container-low px-2 py-1 rounded-full truncate">
                回复 @{replyingTo.userName}
              </span>
              <button onClick={cancelReply} className="text-on-surface-variant/40 hover:text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          )}
          <button onClick={() => setShowEmoji(!showEmoji)} className="text-on-surface-variant/60 hover:text-on-surface-variant shrink-0 w-8 h-8 flex items-center justify-center">
            <span className="text-lg">😊</span>
          </button>
          <input
            ref={newMessageInputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={replyingTo ? `回复 @${replyingTo.userName}...` : "输入新消息..."}
            autoComplete="off"
            className="flex-1 bg-surface-container-low rounded-full px-4 py-2.5 text-sm outline-none border-none"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSendNewMessage(); } }}
            onFocus={handleNewMessageFocus}
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
        {/* 表情选择器 */}
        {showEmoji && (
          <div className="flex flex-wrap gap-1.5 pt-2 pb-1 border-t border-surface-variant/20 mt-2 max-h-28 overflow-y-auto">
            {emojis.map((emoji) => (
              <button key={emoji} onClick={() => insertEmoji(emoji)} className="text-xl hover:bg-surface-container-low rounded-lg px-1 py-0.5 active:scale-110 transition-transform">
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 h-20" />

      <button onClick={() => setFabOpen(true)}
        className="fixed right-4 z-[70] w-14 h-14 bg-primary text-white rounded-full shadow-[0_8px_24px_rgba(149,73,13,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        style={{ bottom: safeBottom > 20 ? safeBottom + 16 : 152 }}>
        <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
      </button>

      {filterOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={applyFilter} />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 px-6 pt-4 pb-12 shadow-xl">
            <div className="w-10 h-1 bg-surface-variant rounded-full mx-auto mb-4" />
            <h3 className="font-label-md text-label-md text-center mb-6 text-on-surface">时间筛选</h3>
            <div className="mb-6">
              <p className="font-label-sm text-label-sm text-on-surface mb-3">显示时间范围</p>
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
