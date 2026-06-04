import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useLocation, calcDistance, formatDistance } from "../hooks/useLocation";
import Avatar from "../components/common/Avatar";

export default function LocationChatRoomPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location: myPos } = useLocation();
  const [chat, setChat] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    supabase.from("location_chats").select("*").eq("id", chatId).single().then(({ data }) => {
      if (data) setChat(data);
    });
    fetchMsgs();
    supabase.from("profiles").select("id, name").then(({ data }) => {
      if (data) {
        const m = {};
        data.forEach(p => { m[p.id] = p; });
        setProfiles(m);
      }
    });
  }, [chatId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs]);

  const fetchMsgs = () => {
    supabase.from("location_messages").select("*").eq("chat_id", chatId).order("created_at", { ascending: true }).then(({ data }) => {
      if (data) setMsgs(data);
    });
  };

  // 实时订阅新消息
  useEffect(() => {
    const channel = supabase.channel(`loc-${chatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'location_messages', filter: `chat_id=eq.${chatId}` }, fetchMsgs)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [chatId]);

  const sendMsg = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    await supabase.from("location_messages").insert({
      chat_id: chatId, user_id: user.id, content: input.trim(),
      user_lat: myPos?.lat || null, user_lng: myPos?.lng || null,
    });
    setSending(false);
    setInput("");
    fetchMsgs();
  };

  const dist = (chat && myPos) ? calcDistance(myPos.lat, myPos.lng, chat.latitude, chat.longitude) : null;

  return (
    <main className="h-full flex flex-col bg-background">
      {/* 头部 */}
      <div className="px-margin-mobile py-3 flex items-center gap-2 border-b border-surface-variant/20 bg-white/80 backdrop-blur shrink-0">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-on-surface truncate">{chat?.name || "加载中..."}</p>
          {chat && (
            <div className="flex items-center gap-2 text-[10px] text-on-surface-variant/60">
              {chat.location_text && <span>📍 {chat.location_text}</span>}
              {dist !== null && <span>· {formatDistance(dist)}</span>}
            </div>
          )}
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-margin-mobile py-3">
        {msgs.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/20">forum</span>
            <p className="text-sm text-on-surface-variant/50 mt-2">暂无讨论，来做第一个发言的人</p>
          </div>
        )}
        <div className="space-y-3">
          {msgs.map((m) => {
            const fromHere = (m.user_lat && myPos) ? calcDistance(myPos.lat, myPos.lng, m.user_lat, m.user_lng) : null;
            const fromLocation = (m.user_lat && chat) ? calcDistance(chat.latitude, chat.longitude, m.user_lat, m.user_lng) : null;
            const isMe = m.user_id === user?.id;
            return (
              <div key={m.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                <Avatar name={m.user_id || 'U'} size="w-8 h-8" className="mt-0.5" />
                <div className={`max-w-[75%] ${isMe ? 'items-end' : ''}`}>
                  <div className={`rounded-2xl px-3.5 py-2.5 text-sm ${isMe ? 'bg-primary text-white rounded-br-md' : 'bg-white shadow-sm border border-white/40 rounded-bl-md'}`}>
                    <p>{m.content}</p>
                  </div>
                  <div className={`flex gap-2 mt-0.5 ${isMe ? 'justify-end' : ''}`}>
                    {fromLocation !== null && (
                      <span className="text-[9px] text-on-surface-variant/40">
                        {fromLocation < 50 ? '📍 在场' : `距此地 ${formatDistance(fromLocation)}`}
                      </span>
                    )}
                    {fromHere !== null && !isMe && (
                      <span className="text-[9px] text-on-surface-variant/40">
                        · 距你 {formatDistance(fromHere)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* 输入框 */}
      <div className="shrink-0 px-margin-mobile py-3 bg-white/80 backdrop-blur border-t border-surface-variant/20">
        <div className="flex items-center gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMsg()}
            placeholder="说点什么..."
            className="flex-1 bg-surface-container-low rounded-full px-4 py-2.5 text-sm outline-none border-none" />
          <button onClick={sendMsg} disabled={!input.trim() || sending}
            className="w-9 h-9 flex items-center justify-center bg-primary text-white rounded-full disabled:opacity-40 active:scale-90 transition-all">
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
          </button>
        </div>
      </div>
    </main>
  );
}
