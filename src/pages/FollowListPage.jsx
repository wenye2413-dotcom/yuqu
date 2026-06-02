import { useNavigate, useSearchParams } from "react-router-dom";
import { users } from "../mocks/data";
import Avatar from "../components/common/Avatar";

export default function FollowListPage({ type }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const name = searchParams.get("name") || "";

  const titles = {
    followers: "粉丝",
    following: "关注",
    subscriptions: "订阅",
  };

  // Mock 列表数据
  const listData = {
    followers: [
      { ...users.u1, relation: "互相关注" },
      { ...users.u5, relation: "已关注" },
      { ...users.u3, relation: "已关注" },
    ],
    following: [
      { ...users.u2, relation: "互相关注" },
      { ...users.u5, relation: "已关注" },
      { ...users.u6, relation: "已订阅" },
    ],
    subscriptions: [
      { ...users.u6, relation: "订阅中 · $2.99/月" },
      { ...users.u4, relation: "已订阅" },
    ],
  };

  const list = listData[type] || [];

  return (
    <main className="pb-4">
      <div className="px-margin-mobile py-3 flex items-center gap-2 border-b border-surface-variant/20">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="font-label-md text-label-md">{name ? `${name} 的` : "我的"}{titles[type]}</span>
        <span className="text-sm text-on-surface-variant">({list.length})</span>
      </div>

      <div className="px-margin-mobile flex flex-col gap-2 mt-2">
        {list.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(`/profile/${item.id}`)}
            className="flex items-center gap-3 bg-white/80 rounded-xl p-4 border border-white/40 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <Avatar name={item.avatar} size="w-12 h-12" />
            <div className="flex-1">
              <p className="font-label-md text-label-md text-on-surface">{item.name}</p>
              <p className="text-xs text-on-surface-variant">{item.relation}</p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant/40">chevron_right</span>
          </div>
        ))}
      </div>
    </main>
  );
}
