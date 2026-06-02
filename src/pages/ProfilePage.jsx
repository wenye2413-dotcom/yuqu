import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { currentUser, events } from "../mocks/data";
import Avatar from "../components/common/Avatar";
import Modal from "../components/common/Modal";
import { useToast } from "../hooks/useToast";
import { useShare } from "../hooks/useShare";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { getAvatarUrl, getGradientBg, getLevelFromEnergy, getLevelMaxEnergy, getLevelBadgeClasses, getLevelIcon } from "../hooks/utils";
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
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("portfolio");
  const [editOpen, setEditOpen] = useState(searchParams.get("edit") === "1");
  const [editName, setEditName] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editBirthday, setEditBirthday] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const avatarFileRef = useRef(null);

  const hostedEvents = events.filter((e) => currentUser.hostedEvents.includes(e.id));
  const joinedEvents = events.filter((e) => currentUser.joinedEvents.includes(e.id));
  const displayName = profile?.name || user?.email?.split("@")[0] || "User";
  const avatarSrc = profile?.avatar_url || getAvatarUrl(user?.email || "User");
  const userEnergy = currentUser.energy || 0;
  const userLevel = getLevelFromEnergy(userEnergy);
  const levelMax = getLevelMaxEnergy(userLevel.id);

  const handleStatClick = (type) => {
    navigate(`/${type}`);
  };

  const openEdit = () => {
    setEditName(profile?.name || user?.email?.split("@")[0] || "");
    setEditGender(profile?.gender || "");
    setEditBirthday(profile?.birthday || "");
    setEditLocation(profile?.location || "");
    setEditBio(profile?.bio || "");
    setEditAvatar(null);
    setEditPreview(null);
    setEditOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("请选择图片文件", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast("图片不能超过 2MB", "error");
      return;
    }
    setEditAvatar(file);
    setEditPreview(URL.createObjectURL(file));
  };

  // 头像直接上传（点击头像触发）
  const handleAvatarDirectUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("请选择图片文件", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast("图片不能超过 2MB", "error");
      return;
    }

    setSaving(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadErr) {
        toast("头像上传失败: " + uploadErr.message, "error");
        setSaving(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: metaErr } = await supabase.auth.updateUser({
        data: {
          name: profile?.name || user?.email?.split("@")[0] || "User",
          avatar_url: publicUrl,
          gender: profile?.gender || "",
          birthday: profile?.birthday || "",
          location: profile?.location || "",
          bio: profile?.bio || "",
        },
      });
      if (metaErr) {
        toast("保存失败: " + metaErr.message, "error");
        return;
      }

      // 同步写入 profiles 表
      await supabase.from("profiles").upsert({
        id: user.id,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

      toast("头像已更新", "success");
      refreshProfile();
    } catch (err) {
      toast("上传失败: " + err.message, "error");
    } finally {
      setSaving(false);
      if (avatarFileRef.current) avatarFileRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      toast("昵称不能为空", "error");
      return;
    }
    setSaving(true);
    try {
      let avatarUrl = profile?.avatar_url || null;

      if (editAvatar) {
        const ext = editAvatar.name.split(".").pop();
        const filePath = `${user.id}/avatar.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(filePath, editAvatar, { upsert: true });
        if (uploadErr) {
          toast("头像上传失败: " + uploadErr.message, "error");
          setSaving(false);
          return;
        }
        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);
        avatarUrl = publicUrl;
      }

      const { error: metaErr } = await supabase.auth.updateUser({
        data: {
          name: editName.trim(),
          gender: editGender,
          birthday: editBirthday,
          location: editLocation.trim(),
          bio: editBio.trim(),
          avatar_url: avatarUrl,
        },
      });
      if (metaErr) {
        toast("保存失败: " + metaErr.message, "error");
        setSaving(false);
        return;
      }

      // 同步写入 profiles 表
      await supabase.from("profiles").upsert({
        id: user.id,
        name: editName.trim(),
        gender: editGender,
        birthday: editBirthday,
        location: editLocation.trim(),
        bio: editBio.trim(),
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

      toast("资料已更新", "success");
      setEditOpen(false);
      refreshProfile();
    } catch (err) {
      toast("保存失败: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
    <main className="pb-4">
      {/* 用户头部 */}
      <div className="px-margin-mobile pt-2">
        <div className="flex items-start gap-4 mb-4">
          {/* 点击头像上传新头像 */}
          <div
            onClick={() => avatarFileRef.current?.click()}
            className="relative group cursor-pointer shrink-0"
          >
            <Avatar
              name={displayName}
              src={avatarSrc}
              size="w-20 h-20"
              className="border-4 border-white shadow-xl"
            />
            <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-white text-2xl">camera_alt</span>
            </div>
          </div>
          <input
            ref={avatarFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarDirectUpload}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-headline-lg text-headline-lg text-on-surface">{displayName}</h1>
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${getLevelBadgeClasses(userLevel.id)}`}>
                <span className="material-symbols-outlined text-[12px]">{getLevelIcon(userLevel.id)}</span>
                {userLevel.name}
              </span>
            </div>
            <p className="font-body-md text-on-surface-variant">@{user?.email?.split("@")[0] || "user"}</p>
            <p className="font-body-md text-sm text-on-surface-variant mt-1">{profile?.bio || "这个人很懒，什么都没写"}</p>
          </div>
          <div className="cursor-pointer active:scale-95 transition-transform" onClick={() => {
            const shareUrl = `${window.location.origin}/#/profile/${user?.id || currentUser.id}`;
            navigator.clipboard?.writeText(shareUrl)
              .then(() => toast("主页链接已复制", "success"))
              .catch(() => toast("分享链接: " + shareUrl, "info"));
          }}>
            <EnergyRing energy={userEnergy} maxEnergy={levelMax} size={56} />
          </div>
        </div>

        {/* 统计 */}
        <div className="flex gap-4 mb-4 bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-white/40 shadow-sm">
          <button onClick={() => handleStatClick("followers")} className="flex-1 text-center active:scale-95 transition-transform">
            <p className="font-bold text-headline-lg-mobile text-on-surface">{currentUser.stats.followers}</p>
            <p className="text-[11px] text-on-surface-variant">粉丝</p>
          </button>
          <button onClick={() => handleStatClick("following")} className="flex-1 text-center border-x border-outline-variant/20 active:scale-95 transition-transform">
            <p className="font-bold text-headline-lg-mobile text-on-surface">{currentUser.stats.following}</p>
            <p className="text-[11px] text-on-surface-variant">关注</p>
          </button>
          <button onClick={() => handleStatClick("subscriptions")} className="flex-1 text-center active:scale-95 transition-transform">
            <p className="font-bold text-headline-lg-mobile text-on-surface">{currentUser.stats.subscribed}</p>
            <p className="text-[11px] text-on-surface-variant">订阅</p>
          </button>
        </div>

        {/* 编辑资料 */}
        <button
          onClick={openEdit}
          className="w-full py-3 bg-surface-container-low text-on-surface rounded-full font-label-md text-label-md border border-outline-variant/30 active:scale-95 transition-all mb-3"
        >
          编辑资料
        </button>

        {/* Subscribe Me */}
        <button
          onClick={() => setSubModalOpen(true)}
          className="w-full py-3.5 bg-primary text-white rounded-full font-label-md text-label-md shadow-lg shadow-primary/30 active:scale-95 transition-all"
        >
          Subscribe Me · ${currentUser.price}/月
        </button>
      </div>

      {/* Tab 切换 */}
      <div className="px-margin-mobile mt-6">
        <div className="flex gap-1 bg-surface-container-low rounded-xl p-1 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white text-on-surface shadow-sm"
                  : "text-on-surface-variant"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "portfolio" && (
          <div className="grid grid-cols-3 gap-3">
            {currentUser.portfolio.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/works/${item.id}`)}
                className="rounded-lg overflow-hidden cursor-pointer group active:scale-95 transition-transform"
              >
                <div className={`aspect-square bg-gradient-to-br ${getGradientBg(item.title)} flex items-center justify-center relative`}>
                  <span className="material-symbols-outlined text-white text-3xl opacity-60">photo_camera</span>
                  <div className="absolute bottom-1 left-1 right-1 flex items-center justify-around gap-1 bg-black/30 rounded-full px-1.5 py-0.5">
                    <div className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[10px] text-white">favorite</span>
                      <span className="text-[10px] text-white font-bold">{item.likes}</span>
                    </div>
                    {item.comments !== undefined && (
                      <div className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[10px] text-white">chat_bubble</span>
                        <span className="text-[10px] text-white font-bold">{item.comments}</span>
                      </div>
                    )}
                    {item.purchases !== undefined && (
                      <div className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[10px] text-white">shopping_cart</span>
                        <span className="text-[10px] text-white font-bold">{item.purchases}</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1 truncate">{item.title}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "hosted" && (
          <div className="flex flex-col gap-3">
            {hostedEvents.length === 0 && (
              <p className="text-sm text-on-surface-variant text-center py-8">暂无发布的活动</p>
            )}
            {hostedEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => navigate(`/event/${event.id}`)}
                className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-white/40 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-container to-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-white text-2xl">event</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-label-md text-label-md font-semibold text-on-surface truncate">{event.title}</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">{event.location}</p>
                    <p className="text-xs text-on-surface-variant/60">{event.time}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); share(`活动: ${event.title}`, `${event.desc}`, `/event/${event.id}`); }}
                    className="w-8 h-8 flex items-center justify-center text-on-surface-variant/40 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">share</span>
                  </button>
                  <span className="material-symbols-outlined text-on-surface-variant/40">chevron_right</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "joined" && (
          <div className="flex flex-col gap-3">
            {joinedEvents.length === 0 && (
              <p className="text-sm text-on-surface-variant text-center py-8">暂未参加活动</p>
            )}
            {joinedEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => navigate(`/event/${event.id}`)}
                className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-white/40 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-white text-2xl">groups</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-label-md text-label-md font-semibold text-on-surface truncate">{event.title}</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">{event.location}</p>
                    <p className="text-xs text-on-surface-variant/60">{event.time}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); share(`活动: ${event.title}`, `${event.desc}`, `/event/${event.id}`); }}
                    className="w-8 h-8 flex items-center justify-center text-on-surface-variant/40 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">share</span>
                  </button>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      已报名
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscribe 设置弹窗 */}
      <Modal open={subModalOpen} onClose={() => setSubModalOpen(false)} title="订阅设置">
        <div className="flex flex-col gap-4 items-center text-center">
          <Avatar name={displayName} src={avatarSrc} size="w-20 h-20" className="border-4 border-white shadow-xl" />
          <p className="font-label-md text-label-md">{displayName}</p>
          <div className="bg-surface-container-low rounded-xl p-6 w-full flex flex-col items-center gap-3">
            <div className="w-40 h-40 bg-white rounded-xl border-2 border-outline-variant flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant/40">qr_code</span>
            </div>
            <p className="text-xs text-on-surface-variant">收款码 (模拟)</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4 w-full">
            <p className="font-label-md text-label-md text-primary">${currentUser.price}/月</p>
            <p className="text-xs text-on-surface-variant mt-1">订阅者可解锁私信和专属内容</p>
          </div>
          <button
            onClick={() => {
              setSubModalOpen(false);
              toast("订阅设置已保存", "success");
            }}
            className="w-full py-3 bg-primary text-white font-label-md rounded-full shadow-lg active:scale-95"
          >
            完成设置
          </button>
        </div>
      </Modal>

      {/* 编辑资料弹窗 */}
      <Modal open={editOpen} onClose={() => !saving && setEditOpen(false)} title="编辑资料">
        <div className="flex flex-col gap-5">
          {/* 头像 */}
          <div className="flex flex-col items-center gap-3">
            <div
              onClick={() => fileRef.current?.click()}
              className="relative group cursor-pointer"
            >
              <img
                src={editPreview || avatarSrc}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl"
              />
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-white text-3xl">camera_alt</span>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="text-sm text-primary font-medium"
            >
              点击更换头像
            </button>
          </div>

          {/* 昵称 */}
          <div>
            <label className="text-sm text-on-surface-variant mb-1 block">昵称</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={30}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
              placeholder="输入你的昵称"
            />
          </div>

          {/* 性别 */}
          <div>
            <label className="text-sm text-on-surface-variant mb-2 block">性别</label>
            <div className="flex gap-3">
              {["男", "女", "保密"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setEditGender(editGender === g ? "" : g)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    editGender === g
                      ? "bg-primary text-white border-primary"
                      : "bg-surface-container-low text-on-surface-variant border-outline-variant/30"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* 生日 */}
          <div>
            <label className="text-sm text-on-surface-variant mb-1 block">生日</label>
            <input
              type="date"
              value={editBirthday}
              onChange={(e) => setEditBirthday(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface [color-scheme:light]"
            />
          </div>

          {/* 所在地 */}
          <div>
            <label className="text-sm text-on-surface-variant mb-1 block">所在地</label>
            <input
              type="text"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              maxLength={50}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
              placeholder="城市 / 地区"
            />
          </div>

          {/* 个性签名 */}
          <div>
            <label className="text-sm text-on-surface-variant mb-1 block">个性签名</label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              maxLength={200}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface resize-none"
              placeholder="介绍一下自己..."
            />
          </div>

          {/* 保存 */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-primary text-white font-label-md rounded-full shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </Modal>
    </main></div>
  );
}
