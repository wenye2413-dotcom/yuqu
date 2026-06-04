const COLORS = [
  ['#ff9d5c', '#95490d'],
  ['#b9ecee', '#356668'],
  ['#ffdbc8', '#ff9d5c'],
  ['#c9c6be', '#605e58'],
  ['#e8def8', '#6750a4'],
  ['#d0f4de', '#2d6a4f'],
  ['#ffcdd2', '#c62828'],
  ['#bbdefb', '#1565c0'],
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
  // 有 src 就显示上传的图片，没有就显示 CSS 首字母
  const inner = src ? (
    <img src={src} alt="" className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg select-none"
      style={{ background: getGradientBg(name) }}>
      {(name || 'U')[0].toUpperCase()}
    </div>
  )

  const cls = `rounded-full overflow-hidden flex-shrink-0 bg-surface-variant ${size} ${className}`

  if (onClick) {
    return <button onClick={onClick} className={`${cls} cursor-pointer`}>{inner}</button>
  }

  return <div className={cls}>{inner}</div>
}
