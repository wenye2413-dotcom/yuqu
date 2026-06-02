import { useNavigate } from "react-router-dom";
import { useShare } from "../../hooks/useShare";

export default function EventCard({ event, joinStatus = "none", onJoin }) {
  const navigate = useNavigate();
  const { share } = useShare();
  const isVertical = event.id === "e1";

  const btnLabel =
    joinStatus === "registered"
      ? "已报名"
      : joinStatus === "applied"
        ? "待审核"
        : "加入";

  const btnStyle =
    joinStatus === "registered"
      ? "bg-primary-container/50 text-primary"
      : joinStatus === "applied"
        ? "bg-secondary/10 text-secondary"
        : "bg-secondary text-on-secondary";

  const handleClick = () => {
    if (joinStatus === "registered") {
      navigate(`/event/${event.id}`);
    } else {
      onJoin();
    }
  };

  if (isVertical) {
    return (
      <div className="masonry-item glass-card rounded-DEFAULT p-stack-sm flex flex-col gap-stack-sm ambient-shadow cursor-pointer" onClick={handleClick}>
        <div className="flex justify-between items-start">
          <div className="bg-secondary/10 text-secondary px-2 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1 w-fit">
            <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
            {event.tag}
          </div>
          <span className="material-symbols-outlined text-on-surface-variant">favorite_border</span>
        </div>
        <div>
          <h3 className="font-label-md text-label-md text-on-surface mb-1 leading-tight">{event.title}</h3>
          <div className="flex items-center gap-1 text-on-surface-variant mb-0.5">
            <span className="material-symbols-outlined text-[14px]">location_on</span>
            <span className="font-body-md text-[12px] truncate">{event.location}</span>
          </div>
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            <span className="font-body-md text-[12px]">{event.time}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleClick(); }}
            className={`flex-1 rounded-full py-2 font-label-sm text-label-sm active:scale-95 transition-transform ${btnStyle}`}
          >
            {btnLabel}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); share(`活动: ${event.title}`, `${event.desc || ""}`, `/event/${event.id}`); }}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-outline-variant/30 text-on-surface-variant/50 hover:text-primary hover:border-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="masonry-item glass-card rounded-DEFAULT p-stack-sm flex flex-col gap-stack-sm ambient-shadow cursor-pointer" onClick={handleClick}>
      <div className="aspect-video w-full rounded-lg overflow-hidden bg-gradient-to-br from-[#ff9d5c] to-[#95490d] flex items-center justify-center mb-unit">
        <span className="material-symbols-outlined text-white text-4xl">music_note</span>
      </div>
      <div>
        <h3 className="font-label-md text-label-md text-on-surface mb-1 leading-tight">{event.title}</h3>
        <div className="flex items-center gap-1 text-on-surface-variant">
          <span className="material-symbols-outlined text-[14px]">location_on</span>
          <span className="font-body-md text-[12px] truncate">{event.location}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); handleClick(); }}
          className={`flex-1 rounded-full py-2 font-label-sm text-label-sm active:scale-95 transition-transform ${btnStyle}`}
        >
          {btnLabel}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); share(`活动: ${event.title}`, `${event.desc || ""}`, `/event/${event.id}`); }}
          className="w-9 h-9 flex items-center justify-center rounded-full border border-outline-variant/30 text-on-surface-variant/50 hover:text-primary hover:border-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">share</span>
        </button>
      </div>
    </div>
  );
}
