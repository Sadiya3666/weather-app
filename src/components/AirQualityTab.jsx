import { useMemo } from 'react'
import { useWeather } from '../context/WeatherContext.jsx'

export default function AirQualityTab() {
  const { airQualityData } = useWeather()

  if (!airQualityData) {
    return (
      <div className="placeholder">
        Search for a city to load air quality data.
      </div>
    )
  }

  const { hourly } = airQualityData
  const latestIndex = hourly.time.length - 1
  const aqi = hourly.us_aqi?.[latestIndex] ?? null
  const pm25 = hourly.pm2_5?.[latestIndex] ?? null
  const pm10 = hourly.pm10?.[latestIndex] ?? null

  const aqiInfo = useMemo(() => classifyAqi(aqi), [aqi])

  const chartData = hourly.time
    .slice(-24)
    .map((t, index) => ({
      time: t.split('T')[1]?.slice(0, 5),
      aqi: hourly.us_aqi?.[hourly.time.length - 24 + index] ?? 0,
    }))

  return (
    <div className="air-layout">
      <section className={`glass-card air-hero ${aqiInfo.className}`}>
        <div className="air-main">
          <div>
            <div className="air-label">Air Quality Index</div>
            <div className="air-value">{aqi ?? '—'}</div>
            <div className="air-level">
              {aqiInfo.emoji} {aqiInfo.label}
            </div>
          </div>
          <div className="air-pollutants">
            <Pollutant label="PM2.5" value={pm25} unit="µg/m³" />
            <Pollutant label="PM10" value={pm10} unit="µg/m³" />
          </div>
        </div>
        <p className="air-reco">{aqiInfo.recommendation}</p>
      </section>

      <section className="glass-card air-chart">
        <header className="section-header">
          <h2>Last 24 hours AQI</h2>
        </header>
        <div className="aqi-bars">
          {chartData.map((item) => (
            <div key={item.time} className="aqi-bar-col">
              <div
                className={`aqi-bar ${classifyAqi(item.aqi).className}`}
                style={{ height: `${Math.min(item.aqi || 0, 300) / 3 + 10}px` }}
              />
              <div className="aqi-bar-meta">
                <span className="small">{item.time}</span>
                <span className="small">{item.aqi}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Pollutant({ label, value, unit }) {
  return (
    <div className="pollutant-card">
      <div className="pollutant-label">{label}</div>
      <div className="pollutant-value">
        {value != null ? value.toFixed(1) : '—'}{' '}
        <span className="pollutant-unit">{unit}</span>
      </div>
    </div>
  )
}

function classifyAqi(aqi) {
  if (aqi == null) {
    return {
      label: 'Unknown',
      className: 'aqi-unknown',
      emoji: '❔',
      recommendation: 'No air quality information available.',
    }
  }
  if (aqi <= 50) {
    return {
      label: 'Good',
      className: 'aqi-good',
      emoji: '😊',
      recommendation: 'Air quality is considered satisfactory.',
    }
  }
  if (aqi <= 100) {
    return {
      label: 'Moderate',
      className: 'aqi-moderate',
      emoji: '😐',
      recommendation:
        'Acceptable air quality; some pollutants may be a concern for a small number of sensitive people.',
    }
  }
  if (aqi <= 150) {
    return {
      label: 'Unhealthy for sensitive',
      className: 'aqi-usg',
      emoji: '😷',
      recommendation:
        'Sensitive groups should reduce prolonged or heavy exertion outdoors.',
    }
  }
  if (aqi <= 200) {
    return {
      label: 'Unhealthy',
      className: 'aqi-unhealthy',
      emoji: '🤒',
      recommendation:
        'Everyone may begin to experience health effects; sensitive groups more serious.',
    }
  }
  if (aqi <= 300) {
    return {
      label: 'Very Unhealthy',
      className: 'aqi-very-unhealthy',
      emoji: '😨',
      recommendation:
        'Health alert: everyone may experience more serious health effects.',
    }
  }
  return {
    label: 'Hazardous',
    className: 'aqi-hazardous',
    emoji: '☠️',
    recommendation:
      'Emergency conditions: everyone should avoid all outdoor exertion.',
  }
}

