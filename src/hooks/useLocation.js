import { useState, useEffect, useRef, useCallback } from 'react'

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

export function formatDistance(meters) {
  if (meters === null || meters === undefined) return ''
  if (meters < 1) return '就在身边'
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

export function useLocation() {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const watchId = useRef(null)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('浏览器不支持定位'); setLoading(false); return
    }

    // 先试高精度，5秒超时后降级
    let timedOut = false
    const timeoutTimer = setTimeout(() => { timedOut = true }, 5000)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeoutTimer)
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
        setPermissionDenied(false)
      },
      (err) => {
        clearTimeout(timeoutTimer)
        if (timedOut) {
          // 高精度超时，用低精度再试一次（WiFi/基站定位）
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
              setLoading(false)
              setPermissionDenied(false)
            },
            (err2) => {
              setLoading(false)
              if (err2.code === 1) { setPermissionDenied(true); setError('定位权限被拒绝') }
              else { setError('获取位置失败') }
            },
            { enableHighAccuracy: false, timeout: 10000 }
          )
        } else if (err.code === 1) {
          setPermissionDenied(true); setError('定位权限被拒绝'); setLoading(false)
        } else {
          setError('获取位置失败: ' + err.message); setLoading(false)
        }
      },
      { enableHighAccuracy: true, timeout: 5000 }
    )
  }, [])

  useEffect(() => {
    requestLocation()

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setLocation((prev) => {
          if (!prev) return newPos
          const d = calcDistance(prev.lat, prev.lng, newPos.lat, newPos.lng)
          return d > 50 ? newPos : prev
        })
        setLoading(false)
        setPermissionDenied(false)
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 30000 }
    )

    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [requestLocation])

  return { location, error, loading, permissionDenied, requestLocation }
}
