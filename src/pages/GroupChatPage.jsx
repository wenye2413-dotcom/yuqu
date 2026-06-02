import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { users } from "../mocks/data";
import { useShare } from "../hooks/useShare";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import Avatar from "../components/common/Avatar";

export default function GroupChatPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { share } = useShare();
  const toast = useToast();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [profiles, setProfiles] = useState({});
  const [announcement, setAnnouncement] = useState("");
  const messagesEndRef = useRef(null);

  // 获取群组信息
  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  // 获取群消息 & 实时订阅
  useEffect(() => {
    if (!groupId) return;
    fetchMessages();

    const channel = supabase
      .channel(`group_messages:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const newMsg = payload.new;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, mapMessage(newMsg)];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 获取所有 profiles 用于显示用户名/头像
  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchGroup = async () => {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .maybeSingle();
    if (error) {
      console.error("获取群组失败:", error.message);
      return;
    }
    if (data) {
      setGroup(data);
      setAnnouncement(data.announcement || "");
    }
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("*");
    if (data) {
      const map = {};
      data.forEach((p) => { map[p.id] = p; });
      setProfiles(map);
    }
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("group_messages")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("获取群消息失败:", error.message);
      return;
    }
    if (data) {
      setMessages(data.map(mapMessage));
    }
  };

  const mapMessage = (msg) => ({
    id: msg.id,
    senderId: msg.user_id,
    text: msg.content,
    created_at: msg.created_at,
    time: formatRelativeTime(msg.created_at),
  });

  function formatRelativeTime(ts) {
    if (!ts) return "";
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "刚刚";
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    if (hours < 48) return "昨天";
    return `${Math.floor(hours / 24)}天前`;
  }

  const getSenderName = (senderId) => {
    const p = profiles[senderId];
    if (p?.name) return p.name;
    const mockUser = Object.values(users).find((u) => u.id === senderId);
    return mockUser?.name || "用户";
  };

  const getSenderAvatar = (senderId) => {
    const p = profiles[senderId];
    if (p?.name) return p.name;
    const mockUser = Object.values(users).find((u) => u.id === senderId);
    return mockUser?.avatar || "User";
  };

  const sendMsg = async () => {
    if (!input.trim() || sending || !user) return;
    setSending(true);
    const { error } = await supabase.from("group_messages").insert({
      group_id: groupId,
      user_id: user.id,
      content: input.trim(),
    });
    setSending(false);
    if (error) {
      console.error("发送群消息失败:", error.message);
      toast("发送失败", "error");
      return;
    }
    setInput("");
    // 实时订阅会处理新消息，但再手动拉一次确保同步
    fetchMessages();
  };

  if (!group && groupId) {
    return <main className="p-margin-mobile text-center text-on-surface-variant">加载中...</main>;
  }

  return (
    <main className="flex flex-col h-[calc(100dvh-180px)]">
      {/* Header */}
      <div className="px-margin-mobile py-3 flex items-center gap-3 border-b border-surface-variant/30">
        <button onClick={() => navigate("/groups")} className="w-8 h-8 flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <Avatar name={group?.name || "群组"} size="w-10 h-10" />
        <div className="flex-1">
          <p className="font-label-md text-label-md">{group?.name || "群聊"}</p>
          <p className="text-[11px] text-on-surface-variant">{group?.member_count || "0"} 位成员</p>
        </div>
        <button
          onClick={() => share(`加入「${group?.name}」`, "", `/group-chat/${groupId}`)}
          className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined">share</span>
        </button>
        <button className="w-8 h-8 flex items-center justify-center" onClick={() => navigate(`/group-settings/${groupId}`)}>
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>

      {/* 公告 */}
      {announcement && (
        <div className="mx-margin-mobile mt-2 bg-primary-container/10 rounded-xl p-3 border border-primary-container/30">
          <p className="text-label-sm text-primary font-bold mb-1">📢 群公告</p>
          <p className="text-xs text-on-surface-variant">{announcement}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-margin-mobile flex flex-col gap-3">
        {messages.map((msg) => {
          const isSelf = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] ${isSelf ? "items-end" : "items-start"}`}>
                <p className="text-[11px] text-on-surface-variant/60 mb-1 px-1">{isSelf ? "我" : getSenderName(msg.senderId)}</p>
                <div className={`rounded-xl p-3 ${isSelf ? "bg-primary text-white" : "bg-surface-container-low"}`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${isSelf ? "text-white/60" : "text-on-surface-variant/60"}`}>{msg.time}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-margin-mobile py-3 bg-white/80 backdrop-blur-xl border-t border-surface-variant/20">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-surface-container-low rounded-full px-4 py-2 border border-outline-variant/30">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMsg()}
              placeholder="发送群消息..."
              className="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md outline-none"
            />
          </div>
          <button
            onClick={sendMsg}
            disabled={!input.trim() || sending}
            className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </div>
      </div>
    </main>
  );
}
