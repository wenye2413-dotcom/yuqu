import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Avatar from "../components/common/Avatar";
import Modal from "../components/common/Modal";
import EnergyRing from "../components/common/EnergyRing";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { getGradientBg } from "../hooks/utils";
import { getLevelFromEnergy, getLevelMaxEnergy, getLevelBadgeClasses, getLevelIcon } from "../hooks/utils";

const tabs = [
  { key: "works", label: "作品集" },
  { key: "hosted", label: "我发布的活动" },
  { key: "joined", label: "我参加的" },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, profile, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("works");
  const [editOpen, setEditOpen] = useState(searchParams.get("edit") === "1");
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [saving, setSaving] = useState(false);

  const [myWorks, setMyWorks] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [joinedEvents, setJoinedEvents] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("works").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setMyWorks(data);
    });
    supabase.from("events").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setMyEvents(data);
    });
    supabase.from("event_registrations").select("*, events(*)").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) {
        setJoinedEvents(data.filter(r => r.status === 'approved').map(r => r.events).filter(Boolean));
      }
    });
  }, [user?.id]);

  const displayName = profile?.name || user?.email?.split("@")[0] || "User";
  const userLevel = getLevelFromEnergy(0);
  const energy = 0;
  const levelMax = getLevelMaxEnergy(userLevel.id);

  const openEdit = () => {
    setEditName(profile?.name || user?.email?.split("@")[0] || "");
    setEditBio(profile?.bio || "");
    setEditLocation(profile?.location || "");
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase.auth.updateUser({ data: { name: editName, bio: editBio, location: editLocation } });
    await supabase.from("profiles").upsert({
      id: user.id, name: editName, bio: editBio, location: editLocation, updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    setSaving(false);
    setEditOpen(false);
    refreshProfile();
    toast("已保存", "success");
  };

  return (
    <main className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {/* 头部渐变区 */}
        <div className="relative px-margin-mobile pt-6 pb-16" style={{ background: 'linear-gradient(180deg, #ff9d5c15 0%, transparent 100%)' }}>
          <div className="flex items-end gap-4">
            <div className="relative">
              <Avatar name={user?.id || 'U'} size="w-20 h-20" className="border-4 border-white shadow-xl" />
              <EnergyRing energy={energy} maxEnergy={levelMax} size={88} />
            </div>
            <div className="flex-1 pb-1">
              <h1 className="font-headline-lg text-headline-lg text-on-surface">{displayName}</h1>
              <p className="text-sm text-on-surface-variant/70">{profile?.bio || ""}</p>
            </div>
            <button onClick={openEdit} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/80 backdrop-blur shadow-sm text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="mx-margin-mobile -mt-8 bg-white/80 backdrop-blur-xl rounded-xl shadow-sm border border-white/40 flex">
          {[
            { label: "作品", value: myWorks.length },
            { label: "活动", value: myEvents.length },
            { label: "参加", value: joinedEvents.length },
          ].map((s, i) => (
            <div key={s.label} className={`flex-1 py-3 text-center ${i < 2 ? 'border-r border-outline-variant/20' : ''}`}>
              <p className="font-bold text-headline-lg-mobile text-on-surface">{s.value}</p>
              <p className="text-[11px] text-on-surface-variant/60">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tab */}
        <div className="flex gap-0 mx-margin-mobile mt-4 mb-3 bg-surface-container-low/50 rounded-xl p-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === t.key ? 'bg-white shadow-sm text-on-surface' : 'text-on-surface-variant/60'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* 内容 */}
        <div className="px-margin-mobile pb-8">
          {activeTab === "works" && (
            <div>
              {myWorks.length === 0 && <p className="text-sm text-on-surface-variant/50 text-center py-16">暂无作品</p>}
              <div className="grid grid-cols-2 gap-3">
                {myWorks.map(w => (
                  <div key={w.id} onClick={() => navigate(`/works/${w.id}`)}
                    className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-sm border border-white/40 active:scale-[0.97] transition-all cursor-pointer">
                    <div className="w-full h-20 rounded-lg mb-3" style={{ background: getGradientBg(w.title) }} />
                    <p className="font-semibold text-sm text-on-surface truncate">{w.title}</p>
                    <p className="text-xs text-on-surface-variant/60 line-clamp-2 mt-1">{w.description}</p>
                    {w.price > 0 && <p className="text-xs font-semibold text-primary mt-2">¥{w.price}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "hosted" && (
            <div className="space-y-2">
              {myEvents.length === 0 && <p className="text-sm text-on-surface-variant/50 text-center py-16">暂无发布的活动</p>}
              {myEvents.map(e => (
                <div key={e.id} onClick={() => navigate(`/event/${e.id}`)}
                  className="bg-white/80 backdrop-blur rounded-xl px-4 py-3.5 shadow-sm border border-white/40 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{e.title}</p>
                    <p className="text-xs text-on-surface-variant/60 mt-0.5">{e.location || ""}{e.event_time ? ` · ${new Date(e.event_time).toLocaleDateString("zh-CN")}` : ""}</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant/30 text-[20px]">chevron_right</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "joined" && (
            <div className="space-y-2">
              {joinedEvents.length === 0 && <p className="text-sm text-on-surface-variant/50 text-center py-16">暂未参加活动</p>}
              {joinedEvents.map(e => (
                <div key={e.id} onClick={() => navigate(`/event/${e.id}`)}
                  className="bg-white/80 backdrop-blur rounded-xl px-4 py-3.5 shadow-sm border border-white/40 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{e.title}</p>
                    <p className="text-xs text-on-surface-variant/60 mt-0.5">{e.location || ""}</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant/30 text-[20px]">chevron_right</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="编辑资料">
        <div className="space-y-4">
          <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="昵称"
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none border border-outline-variant/30" />
          <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="简介" rows={3}
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none border border-outline-variant/30 resize-none" />
          <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="位置"
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none border border-outline-variant/30" />
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3.5 bg-primary text-white font-label-md rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50">
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </Modal>
    </main>
  );
}
