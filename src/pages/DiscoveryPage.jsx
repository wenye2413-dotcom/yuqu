import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EventCard from "../components/discovery/EventCard";
import Avatar from "../components/common/Avatar";
import { useToast } from "../hooks/useToast";
import { supabase } from "../supabaseClient";

const tabs = [
  { key: "events", label: "活动" },
  { key: "groups", label: "群组" },
  { key: "people", label: "用户" },
];

export default function DiscoveryPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("events");
  const [searchQuery, setSearchQuery] = useState("");

  const [events, setEvents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [people, setPeople] = useState([]);

  useEffect(() => {
    supabase.from("events").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setEvents(data);
    });
    supabase.from("groups").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setGroups(data);
    });
    supabase.from("profiles").select("*").order("name", { ascending: true }).then(({ data }) => {
      if (data) setPeople(data);
    });
  }, []);

  const filteredEvents = searchQuery
    ? events.filter(e => e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || e.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    : events;

  const filteredGroups = searchQuery
    ? groups.filter(g => g.name?.toLowerCase().includes(searchQuery.toLowerCase()) || g.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    : groups;

  const filteredPeople = searchQuery
    ? people.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : people;

  return (
    <div className="h-full flex flex-col bg-[#fcf9f8]">
      <div className="px-margin-mobile pt-3 pb-2 shrink-0">
        {/* 搜索框 */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">search</span>
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索活动、群组或用户..."
            className="w-full bg-white rounded-full pl-10 pr-4 py-2.5 text-sm outline-none border border-[#f0edea] focus:border-primary/30 transition-colors" />
        </div>
      </div>

      {/* Tab */}
      <div className="px-margin-mobile pb-2 shrink-0">
        <div className="flex gap-1 bg-surface-container-low/50 rounded-xl p-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === t.key ? 'bg-white shadow-sm text-on-surface' : 'text-on-surface-variant/60'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto px-margin-mobile pb-4">
        {activeTab === "events" && (
          <div>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/20">event</span>
                <p className="text-sm text-on-surface-variant/50 mt-2">{searchQuery ? '没有找到匹配的活动' : '暂无活动'}</p>
                <button onClick={() => navigate('/publish-event')}
                  className="mt-4 px-6 py-2.5 bg-[#95490d] text-white rounded-full text-sm font-medium active:scale-95 transition-all">
                  发起活动
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEvents.map(evt => (
                  <div key={evt.id} onClick={() => navigate(`/event/${evt.id}`)}
                    className="card card-hover p-4">
                    <h3 className="font-semibold text-sm text-on-surface">{evt.title}</h3>
                    <p className="text-xs text-on-surface-variant/70 mt-1 line-clamp-2">{evt.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-on-surface-variant/50">
                      {evt.location && <span>📍 {evt.location}</span>}
                      {evt.event_time && <span>🕐 {new Date(evt.event_time).toLocaleDateString('zh-CN')}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "groups" && (
          <div>
            {filteredGroups.length === 0 ? (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/20">groups</span>
                <p className="text-sm text-on-surface-variant/50 mt-2">{searchQuery ? '没有找到匹配的群组' : '暂无群组'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredGroups.map(g => (
                  <div key={g.id} onClick={() => navigate(`/group-chat/${g.id}`)}
                    className="card card-hover p-4 flex items-center gap-3">
                    <Avatar name={g.name || 'G'} size="w-12 h-12" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-on-surface">{g.name}</h3>
                      <p className="text-xs text-on-surface-variant/70 truncate">{g.description || ''}</p>
                      <p className="text-xs text-on-surface-variant/50 mt-0.5">{g.member_count || 0} 人</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "people" && (
          <div>
            {filteredPeople.length === 0 ? (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/20">person</span>
                <p className="text-sm text-on-surface-variant/50 mt-2">{searchQuery ? '没有找到匹配的用户' : '暂无用户'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPeople.map(p => (
                  <div key={p.id} onClick={() => navigate(`/profile/${p.id}`)}
                    className="card card-hover p-4 flex items-center gap-3">
                    <Avatar name={p.id || 'U'} src={p.avatar_url} size="w-12 h-12" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-on-surface">{p.name || '用户'}</h3>
                      <p className="text-xs text-on-surface-variant/70 truncate">{p.bio || ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
