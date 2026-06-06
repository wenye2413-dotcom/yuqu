import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation as useRouterLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { useLocation, calcDistance, formatDistance } from "../hooks/useLocation";
import Avatar from "../components/common/Avatar";

const timeRanges = ["今天", "昨天", "本周", "本月"];
const MIN_RADIUS = 0      // 最小 0 米
const MAX_RADIUS = 40000   // 最大 40 公里（覆盖不限距离场景）

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
          <Avatar name={reply.userId || "User"} src={profiles[reply.userId]?.avatar_url} size="w-6 h-6" />
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
  const routerLocation = useRouterLocation();
  const [searchParams] = useSearchParams();
  const focusPostId = searchParams.get('post');
  const toast = useToast();
  const { user, profile: authProfile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [viewLocation, setViewLocation] = useState(null);

  // 从 URL 参数读取时间筛选（来自侧边栏）
  useEffect(() => {
    const timeParam = searchParams.get('time')
    setActiveTime(timeParam || '')
    setFilterDateValue('')
    setActiveDateLabel('')
  }, [searchParams])
  const [showLocPicker, setShowLocPicker] = useState(false);
  const [locSearch, setLocSearch] = useState("");

  const [newPostIds, setNewPostIds] = useState([]);

  // 统一回复状态: { postId, replyId (null=直接回复帖子), userName }
  const [replyingTo, setReplyingTo] = useState(null);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [newMessage, setNewMessage] = useState("");
  const [sendingNewMessage, setSendingNewMessage] = useState(false);
  const newMessageInputRef = useRef(null);
  const newMessageBtnRef = useRef(null);

  const [refreshing, setRefreshing] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);
  const scrollRef = useRef(null);
  const emojiList = [
    ['😀','😊','😂','🤣','😅','😭','😍','🥰','😘','😙'],
    ['❤️','🔥','💯','✨','🎉','💪','🙏','👍','👏','🤝'],
    ['😎','🤩','😈','🤗','😏','🙄','😴','🤔','🥺','😤'],
    ['🐶','🐱','🐼','🐨','🦊','🐰','🦄','🐸','🐲','🌟'],
    ['🍕','🍔','🌮','🍣','🍜','🍰','☕','🍺','🎂','🍩'],
    ['⚽','🏀','🎮','🎵','🎸','🎤','🏆','📸','🎨','🚀'],
  ]

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchPosts(), fetchProfiles()])
    setRefreshing(false)
    toast("已刷新", "success")
  }

  const insertEmoji = (emoji) => {
    setNewMessage((prev) => prev + emoji)
    setShowEmoji(false)
  }

  const [filterDist, setFilterDist] = useState(5000);
  const [filterTime, setFilterTime] = useState("");
  const [filterDateValue, setFilterDateValue] = useState("");
  const [activeDist, setActiveDist] = useState(5000);
  const [activeTime, setActiveTime] = useState("");
  const [activeDateLabel, setActiveDateLabel] = useState("");

  // 位置相关 — GPS定位 + 查看位置
  const { location, accuracy, loading: locLoading, error: locError, permissionDenied, requestLocation } = useLocation()
  // GPS定位成功后默认查看位置=GPS位置
  useEffect(() => {
    if (location && !viewLocation) {
      setViewLocation(location)
    }
  }, [location])
  const [radius, setRadius] = useState(100)        // 默认100米
  const [showRadiusPicker, setShowRadiusPicker] = useState(false)

  const prevPostCountRef = useRef(0);

  function fetchProfiles() {
    // 合并当前用户的 profile（含头像）到 profiles 映射
    const currentProfile = authProfile ? { [user?.id]: authProfile } : {};
    supabase.from("profiles").select("*").then(({ data }) => {
      const map = { ...currentProfile };
      if (data) {
        data.forEach((p) => { map[p.id] = p; });
      }
      setProfiles(map);
    });
  }

  // 加载帖子 + 所有回复，按 parent_id 构建树
  function fetchPosts() {
    supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: true })
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
          const d = (p.latitude && p.longitude && viewLocation)
            ? calcDistance(viewLocation.lat, viewLocation.lng, p.latitude, p.longitude)
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
        // 检查是否有通知跳转指定的帖子
        if (focusPostId && postsWithReplies.find(p => p.id === focusPostId)) {
          setExpandedId(focusPostId)
        }
        // 仅在用户已在底部时自动滚动到最新消息
        setTimeout(() => {
          const el = scrollRef.current
          if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
            el.scrollTop = el.scrollHeight
          }
        }, 100)
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
  }, [location, routerLocation]); // GPS 或路由变化时重新拉取

  // 用 ref 解决闭包失效问题，让轮询和订阅始终拿到最新的 fetchPosts
  const fetchPostsRef = useRef(fetchPosts)
  const fetchProfilesRef = useRef(fetchProfiles)
  fetchPostsRef.current = fetchPosts
  fetchProfilesRef.current = fetchProfiles

  // 实时订阅 + 轮询
  useEffect(() => {
    const doFetch = () => { fetchPostsRef.current(); fetchProfilesRef.current() }
    const doFetchPosts = () => fetchPostsRef.current()

    const channel = supabase
      .channel('posts-live')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        doFetch
      )
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') console.log('[Realtime] 状态:', status)
      })

    const pollTimer = setInterval(() => {
      console.log('[轮询] 自动刷新消息')
      doFetchPosts()
    }, 10000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollTimer)
    }
  }, [])

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
    if (userId === user?.id) {
      navigate(`/profile`)
    } else {
      navigate(`/profile/${userId}`)
    }
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
      setActiveTime(filterDateValue);
      setActiveDateLabel(`${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`);
    } else {
      setActiveTime(filterTime);
      setActiveDateLabel("");
    }
    setFilterOpen(false);
    // 同步到 URL 参数供侧边栏读取
    const params = new URLSearchParams(window.location.search)
    if (filterTime) {
      params.set('time', filterTime)
      if (filterTime === '自定义' && filterDateValue) params.set('date', filterDateValue)
    } else {
      params.delete('time')
      params.delete('date')
    }
    navigate(`?${params.toString()}`, { replace: true })
  };

  const profileForPost = (p) => profiles[p.userId] || { name: "用户", avatar: p.userId };

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
    // 有位置数据时按查看位置半径过滤
    if (viewLocation && p.distance !== null) {
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
    <div className="flex flex-col" style={{ height: '100dvh' }}>
      {/* 固定顶部：经纬度 + 半径 + 时间 + 刷新 */}
      <div className="shrink-0 px-margin-mobile pt-2 pb-1 bg-background border-b border-[#f0edea]/50">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <button onClick={() => setShowLocPicker(true)}
              className="w-full text-left flex items-center gap-1.5 px-3 py-2 bg-primary/5 text-primary rounded-full text-[12px] font-medium border border-primary/10">
              <span className="material-symbols-outlined text-[14px] shrink-0">📍</span>
              <span className="font-mono">{viewLocation ? `${viewLocation.lat.toFixed(6)}, ${viewLocation.lng.toFixed(6)}` : '定位中...'}</span>
            </button>
          </div>
          <button onClick={() => setShowRadiusPicker(!showRadiusPicker)}
            className="shrink-0 flex items-center gap-1 px-3 py-2 bg-primary/10 text-primary rounded-full text-[12px] font-medium">
            <span className="material-symbols-outlined text-[12px]">radio_button_checked</span>
            {radius >= MAX_RADIUS ? '不限' : radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}
          </button>
          <button onClick={() => setFilterOpen(true)} className="shrink-0 text-[10px] text-on-surface-variant/50 hover:text-primary px-1.5 py-1 rounded">
            {activeTime || '不限'}
          </button>
          <button onClick={handleRefresh} disabled={refreshing} className="shrink-0 text-on-surface-variant/60 hover:text-primary transition-colors p-1">
            <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
          </button>
        </div>
        {viewLocation && location && (
          <p className="text-[10px] text-on-surface-variant/40 px-1">
            距你 {formatDistance(calcDistance(viewLocation.lat, viewLocation.lng, location.lat, location.lng))}
            {accuracy && accuracy > 500 && ` · 精度±${Math.round(accuracy)}m`}
          </p>
        )}
      </div>

      {/* 消息流 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-margin-mobile pb-2 overscroll-none">
        {/* 加载中指示器 */}
        {refreshing && (
          <div className="flex items-center justify-center py-3">
            <span className="material-symbols-outlined text-primary animate-spin text-[18px]">refresh</span>
            <span className="text-xs text-primary ml-2">刷新中...</span>
          </div>
        )}

        {/* 地点搜索框 */}
        {showLocPicker && (
          <div className="mb-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 relative">
            <button onClick={() => setShowLocPicker(false)} className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full shadow-sm flex items-center justify-center text-on-surface-variant/50">
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
            <div className="flex gap-2 mb-2">
              <input type="text" value={locSearch} onChange={e => setLocSearch(e.target.value)}
                placeholder="搜索地点或输入坐标"
                className="flex-1 bg-white rounded-lg px-3 py-2.5 text-xs outline-none border border-outline-variant/30"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && locSearch.trim()) {
                    // 尝试解析坐标
                    const coord = locSearch.match(/(-?\d+\.?\d*)\s*[,，]\s*(-?\d+\.?\d*)/)
                    if (coord) {
                      setViewLocation({ lat: parseFloat(coord[1]), lng: parseFloat(coord[2]) })
                      setShowLocPicker(false)
                      return
                    }
                    // 调用 Nominatim API 搜索
                    try {
                      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locSearch)}&limit=5`)
                      const data = await r.json()
                      if (data?.[0]) {
                        setViewLocation({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) })
                        setShowLocPicker(false)
                      }
                    } catch {}
                  }
                }} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { if (location) { setViewLocation(location) }; setShowLocPicker(false) }}
                className="text-xs text-primary/70">回到我的位置</button>
              <span className="text-xs text-on-surface-variant/30">|</span>
              <button onClick={() => requestLocation()} className="text-xs text-primary/70">刷新定位</button>
              <span className="text-xs text-on-surface-variant/30">|</span>
              <button onClick={() => { const c = prompt('输入经纬度（格式: lat, lng）:'); if (c) { const m = c.match(/(-?\d+\.?\d*)\s*[,，]\s*(-?\d+\.?\d*)/); if (m) { setViewLocation({ lat: parseFloat(m[1]), lng: parseFloat(m[2]) }); setShowLocPicker(false) } } }}
                className="text-xs text-primary/70">输入坐标</button>
            </div>
          </div>
        )}

        {/* 半径滑块 */}
        {showRadiusPicker && (
          <div className="pb-3">
            <div className="bg-surface-container-low rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[18px]">my_location</span>
                <input type="range" min={MIN_RADIUS} max={MAX_RADIUS} step={1} value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  className="flex-1 accent-primary h-1.5" />
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <input type="number" min={MIN_RADIUS} max={MAX_RADIUS} value={radius}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (v >= MIN_RADIUS && v <= MAX_RADIUS) setRadius(v)
                  }}
                  className="w-20 text-center text-sm bg-white rounded-lg border border-outline-variant/30 py-1.5 outline-none" />
                <span className="text-xs text-on-surface-variant">米</span>
                <span className="text-xs text-on-surface-variant/50 mx-2">|</span>
                <span className="text-xs font-semibold text-primary">
                  {radius >= MAX_RADIUS ? '不限' : radius >= 1000 ? `${(radius / 1000).toFixed(2)}km` : `${radius}m`}
                </span>
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-on-surface-variant/50 px-1 mt-1">
              <span>0</span><span>100m</span><span>1km</span><span>5km</span><span>不限</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-gutter">
          {filteredPosts.map((post) => {
            const usr = profileForPost(post);
            const isExpanded = expandedId === post.id;
            const isNew = newPostIds.includes(post.id);
            const total = countAll(post.replies);

            return (
              <div key={post.id} className="card overflow-hidden">
                {/* 帖子本身 */}
                <div className="p-4" style={{ borderLeft: `4px solid ${post.color || "#356668"}` }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div onClick={(e) => { e.stopPropagation(); handleAvatarClick(post.userId); }} className="cursor-pointer shrink-0">
                      <Avatar name={post.userId || "User"} src={post.userId === user?.id ? authProfile?.avatar_url : profiles[post.userId]?.avatar_url} size="w-10 h-10" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div onClick={(e) => { e.stopPropagation(); handleAvatarClick(post.userId); }} className="flex justify-between items-baseline cursor-pointer">
                        <h4 className="font-semibold text-sm text-on-surface truncate hover:text-primary transition-colors">{usr?.name || "用户"}</h4>
                        <span className="text-xs text-on-surface-variant/60 shrink-0 ml-2">{post.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-on-surface-variant/50">{total} 条回复</span>
                        {post.distance !== null && post.latitude && post.longitude && (
                          <button onClick={(e) => { e.stopPropagation(); setViewLocation({ lat: post.latitude, lng: post.longitude }); setLocInputLat(post.latitude.toFixed(6)); setLocInputLng(post.longitude.toFixed(6)) }}
                            className="text-xs text-primary/60 hover:text-primary active:scale-95 transition-all">
                            {formatDistance(post.distance)} 📍
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* 消息内容 — 点击直接回复 */}
                  <div onClick={() => handleReply(post.id, null)} className="cursor-pointer active:scale-[0.98] transition-transform">
                    {post.message?.startsWith('![](') ? (
                      <img src={post.message.match(/!\[.*?\]\((.*?)\)/)?.[1]} alt=""
                        className="w-full max-h-64 object-cover rounded-xl mt-1"
                        onError={(e) => { e.target.style.display = 'none' }} />
                    ) : (
                      <p className="text-sm text-on-surface leading-relaxed">{post.message}</p>
                    )}
                  </div>
                  {/* 回复/展开按钮 */}
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[#f0edea]">
                    <button onClick={() => handleReply(post.id, null)}
                      className="flex items-center gap-1 text-xs text-primary/60 hover:text-primary active:scale-95 transition-all px-3 py-1.5 -ml-1">
                      <span className="material-symbols-outlined text-[16px]">chat_bubble_outline</span>
                      回复
                    </button>
                    {total > 0 && (
                      <button onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
                        className={`flex items-center gap-1 text-xs text-on-surface-variant/50 hover:text-on-surface-variant active:scale-95 transition-all px-3 py-1.5 ${expandedId === post.id ? 'text-primary' : ''}`}>
                        <span className="material-symbols-outlined text-[16px]">{expandedId === post.id ? 'expand_less' : 'expand_more'}</span>
                        {expandedId === post.id ? '收起回复' : `查看 ${total} 条回复`}
                      </button>
                    )}
                    <div className="flex-1" />
                    <button onClick={() => handleReply(post.id, null)}
                      className="flex items-center gap-1 text-xs text-on-surface-variant/30 hover:text-primary/60 px-2 py-1.5">
                      <span className="material-symbols-outlined text-[14px]">reply</span>
                    </button>
                  </div>
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

      {/* 展开的输入面板 */}
      {composeOpen && (
        <div className="fixed inset-0 z-[80] flex flex-col justify-end" onClick={() => setComposeOpen(false)}>
          <div className="bg-white rounded-t-2xl shadow-xl" onClick={e => e.stopPropagation()}
            style={{ paddingBottom: keyboardHeight > 250 ? keyboardHeight : '0.75rem' }}>
            <div className="w-10 h-1 bg-surface-variant rounded-full mx-auto mb-4 mt-2" />
            <div className="px-4">
              {/* 回复上下文 */}
              {replyingTo && (
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-[10px] text-on-surface-variant/60 bg-surface-container-low px-2 py-1 rounded-full truncate">
                    回复 @{replyingTo.userName}
                  </span>
                  <button onClick={cancelReply} className="text-on-surface-variant/40 hover:text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button onClick={() => setShowEmoji(!showEmoji)} className="text-on-surface-variant/60 hover:text-on-surface-variant shrink-0 w-8 h-8 flex items-center justify-center">
                  <span className="text-lg">😊</span>
                </button>
                <button onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'; input.accept = 'image/*'; input.multiple = true
                  input.onchange = (e) => {
                    const files = Array.from(e.target.files || [])
                    if (files.length) setPendingImages(files.map(f => ({ file: f, preview: URL.createObjectURL(f) })))
                  }
                  input.click()
                }} className="text-on-surface-variant/60 hover:text-on-surface-variant shrink-0 w-8 h-8 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                </button>
                <input ref={newMessageInputRef} type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  placeholder={replyingTo ? `回复 @${replyingTo.userName}...` : "写点什么..."}
                  className="flex-1 bg-surface-container-low rounded-full px-4 py-3 text-sm outline-none border-none"
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSendNewMessage() } }}
                  autoFocus />
                <button onClick={handleSendNewMessage} disabled={!newMessage.trim() || sendingNewMessage}
                  className="w-10 h-10 flex items-center justify-center bg-[#2d7d4e] text-white rounded-full disabled:opacity-40 shrink-0 transition-all active:scale-90">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                </button>
              </div>
              {/* 表情包 */}
              {showEmoji && (
                <div className="pt-3 pb-1 border-t border-surface-variant/20 mt-3">
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {emojiList.flat().map((emoji) => (
                      <button key={emoji} onClick={() => insertEmoji(emoji)} className="text-xl hover:bg-surface-container-low rounded-lg px-1.5 py-1 active:scale-110 transition-transform">{emoji}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="shrink-0 h-20" />

      {/* 图片选择预览 — 选图后显示确认发送 */}
      {pendingImages.length > 0 && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-end justify-center" onClick={() => setPendingImages([])}>
          <div className="w-full max-w-md bg-white rounded-t-2xl p-4 pb-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm text-on-surface">已选择 {pendingImages.length} 张图片</span>
              <button onClick={() => setPendingImages([])} className="text-sm text-on-surface-variant/60">取消</button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4 max-h-48 overflow-y-auto">
              {pendingImages.map((img, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-surface-variant">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <button onClick={async () => {
              for (const img of pendingImages) {
                const ext = img.file.name.split('.').pop()
                const path = `post_images/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
                const { error } = await supabase.storage.from('images').upload(path, img.file)
                if (error) { toast('上传失败: ' + error.message, 'error'); continue }
                const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path)
                // 逐张发送
                setNewMessage(`![](${publicUrl})`)
                await new Promise(r => setTimeout(r, 50))
              }
              setPendingImages([])
              handleSendNewMessage()
            }}
              className="w-full py-3.5 bg-[#2d7d4e] text-white rounded-full text-sm font-medium active:scale-95 transition-all">
              发送 {pendingImages.length} 张图片
            </button>
          </div>
        </div>
      )}

      {/* FAB — 展开输入面板 */}
      <button onClick={() => { setComposeOpen(true); setTimeout(() => newMessageInputRef.current?.focus(), 200) }}
        className="fixed right-4 z-[70] w-14 h-14 bg-primary text-white rounded-full shadow-[0_8px_24px_rgba(149,73,13,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        style={{ bottom: 100 }}>
        <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
      </button>

      {filterOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={applyFilter} />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 px-6 pt-4 pb-32 shadow-xl max-h-[70vh] overflow-y-auto">
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

    </div>
  );
}
