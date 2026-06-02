import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { useToast } from "../hooks/useToast";
import Avatar from "../components/common/Avatar";

export default function GroupSettingsPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [activeTab, setActiveTab] = useState("settings");

  useEffect(() => {
    fetchGroup();
    checkOwner();
  }, [groupId]);

  const fetchGroup = async () => {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .maybeSingle();
    if (error) {
      console.error("获取群组失败:", error.message);
      toast("群组不存在", "error");
      return;
    }
    if (data) {
      setGroup(data);
      setAnnouncement(data.announcement || "");
    }
  };

  const checkOwner = async () => {
    if (!user || !groupId) return;
    const { data } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .eq("role", "owner")
      .maybeSingle();
    setIsOwner(!!data);
  };

  const fetchPendingMembers = async () => {
    if (!groupId) return;
    const { data, error } = await supabase
      .from("group_members")
      .select("*, profiles:user_id(name, avatar_url)")
      .eq("group_id", groupId)
      .eq("status", "pending");
    if (error) {
      console.error("获取待审核成员失败:", error.message);
      return;
    }
    setPendingMembers(data || []);
  };

  const handleSaveAnnouncement = async () => {
    if (!groupId) return;
    setSaving(true);
    const { error } = await supabase
      .from("groups")
      .update({ announcement: announcement.trim() })
      .eq("id", groupId);
    setSaving(false);
    if (error) {
      toast("保存公告失败: " + error.message, "error");
      return;
    }
    toast("公告已更新", "success");
    fetchGroup();
  };

  const handleApprove = async (memberId) => {
    const { error } = await supabase
      .from("group_members")
      .update({ status: "member" })
      .eq("id", memberId);
    if (error) {
      toast("审批失败: " + error.message, "error");
      return;
    }
    toast("已通过申请", "success");
    fetchPendingMembers();
  };

  const handleReject = async (memberId) => {
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("id", memberId);
    if (error) {
      toast("操作失败: " + error.message, "error");
      return;
    }
    toast("已拒绝申请", "info");
    fetchPendingMembers();
  };

  useEffect(() => {
    if (activeTab === "members") {
      fetchPendingMembers();
    }
  }, [activeTab]);

  if (!group) {
    return (
      <main className="p-margin-mobile">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="font-label-md">群设置</span>
        </div>
        <p className="text-center text-on-surface-variant">加载中...</p>
      </main>
    );
  }

  return (
    <main className="pb-6">
      <div className="px-margin-mobile py-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="font-label-md">群设置</span>
      </div>

      {/* Tab 切换 */}
      <div className="px-margin-mobile">
        <div className="flex gap-1 bg-surface-container-low rounded-xl p-1 mb-4">
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "settings"
                ? "bg-white text-on-surface shadow-sm"
                : "text-on-surface-variant"
            }`}
          >
            群设置
          </button>
          {isOwner && (
            <button
              onClick={() => setActiveTab("members")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "members"
                  ? "bg-white text-on-surface shadow-sm"
                  : "text-on-surface-variant"
              }`}
            >
              成员管理
            </button>
          )}
        </div>
      </div>

      {activeTab === "settings" && (
        <div className="px-margin-mobile">
          {/* 群信息 */}
          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-5 border border-white/40 mb-4">
            <div className="flex items-center gap-4 mb-4">
              <Avatar name={group.name} size="w-16 h-16" />
              <div>
                <h2 className="font-label-md text-label-md font-bold">{group.name}</h2>
                <p className="text-sm text-on-surface-variant">{group.member_count || 0} 位成员</p>
              </div>
            </div>
          </div>

          {/* 群公告编辑 */}
          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-5 border border-white/40">
            <h3 className="font-label-md mb-3">群公告</h3>
            <textarea
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="编辑群公告..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface resize-none"
            />
            <button
              onClick={handleSaveAnnouncement}
              disabled={saving}
              className="mt-3 w-full py-3 bg-primary text-white font-label-md rounded-full shadow-lg active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存公告"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "members" && isOwner && (
        <div className="px-margin-mobile">
          <h3 className="font-label-md mb-3">待审核成员</h3>
          {pendingMembers.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant text-sm">
              暂无待审核的申请
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-white/40 flex items-center gap-3"
                >
                  <Avatar
                    name={member.profiles?.name || "用户"}
                    size="w-12 h-12"
                  />
                  <div className="flex-1">
                    <p className="font-label-md">{member.profiles?.name || "用户"}</p>
                    <p className="text-xs text-on-surface-variant">
                      申请于 {new Date(member.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleApprove(member.id)}
                    className="px-4 py-2 bg-primary text-white text-sm rounded-full"
                  >
                    通过
                  </button>
                  <button
                    onClick={() => handleReject(member.id)}
                    className="px-4 py-2 bg-surface-container-low text-on-surface-variant text-sm rounded-full border border-outline-variant/30"
                  >
                    拒绝
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
