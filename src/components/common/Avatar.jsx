import { useState } from "react"

const COLORS = [
  ['#c28a2e', '#7d5517'],
  ['#2d7d4e', '#173d27'],
  ['#367cb3', '#1b3f61'],
  ['#d4a34f', '#5e4013'],
  ['#6fbc89', '#1d4e31'],
  ['#7fb5db', '#183450'],
  ['#e8c78a', '#4a3310'],
  ['#a3d7b3', '#112e1d'],
]

function getColors(name) {
  const hash = (name || 'U').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return COLORS[hash % COLORS.length]
}

export function getAvatarUrl(name) {
  const [c1, c2] = getColors(name || 'U')
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient></defs>
      <rect width="100" height="100" rx="50" fill="url(#g)"/>
      <text x="50" y="50" text-anchor="middle" dominant-baseline="central"
        font-size="40" fill="white" font-weight="700"
        font-family="sans-serif">${(name || 'U')[0].toUpperCase()}</text>
    </svg>`
  )}`
}

export function getGradientBg(name) {
  const [c1, c2] = getColors(name || 'U')
  return `linear-gradient(135deg, ${c1}, ${c2})`
}

export default function Avatar({ name, src, size = "w-10 h-10", className = "", onClick }) {
  const [imgError, setImgError] = useState(false)

  // 有 src 且没有加载失败 → 显示图片
  if (src && !imgError) {
    const img = <img src={src} alt="" onError={() => setImgError(true)} className="w-full h-full object-cover" />
    const cls = `rounded-full overflow-hidden flex-shrink-0 bg-surface-variant ${size} ${className}`
    if (onClick) return <button onClick={onClick} className={`${cls} cursor-pointer`}>{img}</button>
    return <div className={cls}>{img}</div>
  }

  // 无 src 或图片加载失败 → CSS 首字母
  const inner = (
    <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg select-none"
      style={{ background: getGradientBg(name) }}>
      {(name || 'U')[0].toUpperCase()}
    </div>
  )
  const cls = `rounded-full overflow-hidden flex-shrink-0 ${size} ${className}`
  if (onClick) return <button onClick={onClick} className={`${cls} cursor-pointer`}>{inner}</button>
  return <div className={cls}>{inner}</div>
}
