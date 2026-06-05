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
  const [images, setImages] = useState([]); // File[]
  const [previews, setPreviews] = useState([]);
  const [publishing, setPublishing] = useState(false);

  const pickImages = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*"; input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      setImages(i => [...i, ...files].slice(0, 9));
      setPreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))].slice(0, 9));
    };
    input.click();
  };

  const removeImage = (idx) => {
    setImages(i => i.filter((_, n) => n !== idx));
    setPreviews(p => p.filter((_, n) => n !== idx));
  };

  const handlePublish = async () => {
    if (!title.trim() || !desc.trim()) { toast("请填写完整信息", "error"); return }
    setPublishing(true);

    // 上传图片
    const urls = []
    for (const file of images) {
      const ext = file.name.split('.').pop();
      const path = `works/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('images').upload(path, file);
      if (error) { toast('图片上传失败: ' + error.message, 'error'); setPublishing(false); return }
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
      urls.push(publicUrl);
    }

    const { error } = await supabase.from("works").insert({
      user_id: user.id,
      title: title.trim(),
      description: desc.trim(),
      price: price ? parseFloat(price) : 0,
      images: urls,
    });
    setPublishing(false);
    if (error) { toast("发布失败: " + error.message, "error"); return }
    toast("作品已发布", "success");
    navigate("/profile");
  };

  return (
    <main className="h-full flex flex-col bg-[#fcf9f8]">
      <div className="flex items-center justify-between px-margin-mobile py-3 shrink-0 border-b border-[#f0edea]">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="font-semibold text-base text-on-surface">发布作品</span>
        </div>
        <button onClick={handlePublish} disabled={publishing || !title.trim() || !desc.trim()}
          className="px-5 py-2 bg-[#2d7d4e] text-white rounded-full text-sm font-medium disabled:opacity-40 active:scale-95 transition-all">
          {publishing ? "发布中..." : "发布"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-margin-mobile py-4">
        <div className="flex items-center gap-3 mb-6">
          <Avatar name={user?.id || 'U'} src={profile?.avatar_url} size="w-10 h-10" />
          <p className="font-medium text-sm text-on-surface">{profile?.name || user?.email?.split('@')[0] || '用户'}</p>
        </div>

        <div className="space-y-4">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="作品标题"
            className="w-full bg-white rounded-xl px-4 py-3.5 text-sm outline-none border border-[#f0edea] focus:border-primary/30 transition-colors placeholder-on-surface-variant/50" />

          <textarea value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="描述你的作品..."
            rows={5}
            className="w-full bg-white rounded-xl px-4 py-3.5 text-sm outline-none border border-[#f0edea] focus:border-primary/30 transition-colors resize-none placeholder-on-surface-variant/50" />

          <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)}
            placeholder="价格（选填）"
            className="w-full bg-white rounded-xl px-4 py-3.5 text-sm outline-none border border-[#f0edea] focus:border-primary/30 transition-colors placeholder-on-surface-variant/50" />

          {/* 图片预览 */}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {previews.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-surface-variant">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/40 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[14px]">close</span>
                  </button>
                </div>
              ))}
              {previews.length < 9 && (
                <button onClick={pickImages}
                  className="aspect-square rounded-xl border-2 border-dashed border-[#f0edea] flex items-center justify-center text-on-surface-variant/40 active:scale-[0.97] transition-all">
                  <span className="material-symbols-outlined text-[28px]">add</span>
                </button>
              )}
            </div>
          )}

          {previews.length === 0 && (
            <button onClick={pickImages}
              className="w-full py-8 rounded-xl border-2 border-dashed border-[#f0edea] flex flex-col items-center justify-center gap-1 text-on-surface-variant/50 active:scale-[0.98] transition-all">
              <span className="material-symbols-outlined text-[32px]">add_photo_alternate</span>
              <span className="text-xs">添加图片</span>
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
