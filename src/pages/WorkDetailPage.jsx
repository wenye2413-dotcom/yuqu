import { useParams, useNavigate } from "react-router-dom";
import { currentUser, users } from "../mocks/data";
import { useToast } from "../hooks/useToast";
import { useShare } from "../hooks/useShare";
import { getGradientBg } from "../hooks/utils";

export default function WorkDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { share } = useShare();
  // Look up work across all users' portfolios
  const work =
    currentUser.portfolio.find((p) => p.id === id) ||
    Object.values(users)
      .filter((u) => u.portfolio)
      .flatMap((u) => u.portfolio)
      .find((p) => p.id === id);

  const isOwner = currentUser?.id === work?.creatorId;

  if (!work) {
    return (
      <main className="px-margin-mobile pt-16 text-center">
        <p className="text-on-surface-variant mt-20">作品不存在</p>
        <button onClick={() => navigate(-1)} className="text-primary mt-4">返回</button>
      </main>
    );
  }

  return (
    <main className="pb-24">
      {/* 返回 + 分享 */}
      <div className="px-margin-mobile py-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="flex-1 font-headline-lg text-headline-lg text-on-surface">作品详情</span>
        <button
          onClick={() => share(`作品: ${work.title}`, "在 Warm Circle 上查看此作品", `/works/${work.id}`)}
          className="w-8 h-8 flex items-center justify-center text-primary hover:bg-primary/10 rounded-full transition-colors"
        >
          <span className="material-symbols-outlined">share</span>
        </button>
      </div>

      {/* 预览图 */}
      <div className={`w-full aspect-square bg-gradient-to-br ${getGradientBg(work.title)} flex items-center justify-center relative`}>
        <span className="material-symbols-outlined text-white text-6xl opacity-40">photo_camera</span>
        {!isOwner && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-white/90 rounded-2xl px-6 py-4 text-center shadow-xl">
              <span className="material-symbols-outlined text-3xl text-primary block mb-1">lock</span>
              <p className="text-sm font-semibold text-on-surface">订阅后解锁</p>
            </div>
          </div>
        )}
      </div>

      {/* 详情 */}
      <div className="px-margin-mobile mt-4">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">{work.title}</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">favorite</span>
          <span className="text-sm text-on-surface-variant">{work.likes} 次赞</span>
        </div>
        <p className="text-sm text-on-surface-variant mt-4 leading-relaxed">
          这是创作者发布的付费内容。订阅后可查看完整作品、点赞和评论。
        </p>
      </div>

      {/* 解锁/订阅按钮 */}
      <div className="fixed bottom-0 left-0 right-0 px-margin-mobile py-4 bg-white/90 backdrop-blur-xl border-t border-surface-variant/20">
        {isOwner ? (
          <div className="w-full py-4 bg-surface-container-low text-on-surface-variant font-label-md text-label-md rounded-full text-center">
            这是我的作品
          </div>
        ) : (
          <button
            onClick={() => {
              toast("💎 解锁需要先订阅创作者", "info");
            }}
            className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-white font-label-md text-label-md rounded-full shadow-lg shadow-primary/30 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[20px] align-middle mr-2">diamond</span>
            解锁此作品 · ${currentUser.price}/月
          </button>
        )}
      </div>
    </main>
  );
}
