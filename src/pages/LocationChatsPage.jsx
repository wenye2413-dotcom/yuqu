import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useLocation, calcDistance, formatDistance } from "../hooks/useLocation";
import Avatar from "../components/common/Avatar";

export default function LocationChatsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location: myPos, loading: posLoading, requestLocation } = useLocation();
  const [chats, setChats] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createLat, setCreateLat] = useState("");
  const [createLng, setCreateLng] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    supabase.from("location_chats").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setChats(data);
    });
    supabase.from("profiles").select("id, name").then(({ data }) => {
      if (data) {
        const m = {};
        data.forEach(p => { m[p.id] = p; });
        setProfiles(m);
      }
    });
  }, []);

  // 定位成功后自动填入经纬度
  useEffect(() => {
    if (myPos) {
      setCreateLat(myPos.lat.toFixed(6));
      setCreateLng(myPos.lng.toFixed(6));
    }
  }, [myPos]);

  const handleCreate = async () => {
    if (!createName.trim() || !createLat || !createLng) return;
    setCreating(true);
    const { error } = await supabase.from("location_chats").insert({
      name: createName.trim(),
      latitude: parseFloat(createLat),
      longitude: parseFloat(createLng),
      created_by: user.id,
    });
    setCreating(false);
    if (error) { alert("创建失败: " + error.message); return; }
    setShowCreate(false);
    setCreateName(""); setCreateLat(""); setCreateLng("");
    const { data } = await supabase.from("location_chats").select("*").order("created_at", { ascending: false });
    if (data) setChats(data);
  };

  return (
    <div className="h-full flex flex-col bg-[#fcf9f8]">
      <div className="flex-1 overflow-y-auto px-margin-mobile">
        <div className="flex items-center justify-between pt-3 pb-4">
          <h2 className="font-headline-lg-mobile font-bold">地点交流</h2>
          <button onClick={() => { setShowCreate(true); requestLocation() }}
            className="px-4 py-2 bg-[#95490d] text-white rounded-full text-sm font-medium shadow-sm active:scale-95 transition-all">
            创建
          </button>
        </div>

        {posLoading && <p className="text-xs text-on-surface-variant/50 text-center py-8">定位中...</p>}

        {!posLoading && chats.length === 0 && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">map</span>
            <p className="text-sm text-on-surface-variant/50 mt-2">暂无人创建地点讨论</p>
          </div>
        )}

        <div className="space-y-2">
          {chats.map((chat) => {
            const dist = myPos ? calcDistance(myPos.lat, myPos.lng, chat.latitude, chat.longitude) : null;
            return (
              <div key={chat.id} onClick={() => navigate(`/location-chat/${chat.id}`)}
                className="card card-hover p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[20px]">place</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-on-surface">{chat.name}</h3>
                    <p className="text-xs text-primary/60 font-mono mt-0.5">{chat.latitude.toFixed(4)}, {chat.longitude.toFixed(4)}</p>
                    {dist !== null && <p className="text-[10px] text-on-surface-variant/50 mt-0.5">距你 {formatDistance(dist)}</p>}
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant/30 text-[18px]">chevron_right</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 创建弹窗 — 经纬度输入 */}
      {showCreate && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowCreate(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 px-6 pt-4 pb-32 max-h-[70vh] overflow-y-auto">
            <div className="w-10 h-1 bg-surface-variant rounded-full mx-auto mb-4" />
            <h3 className="font-label-md text-label-md text-center mb-6 text-on-surface">创建地点讨论</h3>
            <div className="space-y-4">
              <input type="text" value={createName} onChange={e => setCreateName(e.target.value)}
                placeholder="讨论主题" className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none border border-outline-variant/30" />

              <div>
                <p className="text-xs text-on-surface-variant/60 mb-2">经纬度坐标</p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input type="text" value={createLat} onChange={e => setCreateLat(e.target.value)}
                      placeholder="纬度 (lat)" className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none border border-outline-variant/30 font-mono" />
                  </div>
                  <div className="flex-1">
                    <input type="text" value={createLng} onChange={e => setCreateLng(e.target.value)}
                      placeholder="经度 (lng)" className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none border border-outline-variant/30 font-mono" />
                  </div>
                </div>
                <p className="text-[10px] text-on-surface-variant/40 mt-1">
                  {myPos ? `当前位置: ${myPos.lat.toFixed(6)}, ${myPos.lng.toFixed(6)}` : '定位中...'}
                  <button onClick={requestLocation} className="text-primary ml-1">刷新</button>
                </p>
              </div>

              <button onClick={handleCreate} disabled={creating || !createName.trim() || !createLat || !createLng}
                className="w-full py-3.5 bg-[#95490d] text-white rounded-full text-sm font-medium disabled:opacity-40 active:scale-95 transition-all">
                {creating ? "创建中..." : "创建"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
