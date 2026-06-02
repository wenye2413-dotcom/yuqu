export function getAvatarUrl(name) {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

export function getGradientBg(name) {
  const gradients = [
    "from-[#ff9d5c] to-[#95490d]",
    "from-[#b9ecee] to-[#356668]",
    "from-[#ffdbc8] to-[#ff9d5c]",
    "from-[#c9c6be] to-[#605e58]",
    "from-[#ffb68a] to-[#95490d]",
    "from-[#e6e2d9] to-[#484741]",
  ];
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

export default function Avatar({ name, src, size = "w-10 h-10", className = "", onClick }) {
  const img = (
    <img
      src={src || getAvatarUrl(name || "User")}
      alt={name || "Avatar"}
      className="w-full h-full object-cover"
    />
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`rounded-full overflow-hidden bg-surface-variant flex-shrink-0 cursor-pointer ${size} ${className}`}
      >
        {img}
      </button>
    );
  }

  return (
    <div
      className={`rounded-full overflow-hidden bg-surface-variant flex-shrink-0 ${size} ${className}`}
    >
      {img}
    </div>
  );
}
