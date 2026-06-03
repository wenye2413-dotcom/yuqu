import { useState, useEffect, useRef } from 'react'

// Haversine 公式计算两点距离（米）
export function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// 格式化距离显示
export function formatDistance(meters) {
  if (meters < 1) return '就在身边'
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

export function useLocation() {
  const [location, setLocation] = useState(null)   // { lat, lng }
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const watchId = useRef(null)

  // 获取一次位置
  const requestLocation = () => {
    setLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('浏览器不支持定位')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
        setPermissionDenied(false)
      },
      (err) => {
        setLoading(false)
        if (err.code === 1) {
          setPermissionDenied(true)
          setError('定位权限被拒绝，请在浏览器设置中允许定位')
        } else {
          setError('获取位置失败: ' + err.message)
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    )
  }

  useEffect(() => {
    requestLocation()

    // 监听位置变化（移动超过 50 米才更新）
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setLocation((prev) => {
          if (!prev) return newPos
          const d = calcDistance(prev.lat, prev.lng, newPos.lat, newPos.lng)
          return d > 50 ? newPos : prev // 移动超过 50 米才更新
        })
        setPermissionDenied(false)
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    )

    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [])

  return { location, error, loading, permissionDenied, requestLocation }
}
