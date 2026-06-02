import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { users, userChatMap } from "../mocks/data";
import { useToast } from "../hooks/useToast";
import Avatar from "../components/common/Avatar";
import { getGradientBg } from "../hooks/utils";

export default function NewChatPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [search, setSearch] = useState("");

  const userList = Object.values(users);
  const filtered = search
    ? userList.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()))
    : userList;

  const handleSelect = (u) => {
    const chatId = userChatMap[u.id];
    if (chatId) {
      navigate(`/chat/${chatId}`);
    } else {
      toast("该用户暂无对话，请先在消息页面发起互动", "info");
    }
  };

  return (
    <main className="px-margin-mobile pb-8">
      <div className="flex items-center gap-2 py-3 mb-4">
        <button onClick={() => navigate("/messages")} className="w-8 h-8 flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="font-headline-lg text-headline-lg text-on-surface">新建对话</span>
      </div>

      {/* 搜索 */}
      <div className="bg-surface-container-low rounded-full px-4 py-2 flex items-center gap-2 border border-outline-variant/30 mb-4">
        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索用户..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-on-surface outline-none"
        />
      </div>

      {/* 用户列表 */}
      <div className="flex flex-col gap-2">
        {filtered.map((u) => (
          <div
            key={u.id}
            onClick={() => handleSelect(u)}
            className="flex items-center gap-3 bg-white/80 backdrop-blur-xl rounded-xl px-4 py-3 border border-white/40 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
          >
            <Avatar name={u.avatar} size="w-12 h-12" />
            <div className="flex-1 min-w-0">
              <p className="font-label-md text-label-md text-on-surface">{u.name}</p>
              <p className="text-xs text-on-surface-variant truncate">{u.bio || " "}</p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant/40 text-[20px]">chevron_right</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-on-surface-variant text-center py-8">未找到用户</p>
        )}
      </div>
    </main>
  );
}
