import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Avatar from "../components/common/Avatar";
import Modal from "../components/common/Modal";
import { useToast } from "../hooks/useToast";
import { useShare } from "../hooks/useShare";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { getLevelFromEnergy, getLevelBadgeClasses, getLevelIcon } from "../hooks/utils";
import EnergyRing from "../components/common/EnergyRing";

const tabs = [
  { key: "portfolio", label: "作品集" },
  { key: "hosted", label: "我发布的活动" },
  { key: "joined", label: "我参加的活动" },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { share } = useShare();
  const { user, profile, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("portfolio");
  const [editOpen, setEditOpen] = useState(searchParams.get("edit") === "1");
  const [editName, setEditName] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editBirthday, setEditBirthday] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  // 从 Supabase 加载数据
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
        const approved = data.filter(r => r.status === 'approved').map(r => r.events).filter(Boolean);
        setJoinedEvents(approved);
      }
    });
  }, [user?.id]);

  const displayName = profile?.name || user?.email?.split("@")[0] || "User";

  const openEdit = () => {
    setEditName(profile?.name || user?.email?.split("@")[0] || "");
    setEditGender(profile?.gender || "");
    setEditBirthday(profile?.birthday || "");
    setEditLocation(profile?.location || "");
    setEditBio(profile?.bio || "");
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase.auth.updateUser({
      data: { name: editName, gender: editGender, birthday: editBirthday, location: editLocation, bio: editBio },
    });
    await supabase.from("profiles").upsert({
      id: user.id, name: editName, gender: editGender, birthday: editBirthday, location: editLocation, bio: editBio, updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    setSaving(false);
    setEditOpen(false);
    refreshProfile();
    toast("已保存", "success");
  };

  return (
    <main className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-margin-mobile pb-8">
        {/* 用户信息头部 */}
        <div className="flex items-center gap-4 pt-4 pb-6 border-b border-surface-variant/20">
          <Avatar name={user?.id || 'U'} size="w-20 h-20" className="border-4 border-white shadow-xl" />
          <div className="flex-1">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">{displayName}</h1>
            <p className="text-sm text-on-surface-variant">{profile?.bio || ""}</p>
          </div>
          <button onClick={openEdit} className="text-primary">
            <span className="material-symbols-outlined">edit</span>
          </button>
        </div>

        {/* 统计 */}
        <div className="flex gap-4 my-4">
          <div className="flex-1 text-center"><p className="font-bold text-lg text-on-surface">{myWorks.length}</p><p className="text-xs text-on-surface-variant">作品</p></div>
          <div className="flex-1 text-center"><p className="font-bold text-lg text-on-surface">{myEvents.length}</p><p className="text-xs text-on-surface-variant">活动</p></div>
          <div className="flex-1 text-center"><p className="font-bold text-lg text-on-surface">{joinedEvents.length}</p><p className="text-xs text-on-surface-variant">参加</p></div>
        </div>

        {/* Tab */}
        <div className="flex gap-4 mb-4 border-b border-surface-variant/20">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* 作品集 */}
        {activeTab === "portfolio" && (
          <div>
            {myWorks.length === 0 && <p className="text-sm text-on-surface-variant text-center py-10">暂无作品</p>}
            <div className="grid grid-cols-2 gap-3">
              {myWorks.map(w => (
                <div key={w.id} onClick={() => navigate(`/works/${w.id}`)}
                  className="bg-surface-container-low rounded-xl p-4 active:scale-[0.98] transition-transform cursor-pointer">
                  <p className="font-semibold text-sm text-on-surface">{w.title}</p>
                  <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{w.description}</p>
                  {w.price > 0 && <p className="text-xs text-primary mt-2">¥{w.price}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 我发布的活动 */}
        {activeTab === "hosted" && (
          <div>
            {myEvents.length === 0 && <p className="text-sm text-on-surface-variant text-center py-10">暂无发布的活动</p>}
            <div className="space-y-2">
              {myEvents.map(e => (
                <div key={e.id} onClick={() => navigate(`/event/${e.id}`)}
                  className="flex items-center justify-between bg-surface-container-low rounded-xl px-4 py-3 cursor-pointer active:scale-[0.98] transition-transform">
                  <div><p className="text-sm font-semibold text-on-surface">{e.title}</p><p className="text-xs text-on-surface-variant">{e.location || ""}</p></div>
                  <span className="material-symbols-outlined text-on-surface-variant/50 text-[18px]">chevron_right</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 我参加的活动 */}
        {activeTab === "joined" && (
          <div>
            {joinedEvents.length === 0 && <p className="text-sm text-on-surface-variant text-center py-10">暂无参加的活动</p>}
            <div className="space-y-2">
              {joinedEvents.map(e => (
                <div key={e.id} onClick={() => navigate(`/event/${e.id}`)}
                  className="flex items-center justify-between bg-surface-container-low rounded-xl px-4 py-3 cursor-pointer active:scale-[0.98] transition-transform">
                  <div><p className="text-sm font-semibold text-on-surface">{e.title}</p><p className="text-xs text-on-surface-variant">{e.location || ""}</p></div>
                  <span className="material-symbols-outlined text-on-surface-variant/50 text-[18px]">chevron_right</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 编辑资料弹窗 */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="编辑资料">
        <div className="space-y-4">
          <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="昵称"
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none border border-outline-variant/30" />
          <input type="text" value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="简介"
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none border border-outline-variant/30" />
          <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="位置"
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none border border-outline-variant/30" />
          <div className="flex gap-3">
            <input type="date" value={editBirthday} onChange={e => setEditBirthday(e.target.value)}
              className="flex-1 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none border border-outline-variant/30" />
            <select value={editGender} onChange={e => setEditGender(e.target.value)}
              className="flex-1 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none border border-outline-variant/30">
              <option value="">性别</option><option value="男">男</option><option value="女">女</option>
            </select>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3.5 bg-primary text-white font-label-md rounded-full active:scale-95 transition-transform">
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </Modal>
    </main>
  );
}
