import { motion } from "framer-motion";
import TaiChiIcon from "./TaiChiIcon";

export default function EnergyRing({ energy = 0, maxEnergy = 2000, size = 72 }) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(energy / maxEnergy, 1);
  const offset = circumference * (1 - progress);

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-surface-variant"
        />
      </svg>
      <svg width={size} height={size} className="absolute -rotate-90">
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-primary"
        />
      </svg>
      <TaiChiIcon size={size * 0.35} className="animate-energy-pulse text-primary" />
    </div>
  );
}
