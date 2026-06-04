import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CreatorCard from "../components/discovery/CreatorCard";
import EventCard from "../components/discovery/EventCard";
import Avatar from "../components/common/Avatar";
import { users, filterOptions } from "../mocks/data";
import { useToast } from "../hooks/useToast";
import { getAvatarUrl } from "../hooks/utils";
import { supabase } from "../supabaseClient";

export default function DiscoveryPage() {
  const navigate = useNavigate();
  const toast = useToast();

  // 订阅 / 关注状态
  const [subState, setSubState] = useState({});
  const [followState, setFollowState] = useState({});

  // 筛选
  const [activeCategory, setActiveCategory] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ category: "全部", distance: "全城", activeTime: "最近活跃" });

  // 事件报名状态
  const [eventState, setEventState] = useState({});

  // 支付流程
  const [payingCreator, setPayingCreator] = useState(null);
  const [paying, setPaying] = useState(false);

  // 从 users 提取创作者列表 (由用户数据驱动)
  const allCreators = Object.values(users).filter((u) => u.isCreator && u.id !== "u_self");

  // 从 Supabase 加载真实活动
  const [allEvents, setAllEvents] = useState([]);
  useEffect(() => {
    supabase.from("events").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setAllEvents(data);
    });
  }, []);

  // 分类关键字映射
  const categoryKeywords = {
    "户外": ["爬山", "露营", "户外", "徒步", "登山", "探险", "hiking"],
    "摄影": ["摄影", "插画", "艺术", "photo", "拍照", "视觉", "design"],
    "运动": ["健身", "运动", "教练", "训练", "跑步", "fitness"],
    "音乐": ["音乐", "吉他", "歌手", "乐队", "弹唱", "music"],
    "美食": ["咖啡", "烘焙", "美食", "料理", "烹饪", "bread", "coffee"],
  };

  // 搜索过滤
  const searchFiltered = allCreators.filter((c) => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.bio.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // 顶部 tab 分类过滤
  let filteredCreators = searchFiltered;
  let showEvents = true;
  if (activeCategory === "热门") {
    filteredCreators = [...searchFiltered].sort((a, b) => {
      const an = parseFloat(a.followers?.replace(/k$/, (m) => "000").replace(/[^0-9]/g, "")) || 0;
      const bn = parseFloat(b.followers?.replace(/k$/, (m) => "000").replace(/[^0-9]/g, "")) || 0;
      return bn - an;
    });
    showEvents = true;
  } else if (activeCategory === "附近") {
    // 没有位置数据，按原样显示
    showEvents = true;
  } else if (activeCategory === "新秀") {
    filteredCreators = searchFiltered.filter((c) => c.level === "novice");
    showEvents = true;
  } else if (activeCategory === "活动") {
    filteredCreators = [];
    showEvents = true;
  }
  // "全部": 无额外过滤

  // Avatar click: 跳转到个人主页
  const handleAvatarClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  // 订阅 (付费 → 弹出支付)
  const toggleSub = (creatorId, price) => {
    if (subState[creatorId]) {
      setSubState((prev) => ({ ...prev, [creatorId]: false }));
      toast("已取消订阅", "info");
    } else if (price > 0) {
      const creator = allCreators.find((c) => c.id === creatorId);
      if (creator) setPayingCreator(creator);
    } else {
      setSubState((prev) => ({ ...prev, [creatorId]: true }));
      toast("已关注", "success");
    }
  };

  // 模拟支付确认 → 弹出"支付成功"提示，再跳转到解锁页面
  const handleConfirmPayment = async () => {
    if (!payingCreator || paying) return;
    setPaying(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSubState((prev) => ({ ...prev, [payingCreator.id]: true }));
    setPaying(false);
    setPayingCreator(null);
    toast("支付成功", "success");
    // 等 toast 显示后再跳转
    await new Promise((r) => setTimeout(r, 800));
    navigate(`/profile/${payingCreator.id}`);
  };

  // 关注免费创作者（关注后跳转主页）
  const toggleFollow = (creatorId, name) => {
    const next = !followState[creatorId];
    setFollowState((prev) => ({ ...prev, [creatorId]: next }));
    if (next) {
      toast(`已关注 ${name}`, "success");
      setTimeout(() => navigate(`/profile/${creatorId}`), 500);
    } else {
      toast(`已取消关注 ${name}`, "info");
    }
  };

  // 活动加入
  const handleEventJoin = (eventId, title, isPublic) => {
    if (eventState[eventId]) {
      navigate(`/event/${eventId}`);
      return;
    }
    if (isPublic) {
      setEventState((prev) => ({ ...prev, [eventId]: "registered" }));
      toast("✅ 已报名", "success");
    } else {
      setEventState((prev) => ({ ...prev, [eventId]: "applied" }));
      toast("申请已发送，等待组织者确认", "info");
    }
  };

  return (
    <div className="h-full overflow-y-auto">
    <main className="px-margin-mobile">
      {/* 搜索 + 筛选 */}
      <div className="mb-stack-md flex gap-stack-sm items-center">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索达人、活动或用户..."
            className="w-full bg-white/50 backdrop-blur-md border border-white/40 rounded-full pl-10 pr-4 py-2.5 text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <button
          onClick={() => setFilterOpen(true)}
          className="w-11 h-11 flex items-center justify-center bg-white/50 backdrop-blur-md border border-white/40 rounded-full text-on-surface hover:bg-white/80 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">filter_list</span>
        </button>
      </div>

      {/* 活动列表 — 发现页只展示活动 */}
      {allEvents.length > 0 ? (
        <div className="flex flex-col gap-gutter">
          {allEvents.map((evt) => (
            <EventCard
              key={evt.id}
              event={evt}
              joinStatus={eventState[evt.id] || "none"}
              onJoin={() => handleEventJoin(evt.id, evt.title, evt.isPublic)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">event</span>
          <p className="text-sm text-on-surface-variant/50 mt-2">暂无活动</p>
          <button onClick={() => navigate("/publish-event")}
            className="mt-4 px-6 py-2.5 bg-primary text-white rounded-full text-sm font-medium shadow-lg active:scale-95 transition-all">
            发起活动
          </button>
        </div>
      )}

      {/* 筛选面板 */}
      {filterOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end justify-center" onClick={() => setFilterOpen(false)}>
          <div className="w-full max-w-md bg-white rounded-t-xl p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-outline-variant/30 rounded-full mx-auto mb-6" />
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline-lg text-on-surface">筛选条件</h2>
              <button onClick={() => setFilterOpen(false)}><span className="material-symbols-outlined">close</span></button>
            </div>

            {/* 类别 */}
            <div className="mb-5">
              <p className="font-label-md mb-3">类别</p>
              <div className="flex flex-wrap gap-2">
                {filterOptions.categories.map((c) => (
                  <span
                    key={c}
                    onClick={() => setFilters((f) => ({ ...f, category: c }))}
                    className={`px-4 py-1.5 rounded-full text-label-sm cursor-pointer transition-colors ${
                      filters.category === c ? "bg-primary-container text-on-primary-container" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* 距离 */}
            <div className="mb-5">
              <p className="font-label-md mb-3">距离</p>
              <div className="flex flex-wrap gap-2">
                {filterOptions.distances.map((d) => (
                  <span
                    key={d}
                    onClick={() => setFilters((f) => ({ ...f, distance: d }))}
                    className={`px-4 py-1.5 rounded-full text-label-sm cursor-pointer transition-colors ${
                      filters.distance === d ? "bg-primary-container text-on-primary-container" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* 活跃时间 */}
            <div className="mb-5">
              <p className="font-label-md mb-3">活跃时间</p>
              <div className="flex flex-wrap gap-2">
                {filterOptions.activeTimes.map((t) => (
                  <span
                    key={t}
                    onClick={() => setFilters((f) => ({ ...f, activeTime: t }))}
                    className={`px-4 py-1.5 rounded-full text-label-sm cursor-pointer transition-colors ${
                      filters.activeTime === t ? "bg-primary-container text-on-primary-container" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                console.log("筛选条件:", filters);
                toast(`筛选: ${filters.category} · ${filters.distance} · ${filters.activeTime}`, "info");
                setFilterOpen(false);
              }}
              className="w-full mt-4 py-3 bg-primary text-white font-label-md rounded-full shadow-lg shadow-primary/20"
            >
              应用筛选
            </button>
          </div>
        </div>
      )}

      {/* 支付确认弹窗 */}
      {payingCreator && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-end justify-center" onClick={() => { if (!paying) setPayingCreator(null); }}>
          <div className="w-full max-w-md bg-white rounded-t-xl p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-outline-variant/30 rounded-full mx-auto mb-6" />
            <h3 className="font-headline-lg text-on-surface text-center mb-6">确认订阅</h3>
            <div className="bg-surface-container-low rounded-xl p-6 flex flex-col items-center gap-3 mb-6">
              <Avatar name={payingCreator.avatar} size="w-16 h-16" />
              <p className="font-label-md text-label-md text-on-surface">{payingCreator.name}</p>
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-full font-bold text-lg">
                ${payingCreator.price}/月
              </div>
              <p className="text-xs text-on-surface-variant text-center">订阅后可解锁私信和专属内容</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPayingCreator(null)}
                disabled={paying}
                className="flex-1 py-3.5 bg-surface-container-low text-on-surface font-label-md rounded-full border border-outline-variant/30 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={paying}
                className="flex-1 py-3.5 bg-primary text-white font-label-md rounded-full shadow-lg disabled:opacity-60"
              >
                {paying ? "处理中..." : `确认支付 $${payingCreator.price}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main></div>
  );
}
