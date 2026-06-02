import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { users, currentUser, chatList } from "../mocks/data";
import Avatar from "../components/common/Avatar";
import Modal from "../components/common/Modal";
import { useToast } from "../hooks/useToast";
import { getAvatarUrl } from "../hooks/utils";
import { supabase } from "../supabaseClient";

export default function UserProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // 优先从 mock users 查找，然后从 Supabase profiles 表查询
  const mockUser = users?.[userId];

  useEffect(() => {
    async function fetchUserProfile() {
      setLoading(true);
      // 如果 mock 数据中有，先用 mock 数据
      if (mockUser) {
        setProfileData({
          id: userId,
          name: mockUser.name,
          bio: mockUser.bio,
          avatar: mockUser.avatar,
          avatar_url: mockUser.avatar_url || getAvatarUrl(mockUser.name),
          isCreator: mockUser.isCreator,
          price: mockUser.price || 0,
          followers: mockUser.followers || 0,
          following: mockUser.following || 0,
          isSubscribed: mockUser.isSubscribed || false,
          isFollowing: mockUser.isFollowing || false,
          from: "mock",
        });
        setLoading(false);
        return;
      }

      // 从 Supabase profiles 表查询真实用户数据
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (error) {
          console.error("获取用户资料失败:", error.message);
          setNotFound(true);
          setLoading(false);
          return;
        }

        if (data) {
          setProfileData({
            id: data.id,
            name: data.name || "User",
            bio: data.bio || "",
            avatar: data.name || "User",
            avatar_url: data.avatar_url || getAvatarUrl(data.name || "User"),
            isCreator: false,
            price: 0,
            followers: 0,
            following: 0,
            isSubscribed: false,
            isFollowing: false,
            from: "supabase",
          });
        } else {
          // 再尝试查询 mock users 以外还有没有其他用户（比如 auth.users）
          // 尝试从 activity_log 或 posts 中找这个用户的信息
          const { data: postData } = await supabase
            .from("posts")
            .select("user_id")
            .eq("user_id", userId)
            .limit(1);
          if (postData && postData.length > 0) {
            setProfileData({
              id: userId,
              name: "用户",
              bio: "",
              avatar: "User",
              avatar_url: getAvatarUrl("User"),
              isCreator: false,
              price: 0,
              followers: 0,
              following: 0,
              isSubscribed: false,
              isFollowing: false,
              from: "supabase",
            });
          } else {
            setNotFound(true);
          }
        }
      } catch (err) {
        console.error("查询用户资料出错:", err.message);
        setNotFound(true);
      }
      setLoading(false);
    }

    fetchUserProfile();
  }, [userId]);

  const [subscribed, setSubscribed] = useState(false);
  const [following, setFollowing] = useState(false);
  const [subModal, setSubModal] = useState(false);

  // 当 profileData 加载后，同步状态
  useEffect(() => {
    if (profileData) {
      setSubscribed(profileData.isSubscribed || false);
      setFollowing(profileData.isFollowing || false);
    }
  }, [profileData]);

  if (loading) {
    return (
      <main className="p-margin-mobile text-center">
        <p className="text-on-surface-variant">加载中...</p>
      </main>
    );
  }

  if (notFound || !profileData) {
    return (
      <main className="p-margin-mobile text-center">
        <p className="text-on-surface-variant">用户不存在</p>
        <button onClick={() => navigate(-1)} className="text-primary mt-4">返回</button>
      </main>
    );
  }

  const user = profileData;

  const handleSubscribe = () => {
    if (subscribed) return;
    if (user.price === 0) {
      setSubscribed(true);
      toast(`已关注 ${user.name}`, "success");
    } else {
      setSubModal(true);
    }
  };

  const confirmSubscribe = () => {
    setSubscribed(true);
    setSubModal(false);
    toast(`🎉 订阅 ${user.name} 成功`, "success");
  };

  const handleFollow = () => {
    setFollowing((prev) => !prev);
    toast(following ? `已取消关注 ${user.name}` : `已关注 ${user.name}`, "info");
  };

  // 私信：查找或创建聊天映射
  const getChatId = () => {
    const existing = chatList.find((c) => c.userId === userId);
    return existing ? existing.id : `chat_${userId}`;
  };

  const handlePrivateMessage = () => {
    if (!subscribed && user.isCreator) {
      toast("订阅后可私信该创作者", "info");
      return;
    }
    navigate(`/chat/${getChatId()}`);
  };

  return (
    <main className="pb-6">
      {/* 返回按钮 */}
      <div className="px-margin-mobile py-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </div>

      {/* 用户头部 */}
      <div className="px-margin-mobile">
        <div className="flex items-center gap-4 mb-4">
          <Avatar name={user.avatar} size="w-20 h-20" className="border-4 border-white shadow-xl" />
          <div className="flex-1">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">{user.name}</h1>
            <p className="font-body-md text-on-surface-variant">{user.bio}</p>
          </div>
        </div>

        {/* 统计可点击 */}
        <div className="flex gap-4 mb-4 bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-white/40 shadow-sm">
          <button onClick={() => navigate(`/followers?name=${user.name}`)} className="flex-1 text-center active:scale-95 transition-transform">
            <p className="font-bold text-headline-lg-mobile text-on-surface">{user.followers}</p>
            <p className="text-[11px] text-on-surface-variant">粉丝</p>
          </button>
          <button onClick={() => navigate(`/following?name=${user.name}`)} className="flex-1 text-center border-x border-outline-variant/20 active:scale-95 transition-transform">
            <p className="font-bold text-headline-lg-mobile text-on-surface">{user.following}</p>
            <p className="text-[11px] text-on-surface-variant">关注</p>
          </button>
          <button onClick={() => navigate(`/subscriptions?name=${user.name}`)} className="flex-1 text-center active:scale-95 transition-transform">
            <p className="font-bold text-headline-lg-mobile text-on-surface">--</p>
            <p className="text-[11px] text-on-surface-variant">订阅</p>
          </button>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          {user.isCreator && (
            <button
              onClick={handleSubscribe}
              className={`flex-1 py-3 rounded-full font-label-md text-label-md shadow-lg active:scale-95 transition-all ${
                subscribed
                  ? "bg-primary-container/50 text-on-primary-container border-2 border-primary-container"
                  : "bg-primary text-white shadow-primary/30"
              }`}
            >
              {subscribed ? `✅ 已订阅 $${user.price}/月` : `订阅 · $${user.price}/月`}
            </button>
          )}
          {!user.isCreator && (
            <button
              onClick={handleFollow}
              className={`flex-1 py-3 rounded-full font-label-md text-label-md active:scale-95 transition-all ${
                following ? "bg-surface-container text-on-surface border border-outline" : "bg-primary text-white"
              }`}
            >
              {following ? "已关注" : "关注"}
            </button>
          )}
          {/* 私信按钮 — 始终显示，权限检查在点击时 */}
          <button
            onClick={handlePrivateMessage}
            className={`flex-1 py-3 rounded-full font-label-md text-label-md border active:scale-95 transition-all ${
              subscribed || !user.isCreator
                ? "bg-secondary text-on-secondary border-secondary"
                : "bg-surface-container-low text-on-surface-variant border-outline-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[18px] align-middle">chat</span>
            {" 私信"}
          </button>
        </div>
      </div>

      {/* 订阅支付弹窗 */}
      <Modal open={subModal} onClose={() => setSubModal(false)} title="订阅创作者">
        <div className="flex flex-col gap-4">
          <div className="bg-surface-container-low rounded-xl p-4 text-center">
            <Avatar name={user.avatar} size="w-16 h-16" className="mx-auto mb-3" />
            <p className="font-label-md mb-1">{user.name}</p>
            <p className="font-headline-xl text-headline-xl text-primary font-bold">
              ${user.price}
              <span className="text-sm text-on-surface-variant">/月</span>
            </p>
            <p className="text-sm text-on-surface-variant mt-2">解锁私信和专属内容</p>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-3 bg-surface-container-low rounded-xl p-3 cursor-pointer border-2 border-primary">
              <input type="radio" name="payment" defaultChecked className="accent-primary" />
              <span className="flex-1 font-label-md">微信支付 (模拟)</span>
            </label>
            <label className="flex items-center gap-3 bg-surface-container-low rounded-xl p-3 cursor-pointer">
              <input type="radio" name="payment" className="accent-primary" />
              <span className="flex-1 font-label-md">支付宝 (模拟)</span>
            </label>
          </div>
          <button onClick={confirmSubscribe} className="w-full py-3.5 bg-primary text-white font-label-md rounded-full shadow-lg active:scale-95">
            确认订阅 · ${user.price}/月
          </button>
        </div>
      </Modal>
    </main>
  );
}
