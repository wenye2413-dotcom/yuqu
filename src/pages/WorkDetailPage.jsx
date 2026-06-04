import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/common/Avatar";
import { getGradientBg } from "../hooks/utils";

export default function WorkDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [work, setWork] = useState(null);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("works").select("*").eq("id", id).single().then(({ data, error }) => {
      if (error || !data) { setLoading(false); return }
      setWork(data);
      supabase.from("profiles").select("name").eq("id", data.user_id).single().then(({ data: p }) => {
        if (p) setCreator(p);
      });
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full w-8 h-8 border-2 border-primary border-t-transparent" />
    </main>
  );

  if (!work) return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-margin-mobile">
      <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">broken_image</span>
      <p className="text-on-surface-variant">作品不存在</p>
      <button onClick={() => navigate(-1)} className="text-sm text-primary">返回</button>
    </main>
  );

  const isOwner = work.user_id === user?.id;

  return (
    <main className="min-h-screen bg-background pb-8">
      <div className="h-48 relative" style={{ background: getGradientBg(work.title) }}>
        <button onClick={() => navigate(-1)}
          className="absolute top-12 left-4 w-9 h-9 bg-white/20 backdrop-blur rounded-full flex items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-white text-[20px]">arrow_back</span>
        </button>
      </div>

      <div className="px-margin-mobile -mt-6 relative">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/80 shadow-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <span className="text-sm text-on-surface-variant/60">作品详情</span>
        </div>
        {work.images?.length > 0 && (
          <div className="mb-4 -mx-margin-mobile px-margin-mobile">
            <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar">
              {work.images.map((url, i) => (
                <div key={i} className="snap-center shrink-0 w-full aspect-video rounded-2xl overflow-hidden bg-surface-variant">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="card p-5 mb-4">
          <h1 className="font-headline-xl text-headline-xl text-on-surface mb-1">{work.title}</h1>
          {work.price > 0 && (
            <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold mb-3">
              ¥{work.price}
            </div>
          )}
          <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap mt-3">{work.description}</p>
        </div>

        {creator && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/40 p-4 flex items-center gap-3">
            <Avatar name={work.user_id || 'U'} size="w-12 h-12" />
            <div>
              <p className="font-semibold text-sm text-on-surface">{creator.name || "用户"}</p>
              <p className="text-xs text-on-surface-variant/60">创作者</p>
            </div>
          </div>
        )}

        {isOwner && (
          <div className="mt-4 bg-primary/5 backdrop-blur rounded-2xl p-5 text-center border border-primary/10">
            <p className="text-sm font-semibold text-primary">这是你的作品</p>
          </div>
        )}
      </div>
    </main>
  );
}
