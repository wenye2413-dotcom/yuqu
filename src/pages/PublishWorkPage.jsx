import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import Avatar from "../components/common/Avatar";

export default function PublishWorkPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [cover, setCover] = useState(null);
  const [files, setFiles] = useState([]);

  const handleCoverUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const f = e.target.files?.[0];
      if (f) {
        setCover(URL.createObjectURL(f));
        toast("封面已添加（模拟）", "success");
      }
    };
    input.click();
  };

  const handleFileUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = (e) => {
      const fileList = Array.from(e.target.files);
      const newFiles = fileList.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
      setFiles((prev) => [...prev, ...newFiles].slice(0, 9));
      if (fileList.length > 0) toast("文件已添加（模拟）", "success");
    };
    input.click();
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePublish = () => {
    if (!title.trim() || !desc.trim()) {
      toast("请填写完整信息", "error");
      return;
    }
    toast("作品已发布（模拟）", "success");
    navigate("/messages");
  };

  return (
    <main className="px-margin-mobile pb-8">
      <div className="flex items-center justify-between py-3 mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/messages")} className="w-8 h-8 flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="font-headline-lg text-headline-lg text-on-surface">发布作品</span>
        </div>
        <button
          onClick={handlePublish}
          disabled={!title.trim() || !desc.trim()}
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
        {/* 作品封面 */}
        <div>
          <label className="text-xs text-on-surface-variant font-semibold mb-1 block">作品封面</label>
          {cover ? (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-variant mb-2">
              <img src={cover} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => setCover(null)}
                className="absolute top-2 right-2 w-6 h-6 bg-black/40 rounded-full flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-white text-[14px]">close</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleCoverUpload}
              className="aspect-video w-full bg-surface-container-low rounded-xl border border-dashed border-outline-variant/50 flex flex-col items-center justify-center gap-1 text-on-surface-variant active:scale-[0.98] transition-transform"
            >
              <span className="material-symbols-outlined text-[32px]">add_photo_alternate</span>
              <span className="text-xs">点击上传封面图</span>
            </button>
          )}
        </div>

        <div>
          <label className="text-xs text-on-surface-variant font-semibold mb-1 block">作品标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="给作品起个名字"
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant/30 outline-none placeholder-on-surface-variant/50"
          />
        </div>

        <div>
          <label className="text-xs text-on-surface-variant font-semibold mb-1 block">价格（选填）</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant/30 outline-none placeholder-on-surface-variant/50"
          />
        </div>

        <div>
          <label className="text-xs text-on-surface-variant font-semibold mb-1 block">作品描述</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="介绍你的创作..."
            className="w-full min-h-[120px] bg-surface-container-low rounded-xl p-4 text-sm text-on-surface border border-outline-variant/30 outline-none resize-none placeholder-on-surface-variant/50"
          />
        </div>

        {/* 作品文件 */}
        {files.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs text-on-surface-variant font-semibold block">已添加文件</label>
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between bg-surface-container-low rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">description</span>
                  <span className="text-sm text-on-surface truncate">{f.name}</span>
                </div>
                <button onClick={() => removeFile(i)} className="shrink-0">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">close</span>
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleFileUpload}
          className="flex items-center gap-2 px-4 py-3 bg-surface-container-low rounded-xl border border-dashed border-outline-variant/50 text-on-surface-variant text-sm w-full active:scale-[0.98] transition-transform"
        >
          <span className="material-symbols-outlined text-[20px]">upload_file</span>
          添加作品文件（可选）
        </button>
      </div>
    </main>
  );
}
