import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { chatList, chatMessages, users } from "../mocks/data";
import Avatar from "../components/common/Avatar";
import { useToast } from "../hooks/useToast";

export default function ChatRoomPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const chat = chatList.find((c) => c.id === chatId);
  const user = chat ? users[chat.userId] : null;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (chatId && chatMessages[chatId]) {
      setMessages([...chatMessages[chatId]]);
    }
  }, [chatId]);

  // 权限检查
  if (user && user.isCreator && !user.isSubscribed) {
    return (
      <main className="flex flex-col items-center justify-center h-[calc(100dvh-180px)] p-margin-mobile text-center gap-4">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant/40">lock</span>
        <h2 className="font-headline-lg text-on-surface">需要订阅才能私信</h2>
        <p className="text-on-surface-variant">订阅 {user.name} 后即可发送消息</p>
        <button
          onClick={() => navigate(`/profile/${user.id}`)}
          className="px-6 py-3 bg-primary text-white rounded-full font-label-md"
        >
          查看 {user.name} 的主页
        </button>
      </main>
    );
  }

  const sendMsg = () => {
    if (!input.trim()) return;
    console.log("发送消息:", input.trim());
    setMessages((prev) => [
      ...prev,
      {
        id: "m" + Date.now(),
        senderId: "self",
        text: input.trim(),
        time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setInput("");
    toast("消息已发送", "success");
  };

  return (
    <main className="flex flex-col h-[calc(100dvh-180px)]">
      {/* 头部 */}
      <div className="px-margin-mobile py-3 flex items-center gap-3 border-b border-surface-variant/30">
        <button onClick={() => navigate("/messages")} className="w-8 h-8 flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => navigate(`/profile/${user?.id}`)}>
          <Avatar name={user?.avatar || ""} size="w-10 h-10" />
          <div>
            <p className="font-label-md text-label-md">{user?.name || "聊天"}</p>
            <p className="text-[11px] text-on-surface-variant">在线</p>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-margin-mobile flex flex-col gap-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderId === "self" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] p-3 rounded-2xl ${
                msg.senderId === "self"
                  ? "bg-primary text-white rounded-br-md"
                  : "bg-surface-container-low text-on-surface rounded-bl-md"
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <p className={`text-[10px] mt-1 ${msg.senderId === "self" ? "text-white/70" : "text-on-surface-variant/60"}`}>{msg.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 输入框 */}
      <div className="px-margin-mobile py-3 bg-white/80 backdrop-blur-xl border-t border-surface-variant/20">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-surface-container-low rounded-full px-4 py-2 border border-outline-variant/30">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMsg()}
              placeholder="说点什么..."
              className="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md outline-none"
            />
          </div>
          <button onClick={sendMsg} className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg active:scale-95">
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </div>
      </div>
    </main>
  );
}
