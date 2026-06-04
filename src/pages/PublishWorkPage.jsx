import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { supabase } from "../supabaseClient";
import Avatar from "../components/common/Avatar";

export default function PublishWorkPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, profile } = useAuth();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    if (!title.trim() || !desc.trim()) {
      toast("请填写完整信息", "error");
      return;
    }
    setPublishing(true);
    const { error } = await supabase.from("works").insert({
      user_id: user.id,
      title: title.trim(),
      description: desc.trim(),
      price: price ? parseFloat(price) : 0,
    });
    setPublishing(false);
    if (error) {
      toast("发布失败: " + error.message, "error");
      return;
    }
    toast("作品已发布", "success");
    navigate("/discovery");
  };

  return (
    <main className="px-margin-mobile pb-8">
      <div className="flex items-center justify-between py-3 mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="font-headline-lg text-headline-lg text-on-surface">发布作品</span>
        </div>
        <button onClick={handlePublish} disabled={publishing || !title.trim() || !desc.trim()}
          className="px-5 py-2 bg-primary text-white rounded-full font-label-sm text-label-sm disabled:opacity-40 active:scale-95 transition-transform">
          {publishing ? "发布中..." : "发布"}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Avatar name={user?.id || 'U'} size="w-12 h-12" />
        <div>
          <p className="font-label-md text-label-md text-on-surface">{profile?.name || user?.email?.split('@')[0] || '用户'}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-on-surface-variant font-semibold mb-1 block">作品标题</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="给作品起个名字"
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant/30 outline-none placeholder-on-surface-variant/50" />
        </div>
        <div>
          <label className="text-xs text-on-surface-variant font-semibold mb-1 block">价格（选填）</label>
          <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant/30 outline-none placeholder-on-surface-variant/50" />
        </div>
        <div>
          <label className="text-xs text-on-surface-variant font-semibold mb-1 block">作品描述</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="介绍你的创作..."
            className="w-full min-h-[120px] bg-surface-container-low rounded-xl p-4 text-sm text-on-surface border border-outline-variant/30 outline-none resize-none placeholder-on-surface-variant/50" />
        </div>
      </div>
    </main>
  );
}
