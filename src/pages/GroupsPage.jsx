import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { groups as groupsData, filterOptions } from "../mocks/data";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { useShare } from "../hooks/useShare";
import Avatar from "../components/common/Avatar";

const translateJoinStatus = (status, isPublic) => {
  if (status === "joined") return { label: "进入群聊", style: "bg-primary-container text-primary" };
  if (status === "applied") return { label: "待审核", style: "bg-secondary/10 text-secondary" };
  return { label: isPublic ? "加入" : "申请加入", style: "bg-primary text-white" };
};

export default function GroupsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { share } = useShare();
  const { user } = useAuth();

  const [tab, setTab] = useState("my");
  const [filterOpen, setFilterOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState(null); // null=选择, 'community', 'group'
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createPublic, setCreatePublic] = useState(true);
  const [creating, setCreating] = useState(false);
  const [filters, setFilters] = useState({ category: "全部", distance: "全城", activeTime: "最近活跃" });
  const [searchQuery, setSearchQuery] = useState("");

  // 从数据库加载群组数据和加入状态
  const [dbGroups, setDbGroups] = useState([]);
  const [joinStates, setJoinStates] = useState({});

  useEffect(() => {
    fetchGroups();
    fetchMyMemberships();
  }, []);

  const fetchGroups = async () => {
    const { data, error } = await supabase.from("groups").select("*");
    if (error) {
      console.error("获取群组失败:", error.message);
      return;
    }
    if (data) {
      // 合并 mock 数据中没有的群组信息
      const merged = data.map((g) => {
        const mock = groupsData.find((m) => m.id === g.id);
        return {
          ...g,
          avatar: g.name,
          lastMessage: mock?.lastMessage || g.description?.slice(0, 30) || "",
          sender: mock?.sender || "",
          time: mock?.time || "",
          memberCount: g.member_count || mock?.memberCount || 0,
          desc: g.description || mock?.desc || "",
          isPublic: g.is_public !== false,
        };
      });
      // 加入 mock 中但不在数据库中的群组
      groupsData.forEach((m) => {
        if (!merged.some((g) => g.id === m.id)) {
          merged.push(m);
        }
      });
      setDbGroups(merged);
    }
  };

  const fetchMyMemberships = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("group_members")
      .select("*")
      .eq("user_id", user.id);
    if (error) {
      console.error("获取群成员关系失败:", error.message);
      return;
    }
    if (data) {
      const map = {};
      data.forEach((m) => {
        map[m.group_id] = m.status === "member" ? "joined" : m.status === "pending" ? "applied" : null;
      });
      // 合并 mock 数据的状态
      groupsData.forEach((g) => {
        if (!map[g.id]) {
          map[g.id] = g.joinStatus;
        }
      });
      setJoinStates(map);
    }
  };

  const myGroups = dbGroups.filter((g) => joinStates[g.id] === "joined");
  const interestGroups = dbGroups.filter((g) => joinStates[g.id] !== "joined");

  // 搜索过滤
  const filteredInterest = interestGroups.filter((g) =>
    searchQuery ? g.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const handleJoin = async (e, group) => {
    e.stopPropagation();
    if (joinStates[group.id] === "joined") {
      navigate(`/group-chat/${group.id}`);
      return;
    }
    if (joinStates[group.id] === "applied") {
      toast("申请审核中，请耐心等待", "info");
      return;
    }

    if (group.isPublic) {
      // 公开群组，直接加入 - 写入数据库
      if (user) {
        const { error } = await supabase.from("group_members").upsert({
          group_id: group.id,
          user_id: user.id,
          status: "member",
          role: "member",
        }, { onConflict: "group_id,user_id" });
        if (error) {
          toast("加入失败: " + error.message, "error");
          return;
        }
      }
      setJoinStates((prev) => ({ ...prev, [group.id]: "joined" }));
      toast(`✅ 已加入「${group.name}」`, "success");
    } else {
      // 私密群组，申请加入 - 写入数据库
      if (user) {
        const { error } = await supabase.from("group_members").insert({
          group_id: group.id,
          user_id: user.id,
          status: "pending",
          role: "member",
        });
        if (error) {
          if (error.code === "23505") {
            toast("你已经申请过了", "info");
            return;
          }
          toast("申请失败: " + error.message, "error");
          return;
        }
      }
      setJoinStates((prev) => ({ ...prev, [group.id]: "applied" }));
      toast("申请已发送，等待群主审核", "info");
    }
  };

  const handleDetailJoin = async (group) => {
    if (group.isPublic) {
      if (user) {
        const { error } = await supabase.from("group_members").upsert({
          group_id: group.id,
          user_id: user.id,
          status: "member",
          role: "member",
        }, { onConflict: "group_id,user_id" });
        if (error) {
          toast("加入失败: " + error.message, "error");
          return;
        }
      }
      setJoinStates((prev) => ({ ...prev, [group.id]: "joined" }));
      toast(`✅ 已加入「${group.name}」`, "success");
    } else {
      if (user) {
        const { error } = await supabase.from("group_members").insert({
          group_id: group.id,
          user_id: user.id,
          status: "pending",
          role: "member",
        });
        if (error) {
          if (error.code === "23505") {
            toast("你已经申请过了", "info");
            return;
          }
          toast("申请失败: " + error.message, "error");
          return;
        }
      }
      setJoinStates((prev) => ({ ...prev, [group.id]: "applied" }));
      toast("申请已发送", "info");
    }
    setDetail(null);
  };

  // 创建群组/社区
  const handleCreate = async () => {
    if (!createName.trim()) { toast("请输入名称", "error"); return }
    setCreating(true);
    const { data, error } = await supabase.from("groups").insert({
      name: createName.trim(),
      description: createDesc.trim(),
      user_id: user.id,
      is_public: createPublic,
      member_count: 1,
      type: createType || 'group',
    }).select().single();
    setCreating(false);
    if (error) { toast("创建失败: " + error.message, "error"); return }
    await supabase.from("group_members").insert({
      group_id: data.id, user_id: user.id, status: "member", role: "owner",
    });
    setCreateOpen(false);
    setCreateType(null);
    setCreateName(""); setCreateDesc("");
    const typeLabel = createType === 'community' ? '社区' : '群组';
    toast(`${typeLabel}已创建`, "success");
    fetchGroups(); fetchMyMemberships();
  };

  return (
    <div className="h-full overflow-y-auto">
    <main className="pb-4">
      {/* 搜索栏 */}
      <div className="px-margin-mobile pb-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[20px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索群组名称或兴趣..."
              className="w-full bg-surface-container-low/80 rounded-full pl-10 pr-4 py-2 font-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 border border-white/40 shadow-sm"
            />
          </div>
          <button
            onClick={() => setFilterOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low/80 text-on-surface-variant hover:bg-primary-container/20 hover:text-primary transition-colors border border-white/40 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">filter_alt</span>
          </button>
        </div>
      </div>

      {/* 群组列表 — 搜索 + 混合展示 */}
      <div className="px-margin-mobile">
        {(() => {
          const allGroups = [...myGroups, ...interestGroups.filter(g => !myGroups.find(m => m.id === g.id))]
          const searched = searchQuery
            ? allGroups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
            : allGroups

          if (searched.length === 0) {
            return (
              <div className="text-center py-12 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-2">search</span>
                <p>{searchQuery ? '没有找到匹配的群组' : '还没有群组'}</p>
                <p className="text-sm mt-1">搜索群名或创建一个</p>
              </div>
            )
          }

          return (
            <div className="flex flex-col gap-stack-md">
              {searched.map((g) => {
                const joined = joinStates[g.id] === "joined"
                const applied = joinStates[g.id] === "applied"
                return (
                  <div key={g.id}
                    className="card card-hover p-4 flex items-center gap-4"
                    onClick={() => joined ? navigate(`/group-chat/${g.id}`) : setDetail(g)}>
                    <Avatar name={g.avatar || g.name} size="w-14 h-14" className="rounded-[1rem]" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-on-surface truncate">{g.name}</h3>
                      <p className="text-xs text-on-surface-variant/70 truncate">{g.desc || g.lastMessage || ""}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-on-surface-variant/50">{g.memberCount || 0} 人</span>
                        {joined && <span className="text-[10px] text-bamboo-600 font-medium">已加入</span>}
                      </div>
                    </div>
                    <button onClick={(e) => handleJoin(e, g)}
                      className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium ${
                        joined ? 'bg-bamboo-50 text-bamboo-700' :
                        applied ? 'bg-secondary/10 text-secondary' :
                        'bg-[#95490d] text-white'
                      }`}>
                      {joined ? '进入' : applied ? '已申请' : '加入'}
                    </button>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>
                  const s = translateJoinStatus(joinStates[g.id], g.isPublic);
                  return (
                    <button
                      onClick={(e) => handleJoin(e, g)}
                      className={`px-3 py-1 ${s.style} text-label-sm rounded-full active:scale-95 transition-transform`}
                    >
                      {s.label}
                    </button>
                  );
                })()}
                <button
                  onClick={(e) => { e.stopPropagation(); share(`加入「${g.name}」`, `${g.desc || ""}`, `/group-chat/${g.id}`); }}
                  className="w-7 h-7 flex items-center justify-center text-on-surface-variant/40 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">share</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 筛选面板 */}
      {filterOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end justify-center" onClick={() => setFilterOpen(false)}>
          <div className="w-full max-w-md bg-white rounded-t-xl p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-outline-variant/30 rounded-full mx-auto mb-6" />
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline-lg text-on-surface">筛选条件</h2>
              <button onClick={() => setFilterOpen(false)}><span className="material-symbols-outlined">close</span></button>
            </div>
            {["类别", "距离", "活跃时间"].map((section, si) => {
              const keys = ["categories", "distances", "activeTimes"];
              const filtersKey = ["category", "distance", "activeTime"];
              return (
                <div key={section} className="mb-5">
                  <p className="font-label-md mb-3">{section}</p>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions[keys[si]].map((opt) => (
                      <span
                        key={opt}
                        onClick={() => setFilters((f) => ({ ...f, [filtersKey[si]]: opt }))}
                        className={`px-4 py-1.5 rounded-full text-label-sm cursor-pointer transition-colors ${
                          filters[filtersKey[si]] === opt ? "bg-primary-container text-on-primary-container" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                        }`}
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
            <button
              onClick={() => {
                console.log("群组筛选:", filters);
                toast(`筛选已应用`, "success");
                setFilterOpen(false);
              }}
              className="w-full mt-4 py-3 bg-primary text-white font-label-md rounded-full shadow-lg"
            >
              应用筛选
            </button>
          </div>
        </div>
      )}

      {/* 群组详情浮层 */}
      {detail && (
        <div className="fixed inset-0 bg-white z-[70] overflow-y-auto animate-slide-in-right">
          <div className="sticky top-0 bg-white/80 backdrop-blur-md p-4 flex items-center justify-between border-b border-surface-container">
            <button onClick={() => setDetail(null)} className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-low">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h2 className="font-label-md text-on-surface">群组详情</h2>
            <div className="w-10" />
          </div>
          <div className="p-margin-mobile flex flex-col gap-6">
            <div className="w-24 h-24 rounded-2xl mx-auto overflow-hidden shadow-xl border-4 border-white">
              <Avatar name={detail.avatar} size="w-full h-full" className="rounded-none" />
            </div>
            <div className="text-center">
              <h1 className="font-headline-lg text-on-surface mb-2">{detail.name}</h1>
              <p className="font-body-md text-on-surface-variant px-4">{detail.desc}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 bg-surface-container-low/50 p-4 rounded-xl">
              <div className="text-center"><p className="text-[10px] text-on-surface-variant">成员</p><p className="font-bold">{detail.memberCount || "1.2k"}</p></div>
              <div className="text-center border-x border-outline-variant/20"><p className="text-[10px] text-on-surface-variant">活跃</p><p className="font-bold text-primary">高</p></div>
              <div className="text-center"><p className="text-[10px] text-on-surface-variant">动态</p><p className="font-bold">88+</p></div>
            </div>
            <div className="space-y-4">
              <h3 className="font-label-md text-on-surface">群组简介</h3>
              <p className="text-body-md text-on-surface-variant leading-relaxed">{detail.intro || detail.desc || "本群组致力于为志同道合的朋友提供一个交流平台。"}</p>
            </div>
            {joinStates[detail.id] === "joined" ? (
              <button
                onClick={() => { setDetail(null); navigate(`/group-chat/${detail.id}`); }}
                className="mt-4 w-full py-4 bg-primary text-white font-label-md rounded-full shadow-lg active:scale-95"
              >
                进入群聊
              </button>
            ) : joinStates[detail.id] === "applied" ? (
              <button className="mt-4 w-full py-4 bg-secondary/20 text-secondary font-label-md rounded-full" disabled>
                申请审核中...
              </button>
            ) : (
              <button
                onClick={() => handleDetailJoin(detail)}
                className="mt-4 w-full py-4 bg-primary text-white font-label-md rounded-full shadow-lg active:scale-95"
              >
                {detail.isPublic ? "加入群组" : "申请加入群组"}
              </button>
            )}
          </div>
        </div>
      )}
      {/* 创建群组 FAB */}
      <button onClick={() => setCreateOpen(true)}
        className="fixed right-4 z-[70] w-14 h-14 bg-primary text-white rounded-full shadow-[0_8px_24px_rgba(149,73,13,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        style={{ bottom: 100 }}>
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>

      {createOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => { setCreateOpen(false); setCreateType(null) }} />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 px-6 pt-4 pb-32 max-h-[70vh] overflow-y-auto">
            <div className="w-10 h-1 bg-surface-variant rounded-full mx-auto mb-4" />
            {!createType ? (
              <>
                <h3 className="font-label-md text-label-md text-center mb-6 text-on-surface">创建群组</h3>
                <p className="text-xs text-on-surface-variant/60 text-center -mt-4 mb-4">和志同道合的人一起玩</p>
                <button onClick={() => setCreateType('group')}
                  className="w-full flex items-center gap-4 px-4 py-4 bg-surface-container-low/50 rounded-xl text-left active:scale-[0.98] transition-transform mb-3">
                  <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-[20px]">👥</span>
                  <div><p className="font-label-md text-label-md text-on-surface">创建兴趣群组</p><p className="text-xs text-on-surface-variant">爬山、K歌、游戏、运动...</p></div>
                </button>
                <button onClick={() => setCreateOpen(false)} className="w-full py-3 text-sm text-on-surface-variant/60 active:scale-95 transition-all">
                  取消
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-6">
                  <button onClick={() => setCreateType(null)} className="text-on-surface-variant">
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <h3 className="font-label-md text-label-md text-on-surface">创建群组</h3>
                </div>
                <div className="space-y-4">
                  <input type="text" value={createName} onChange={(e) => setCreateName(e.target.value)}
                    placeholder="群组名称（如：周末爬山群）" className="w-full bg-white rounded-xl px-4 py-3.5 text-sm outline-none border border-[#f0edea] focus:border-primary/30 transition-colors" />
                  <textarea value={createDesc} onChange={(e) => setCreateDesc(e.target.value)}
                    placeholder="群组简介（选填）" rows={3}
                    className="w-full bg-white rounded-xl px-4 py-3.5 text-sm outline-none border border-[#f0edea] focus:border-primary/30 transition-colors resize-none" />
                  <label className="flex items-center gap-3 text-sm text-on-surface">
                    <input type="checkbox" checked={createPublic} onChange={(e) => setCreatePublic(e.target.checked)} className="accent-primary w-4 h-4" />
                    公开群组
                  </label>
                  <button onClick={handleCreate} disabled={creating || !createName.trim()}
                    className="w-full py-3.5 bg-[#95490d] text-white rounded-full text-sm font-medium disabled:opacity-40 active:scale-95 transition-all">
                    {creating ? "创建中..." : "创建群组"}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </main></div>
  );
}
