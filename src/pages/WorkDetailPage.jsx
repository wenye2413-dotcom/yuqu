import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import Avatar from "../components/common/Avatar";

export default function WorkDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
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

  if (loading) return <main className="p-margin-mobile text-center py-20 text-on-surface-variant">加载中...</main>;
  if (!work) return <main className="p-margin-mobile text-center py-20">
    <p className="text-on-surface-variant">作品不存在</p>
    <button onClick={() => navigate(-1)} className="text-primary mt-4">返回</button>
  </main>;

  const isOwner = work.user_id === user?.id;

  return (
    <main className="pb-8">
      <div className="px-margin-mobile py-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </div>

      <div className="px-margin-mobile">
        {creator && (
          <div className="flex items-center gap-3 mb-4">
            <Avatar name={work.user_id || 'U'} size="w-12 h-12" />
            <div>
              <p className="font-semibold text-sm text-on-surface">{creator.name || "用户"}</p>
              <p className="text-xs text-on-surface-variant">创作者</p>
            </div>
          </div>
        )}

        <h1 className="font-headline-xl text-headline-xl text-on-surface mb-2">{work.title}</h1>
        {work.price > 0 && <p className="text-lg font-bold text-primary mb-3">¥{work.price}</p>}
        <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{work.description}</p>

        {isOwner && (
          <div className="mt-6 bg-primary/5 rounded-xl p-4 text-center text-sm text-on-surface-variant">
            这是你的作品
          </div>
        )}
      </div>
    </main>
  );
}
