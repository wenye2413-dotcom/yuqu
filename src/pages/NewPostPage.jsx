import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import { usePosts } from "../context/PostContext";
import Avatar from "../components/common/Avatar";

export default function NewPostPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { addPost } = usePosts();
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);

  const handlePublish = () => {
    if (!text.trim()) {
      toast("请输入内容", "error");
      return;
    }
    const newPost = {
      id: "post_" + Date.now(),
      userId: "u_self",
      type: "post",
      time: "刚刚",
      distance: "",
      message: text.trim(),
      unread: 0,
      color: "#2d7d4e",
      replies: [],
      images,
    };
    addPost(newPost);
    toast("发布成功", "success");
    navigate("/messages");
  };

  const handleImageUpload = () => {
    // 模拟图片上传 — 实际使用 input[type=file]
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

  return (
    <main className="px-margin-mobile pb-8">
      <div className="flex items-center justify-between py-3 mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/messages")} className="w-8 h-8 flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="font-headline-lg text-headline-lg text-on-surface">写新动态</span>
        </div>
        <button
          onClick={handlePublish}
          disabled={!text.trim()}
          className="px-5 py-2 bg-primary text-white rounded-full font-label-sm text-label-sm disabled:opacity-40 active:scale-95 transition-transform"
        >
          发布
        </button>
      </div>

      {/* 用户信息 */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar name="Warm Circle" size="w-12 h-12" />
        <div>
          <p className="font-label-md text-label-md text-on-surface">Warm Circle</p>
          <p className="text-xs text-on-surface-variant">@warmcircle</p>
        </div>
      </div>

      {/* 文字输入 */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="说点什么..."
        className="w-full min-h-[160px] bg-surface-container-low rounded-xl p-4 text-sm text-on-surface border border-outline-variant/30 outline-none resize-none placeholder-on-surface-variant/50"
      />

      {/* 图片预览 */}
      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
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

      {/* 添加图片 */}
      <button
        onClick={handleImageUpload}
        className="mt-4 flex items-center gap-2 px-4 py-3 bg-surface-container-low rounded-xl border border-dashed border-outline-variant/50 text-on-surface-variant text-sm w-full active:scale-[0.98] transition-transform"
      >
        <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
        添加图片（可选）
      </button>
    </main>
  );
}
