import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Avatar from "../components/common/Avatar";
import Modal from "../components/common/Modal";
import EnergyRing from "../components/common/EnergyRing";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { getGradientBg } from "../hooks/utils";
import { getLevelFromEnergy, getLevelMaxEnergy } from "../hooks/utils";

const tabs = [
  { key: "works", label: "作品" },
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
  const [editGender, setEditGender] = useState("");
  const [editBirthday, setEditBirthday] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const [myWorks, setMyWorks] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("works").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setMyWorks(data);
    });
    supabase.from("events").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setMyEvents(data);
    });
    supabase.from("event_registrations").select("*, events(*)").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setJoinedEvents(data.filter(r => r.status === 'approved').map(r => r.events).filter(Boolean));
    });
  }, [user?.id]);

  const displayName = profile?.name || user?.email?.split("@")[0] || "User";
  const userLevel = getLevelFromEnergy(0);

  const openEdit = () => {
    setEditName(profile?.name || user?.email?.split("@")[0] || "");
    setEditBio(profile?.bio || "");
    setEditLocation(profile?.location || "");
    setEditGender(profile?.gender || "");
    setEditBirthday(profile?.birthday || "");
    setEditWebsite(profile?.website || "");
    setEditOpen(true);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast("请选择图片", "error"); return }
    if (file.size > 5 * 1024 * 1024) { toast("图片不能超过5MB", "error"); return }
    setSaving(true);
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
    if (uploadErr) { toast("上传失败: " + uploadErr.message, "error"); setSaving(false); return }
    // 使用直连 URL 而非代理 URL，确保图片可访问
    const avatarUrl = `https://rczqlxxveukukuuwluzg.supabase.co/storage/v1/object/public/avatars/${filePath}`;
    await supabase.auth.updateUser({ data: { ...profile, avatar_url: avatarUrl } });
    const { error: upsertErr } = await supabase.from("profiles").upsert({
      id: user.id, avatar_url: avatarUrl, updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    if (upsertErr) console.error("profile upsert error:", upsertErr);
    setSaving(false);
    refreshProfile();
    toast("头像已更新", "success");
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase.auth.updateUser({ data: { name: editName, bio: editBio, location: editLocation, gender: editGender, birthday: editBirthday, website: editWebsite } });
    await supabase.from("profiles").upsert({
      id: user.id, name: editName, bio: editBio, location: editLocation, gender: editGender, birthday: editBirthday, website: editWebsite, updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    setSaving(false);
    setEditOpen(false);
    refreshProfile();
    toast("已保存", "success");
  };

  const coverGradient = getGradientBg(displayName);

  return (
    <main className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {/* 封面图 */}
        <div className="h-44 relative" style={{ background: coverGradient }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
          <button onClick={openEdit}
            className="absolute top-12 right-4 w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center shadow-sm z-10">
            <span className="material-symbols-outlined text-white text-[18px]">edit</span>
          </button>
        </div>

        {/* 头像（骑在封面上） */}
        <div className="px-margin-mobile">
          <div className="flex items-end -mt-12 mb-3">
            <div className="relative cursor-pointer group" onClick={() => fileRef.current?.click()}>
              <Avatar name={user?.id || 'U'} src={profile?.avatar_url} size="w-24 h-24" className="border-4 border-white shadow-xl" />
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 text-[24px] transition-opacity">camera_alt</span>
              </div>
            </div>
            <input type="file" accept="image/*" ref={fileRef} onChange={handleAvatarUpload} className="hidden" />
            <div className="ml-3 pb-1">
              <h1 className="font-headline-lg text-headline-lg text-on-surface">{displayName}</h1>
              <p className="text-sm text-on-surface-variant/70">{profile?.bio || ""}</p>
              {profile?.location && <p className="text-xs text-on-surface-variant/50 mt-0.5">📍 {profile.location}</p>}
            </div>
          </div>

          {/* 统计（可点击） */}
          <div className="card flex mb-4 overflow-hidden">
            <div onClick={() => navigate('/followers')} className="flex-1 py-3 text-center border-r border-[#f0edea] cursor-pointer active:bg-surface-container-low transition-colors">
              <p className="font-bold text-headline-lg-mobile text-on-surface">{followerCount}</p>
              <p className="text-[10px] text-on-surface-variant/60">关注者</p>
            </div>
            <div onClick={() => navigate('/following')} className="flex-1 py-3 text-center cursor-pointer active:bg-surface-container-low transition-colors">
              <p className="font-bold text-headline-lg-mobile text-on-surface">{followingCount}</p>
              <p className="text-[10px] text-on-surface-variant/60">正在关注</p>
            </div>
          </div>

          {/* Tab */}
          <div className="flex gap-0 mb-3 bg-surface-container-low/50 rounded-xl p-1">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === t.key ? 'bg-white shadow-sm text-on-surface' : 'text-on-surface-variant/60'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* 作品 */}
          {activeTab === "works" && (
            <div className="pb-8">
              {myWorks.length === 0 ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/20">palette</span>
                  <p className="text-sm text-on-surface-variant/50 mt-2">暂无作品</p>
                  <button onClick={() => navigate("/publish-work")}
                    className="mt-4 px-6 py-2.5 bg-[#2d7d4e] text-white rounded-full text-sm font-medium shadow-sm active:scale-95 transition-all">
                    发布作品
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pb-6">
                  {myWorks.map(w => (
                    <div key={w.id} onClick={() => navigate(`/works/${w.id}`)}
                      className="card overflow-hidden active:scale-[0.97] transition-all cursor-pointer">
                      {w.images?.length > 0 ? (
                        <div className="aspect-[4/3] overflow-hidden bg-surface-variant">
                          <img src={w.images[0]} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="aspect-[4/3] flex items-center justify-center" style={{ background: getGradientBg(w.title) }}>
                          <span className="material-symbols-outlined text-white/60 text-[32px]">image</span>
                        </div>
                      )}
                      <div className="p-3">
                        <p className="font-semibold text-sm text-on-surface truncate">{w.title}</p>
                        <p className="text-xs text-on-surface-variant/60 line-clamp-1 mt-0.5">{w.description}</p>
                        {w.price > 0 && <p className="text-xs font-semibold text-primary mt-2">¥{w.price}</p>}
                      </div>
                    </div>
                  ))}
                  {/* 添加作品按钮 */}
                  <div onClick={() => navigate('/publish-work')}
                    className="card aspect-[4/3] flex flex-col items-center justify-center gap-1 text-on-surface-variant/40 active:scale-[0.97] transition-all cursor-pointer border-2 border-dashed border-[#f0edea] shadow-none">
                    <span className="material-symbols-outlined text-[32px]">add</span>
                    <span className="text-xs">发布作品</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 我发布的活动 */}
          {activeTab === "hosted" && (
            <div className="pb-8">
              {myEvents.length === 0 ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/20">event</span>
                  <p className="text-sm text-on-surface-variant/50 mt-2">暂无发布的活动</p>
                  <button onClick={() => navigate('/publish-event')}
                    className="mt-4 px-6 py-2.5 bg-primary text-white rounded-full text-sm font-medium shadow-sm active:scale-95 transition-all">
                    发布活动
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {myEvents.map(e => (
                    <div key={e.id} onClick={() => navigate(`/event/${e.id}`)}
                      className="card card-hover flex items-center justify-between p-4">
                      <div>
                        <p className="font-semibold text-sm text-on-surface">{e.title}</p>
                        <p className="text-xs text-on-surface-variant/60 mt-0.5">{e.location || ''}{e.event_time ? ` · ${new Date(e.event_time).toLocaleDateString('zh-CN')}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-primary/60 font-medium">管理</span>
                        <span className="material-symbols-outlined text-on-surface-variant/30 text-[18px]">chevron_right</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 我参加的活动 */}
          {activeTab === "joined" && (
            <div className="pb-8">
              {joinedEvents.length === 0 ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/20">event_upcoming</span>
                  <p className="text-sm text-on-surface-variant/50 mt-2">暂未参加活动</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {joinedEvents.map(e => (
                    <div key={e.id} onClick={() => navigate(`/event/${e.id}`)}
                      className="card card-hover flex items-center justify-between p-4">
                      <div>
                        <p className="font-semibold text-sm text-on-surface">{e.title}</p>
                        <p className="text-xs text-on-surface-variant/60 mt-0.5">{e.location || ''}</p>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant/30 text-[18px]">chevron_right</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="编辑资料">
        <div className="space-y-3">
          <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '35vh' }}>
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="昵称"
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none border border-outline-variant/30" />
            <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="简介" rows={3}
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none border border-outline-variant/30 resize-none" />
            <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="位置"
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none border border-outline-variant/30" />
            <input type="text" value={editWebsite} onChange={e => setEditWebsite(e.target.value)} placeholder="个人网站/社交链接"
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none border border-outline-variant/30" />
            <div className="flex gap-3">
              <input type="date" value={editBirthday} onChange={e => setEditBirthday(e.target.value)}
                className="flex-1 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none border border-outline-variant/30" />
              <select value={editGender} onChange={e => setEditGender(e.target.value)}
                className="flex-1 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none border border-outline-variant/30">
                <option value="">性别</option><option value="男">男</option><option value="女">女</option>
              </select>
            </div>
          </div>
          <div className="pt-2 border-t border-outline-variant/20">
            <button onClick={handleSave} disabled={saving}
              className="w-full py-3.5 bg-[#2d7d4e] text-white rounded-full text-sm font-medium active:scale-95 transition-all disabled:opacity-50 shadow-lg">
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
