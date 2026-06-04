import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import { useAuth } from "../context/AuthContext"
import { formatDistance } from "../hooks/useLocation"
import Avatar from "../components/common/Avatar"

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [notifs, setNotifs] = useState([])
  const [profiles, setProfiles] = useState({})

  useEffect(() => {
    fetchNotifs()
    fetchProfiles()

    // 实时订阅新通知
    const channel = supabase
      .channel('notif-live')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.id}` },
        () => { fetchNotifs() }
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user?.id])

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("id, name")
    if (data) {
      const map = {}
      data.forEach(p => { map[p.id] = p })
      setProfiles(map)
    }
  }

  const fetchNotifs = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(50)
    if (data) setNotifs(data)

    // 标记已读
    await supabase.from("notifications").update({ read: true }).eq("user_id", user?.id).eq("read", false)
  }

  const formatTime = (ts) => {
    if (!ts) return ""
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "刚刚"
    if (mins < 60) return `${mins}分钟前`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}天前`
    return new Date(ts).toLocaleDateString("zh-CN")
  }

  const getActorName = (actorId) => profiles[actorId]?.name || "用户"

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-margin-mobile">
        <div className="flex items-center gap-2 pt-3 pb-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="font-headline-lg-mobile font-bold">通知</h2>
        </div>

        {notifs.length === 0 && (
          <p className="text-sm text-on-surface-variant text-center py-20">暂无通知</p>
        )}

        <div className="flex flex-col gap-1">
          {notifs.map((n) => (
            <div key={n.id} onClick={() => navigate(`/messages`)}
              className={`flex items-start gap-3 px-3 py-3 rounded-xl cursor-pointer active:scale-[0.98] transition-all ${!n.read ? 'bg-primary/5' : ''}`}>
              <Avatar name={n.actor_id || 'U'} size="w-10 h-10" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-on-surface">
                  <span className="font-semibold">{getActorName(n.actor_id)}</span>
                  {n.type === 'reply' && <span className="text-on-surface-variant"> 回复了你</span>}
                </p>
                <p className="text-xs text-on-surface-variant/60 mt-0.5">{formatTime(n.created_at)}</p>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
