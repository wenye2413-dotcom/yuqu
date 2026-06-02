import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import Avatar from "../components/common/Avatar";

export default function PublishEventPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [desc, setDesc] = useState("");
  const [images, setImages] = useState([]);

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      const newImages = files.map((f) => URL.createObjectURL(f));
      setImages((prev) => [...prev, ...newImages].slice(0, 9));
      if (files.length > 0) toast("图片已添加（模拟）", "success");
    };
    input.click();
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePublish = () => {
    if (!title.trim() || !time || !location.trim() || !desc.trim()) {
      toast("请填写完整信息", "error");
      return;
    }
    toast("活动已发布（模拟）", "success");
    navigate("/messages");
  };

  return (
    <main className="px-margin-mobile pb-8">
      <div className="flex items-center justify-between py-3 mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/messages")} className="w-8 h-8 flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="font-headline-lg text-headline-lg text-on-surface">发布活动</span>
        </div>
        <button
          onClick={handlePublish}
          disabled={!title.trim() || !time || !location.trim() || !desc.trim()}
          className="px-5 py-2 bg-primary text-white rounded-full font-label-sm text-label-sm disabled:opacity-40 active:scale-95 transition-transform"
        >
          发布
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Avatar name="Warm Circle" size="w-12 h-12" />
        <div>
          <p className="font-label-md text-label-md text-on-surface">Warm Circle</p>
          <p className="text-xs text-on-surface-variant">@warmcircle</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-on-surface-variant font-semibold mb-1 block">活动标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="给活动起个名字"
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant/30 outline-none placeholder-on-surface-variant/50"
          />
        </div>

        <div>
          <label className="text-xs text-on-surface-variant font-semibold mb-1 block">活动时间</label>
          <input
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant/30 outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-on-surface-variant font-semibold mb-1 block">活动地点</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="在哪里举办？"
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant/30 outline-none placeholder-on-surface-variant/50"
          />
        </div>

        <div>
          <label className="text-xs text-on-surface-variant font-semibold mb-1 block">活动描述</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="详细介绍你的活动..."
            className="w-full min-h-[120px] bg-surface-container-low rounded-xl p-4 text-sm text-on-surface border border-outline-variant/30 outline-none resize-none placeholder-on-surface-variant/50"
          />
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {images.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-surface-variant">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/40 rounded-full flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-white text-[14px]">close</span>
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleImageUpload}
          className="flex items-center gap-2 px-4 py-3 bg-surface-container-low rounded-xl border border-dashed border-outline-variant/50 text-on-surface-variant text-sm w-full active:scale-[0.98] transition-transform"
        >
          <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
          添加活动图片（可选）
        </button>
      </div>
    </main>
  );
}
