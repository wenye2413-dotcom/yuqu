export function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

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

// ============ 太极能量 / 等级系统 ============

export const LEVEL_TIERS = [
  { id: "novice", minEnergy: 0, name: "普通用户", icon: "eco", badgeColor: "bg-bamboo-100 text-bamboo-700" },
  { id: "warm", minEnergy: 100, name: "热心社友", icon: "whatshot", badgeColor: "bg-secondary/10 text-secondary" },
  { id: "craftsman", minEnergy: 500, name: "社区工匠", icon: "handyman", badgeColor: "bg-primary/10 text-primary" },
  { id: "partner", minEnergy: 2000, name: "共创伙伴", icon: "workspace_premium", badgeColor: "bg-ink-100 text-ink-700" },
];

export function getLevelFromEnergy(energy = 0) {
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (energy >= LEVEL_TIERS[i].minEnergy) return LEVEL_TIERS[i];
  }
  return LEVEL_TIERS[0];
}

export function getLevelMaxEnergy(levelId) {
  const idx = LEVEL_TIERS.findIndex((t) => t.id === levelId);
  if (idx === -1 || idx === LEVEL_TIERS.length - 1)
    return LEVEL_TIERS[idx]?.minEnergy || 2000;
  return LEVEL_TIERS[idx + 1].minEnergy;
}

export function getLevelProgress(energy = 0, levelId) {
  const tier = getLevelFromEnergy(energy);
  if (tier.id === "partner") return 100;
  const currentMin = tier.minEnergy;
  const nextMin = getLevelMaxEnergy(levelId || tier.id);
  const range = nextMin - currentMin;
  if (range <= 0) return 100;
  return Math.min(((energy - currentMin) / range) * 100, 100);
}

export function getLevelBadgeClasses(levelId) {
  const tier = LEVEL_TIERS.find((t) => t.id === levelId);
  return tier?.badgeColor || LEVEL_TIERS[0].badgeColor;
}

export function getLevelIcon(levelId) {
  const tier = LEVEL_TIERS.find((t) => t.id === levelId);
  return tier?.icon || LEVEL_TIERS[0].icon;
}

export function getContributionLevel(contribution = 0) {
  if (contribution >= 70) return "high";
  if (contribution >= 30) return "medium";
  if (contribution >= 10) return "low";
  return "none";
}

export function getContributionColor(level) {
  const colors = {
    high: "text-primary",
    medium: "text-secondary",
    low: "text-bamboo-500",
    none: "text-on-surface-variant/30",
  };
  return colors[level] || colors.none;
}
