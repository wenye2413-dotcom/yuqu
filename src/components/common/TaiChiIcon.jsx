export default function TaiChiIcon({ size = 24, className = "" }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
    >
      {/* 外圈 */}
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* 阳半（白色半边）—— 显式绘制，不依赖背景色 */}
      <path d="M50,4 A46,46 0 0,0 4,50 A23,23 0 0,1 50,50 A23,23 0 0,0 50,4Z" fill="white" />
      {/* 阴半（彩色半边） */}
      <path d="M50,4 A46,46 0 0,1 96,50 A23,23 0 0,0 50,50 A23,23 0 0,1 50,4Z" fill="currentColor" />
      {/* 阳中有阴（白底黑点） */}
      <circle cx="50" cy="27" r="8" fill="currentColor" />
      {/* 阴中有阳（彩底白点） */}
      <circle cx="50" cy="73" r="8" fill="white" />
    </svg>
  );
}
