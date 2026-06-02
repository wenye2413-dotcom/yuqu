import { getAvatarUrl, getGradientBg, getContributionLevel, getContributionColor } from "../../hooks/utils";
import { useNavigate } from "react-router-dom";
import { useShare } from "../../hooks/useShare";

export default function CreatorCard({
  creator,
  isSubscribed,
  isFollowed,
  onToggleSub,
  onToggleFollow,
  onClickAvatar,
  onClickCard,
}) {
  const navigate = useNavigate();
  const { share } = useShare();
  const free = creator.price === 0;
  const aspectClass =
    creator.id === "u3"
      ? "aspect-[3/4]"
      : creator.id === "u5"
        ? "aspect-[4/5]"
        : "aspect-square";

  return (
    <div
      className="masonry-item rounded-DEFAULT overflow-hidden relative ambient-shadow group cursor-pointer"
      onClick={onClickCard}
    >
      <div className={`${aspectClass} w-full bg-surface-variant`}>
        <div
          className={`w-full h-full bg-gradient-to-br ${getGradientBg(creator.name)} flex items-center justify-center`}
        >
          <img
            src={getAvatarUrl(creator.name)}
            alt={creator.name}
            className="w-2/3 h-2/3 object-contain drop-shadow-lg"
          />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full p-stack-sm glass-card rounded-b-DEFAULT rounded-t-none border-t-0 flex flex-col gap-unit">
        <div className="flex justify-between items-center">
          <span
            className="font-label-md text-label-md text-on-surface truncate pr-2 cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${creator.id}`);
            }}
          >
            {creator.name}
            {creator.contribution !== undefined && creator.contribution > 0 && (
              <span className={`material-symbols-outlined text-[14px] ${getContributionColor(getContributionLevel(creator.contribution))} ml-0.5`}>
                spa
              </span>
            )}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); share(creator.name, creator.bio, `/profile/${creator.id}`); }}
              className="w-7 h-7 flex items-center justify-center text-on-surface-variant/50 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">share</span>
            </button>
            <span
              className={`font-label-sm text-label-sm font-bold px-2 py-0.5 rounded-full ${
                free
                  ? "text-secondary bg-secondary/10"
                  : "text-primary bg-primary/10"
              }`}
            >
              {free ? "免费" : `$${creator.price}`}
            </span>
          </div>
        </div>
        {free ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFollow(creator.id, creator.name);
            }}
            className={`w-full rounded-full py-1.5 font-label-sm text-label-sm active:scale-95 transition-transform ${
              isFollowed
                ? "bg-primary-container text-on-primary-container"
                : "border-2 border-primary-container text-primary-container bg-transparent"
            }`}
          >
            {isFollowed ? "已关注" : "关注"}
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSub(creator.id, creator.price);
            }}
            className={`w-full rounded-full py-1.5 font-label-sm text-label-sm active:scale-95 transition-transform ${
              isSubscribed
                ? "bg-primary-container/50 text-primary-container"
                : "bg-primary-container text-on-primary-container"
            }`}
          >
            {isSubscribed ? "已订阅" : "订阅"}
          </button>
        )}
      </div>
    </div>
  );
}
