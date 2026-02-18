import { useState } from 'react'
import { useWeather } from '../context/WeatherContext.jsx'

export default function AlertsBanner() {
  const { alerts } = useWeather()
  const [dismissed, setDismissed] = useState(false)

  if (!alerts || !alerts.length || dismissed) return null

  const message = alerts.map((a) => a.message).join(' • ')

  return (
    <div className="alerts-banner glass-card">
      <span className="alerts-text">{message}</span>
      <button
        type="button"
        className="alerts-dismiss"
        onClick={() => setDismissed(true)}
      >
        ✕
      </button>
    </div>
  )
}

