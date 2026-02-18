import { useEffect, useMemo, useState } from 'react'
import { useWeather } from '../context/WeatherContext.jsx'
import { getWeatherInfo } from '../utils/weatherCodes'

function cToF(c) {
  return (c * 9) / 5 + 32
}

export default function TodayTab() {
  const { currentWeather, forecastData, unit, coordinates, isLoading } =
    useWeather()

  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const hourlyToday = useMemo(() => {
    if (!forecastData?.hourly) return []
    const { time, temperature_2m, precipitation_probability, weathercode, windspeed_10m } =
      forecastData.hourly
    if (!time) return []

    const todayDate = time[0]?.split('T')[0]
    return time
      .map((t, index) => {
        if (!t.startsWith(todayDate)) return null
        const hour = t.split('T')[1]?.slice(0, 5)
        const code = weathercode[index]
        const info = getWeatherInfo(code)
        return {
          time: hour,
          tempC: temperature_2m[index],
          rainProb: precipitation_probability[index],
          wind: windspeed_10m[index],
          emoji: info.emoji,
        }
      })
      .filter(Boolean)
      .slice(0, 24)
  }, [forecastData])

  const summary = useMemo(() => {
    if (!currentWeather) return ''
    const { current } = currentWeather
    if (!current) return ''
    const desc = current.weather_descriptions?.[0] || 'weather'
    return `Expect ${desc.toLowerCase()} with temperatures around ${
      current.temperature
    }°C and humidity near ${current.humidity}%.`
  }, [currentWeather])

  if (!currentWeather && !isLoading) {
    return (
      <div className="placeholder">
        Search for a city to see today&apos;s weather and hourly forecast.
      </div>
    )
  }

  const { location = {}, current = {} } = currentWeather || {}
  const tempC = current.temperature ?? null
  const tempDisplay =
    tempC == null
      ? '--'
      : unit === 'celsius'
      ? `${Math.round(tempC)}°C`
      : `${Math.round(cToF(tempC))}°F`

  const feelsC = current.feelslike ?? null
  const feelsDisplay =
    feelsC == null
      ? '--'
      : unit === 'celsius'
      ? `${Math.round(feelsC)}°C`
      : `${Math.round(cToF(feelsC))}°F`

  const uv = current.uv_index ?? null
  const uvClass = getUvClass(uv)
  const uvLabel = getUvLabel(uv)

  const weatherInfo = getWeatherInfo(current.weather_code)

  const localTime =
    location?.localtime || coordinates?.timezone || now.toISOString()

  return (
    <div className="today-layout">
      <section className="today-hero glass-card">
        <div className="today-header">
          <div>
            <div className="today-location">
              <span className="today-city">
                {location.name || '—'}
                {location.country ? `, ${location.country}` : ''}
              </span>
            </div>
            <div className="today-time">
              {new Date(localTime).toLocaleString(undefined, {
                weekday: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
              <span className="live-dot">● live</span>
            </div>
          </div>
          <div className="today-emoji">{weatherInfo.emoji}</div>
        </div>

        <div className="today-main">
          <div className="today-temp-main">
            <div className="today-temp-value">{tempDisplay}</div>
            <div className="today-desc">
              {current.weather_descriptions?.[0] || weatherInfo.description}
            </div>
            <div className="today-feels">Feels like {feelsDisplay}</div>
            <div className="today-updated">
              Last updated{' '}
              {current.observation_time || new Date().toLocaleTimeString()}
            </div>
          </div>

          <div className="today-stats-grid">
            <StatCard label="Humidity" value={`${current.humidity ?? '--'}%`} />
            <StatCard
              label="Wind"
              value={`${current.wind_speed ?? '--'} km/h ${current.wind_dir || ''}`}
            />
            <StatCard
              label="Visibility"
              value={`${current.visibility ?? '--'} km`}
            />
            <StatCard
              label="Pressure"
              value={`${current.pressure ?? '--'} mb`}
            />
            <StatCard
              label="UV Index"
              value={uv ?? '--'}
              extra={uvLabel}
              className={uvClass}
            />
          </div>
        </div>
      </section>

      <section className="glass-card today-hourly">
        <header className="section-header">
          <h2>Today&apos;s hourly forecast</h2>
        </header>
        {hourlyToday.length === 0 ? (
          <div className="placeholder small">
            Hourly data not available yet. Try searching a major city.
          </div>
        ) : (
          <div className="hourly-scroll">
            {hourlyToday.map((h) => {
              const temp =
                unit === 'celsius'
                  ? `${Math.round(h.tempC)}°C`
                  : `${Math.round(cToF(h.tempC))}°F`
              return (
                <div key={h.time} className="hourly-pill">
                  <div className="hourly-time">{h.time}</div>
                  <div className="hourly-emoji">{h.emoji}</div>
                  <div className="hourly-temp">{temp}</div>
                  <div className="hourly-rain">
                    <div className="rain-bar-wrap">
                      <div
                        className="rain-bar"
                        style={{ height: `${Math.min(h.rainProb, 100)}%` }}
                      />
                    </div>
                    <span>{h.rainProb ?? 0}%</span>
                  </div>
                  <div className="hourly-wind">{Math.round(h.wind)} km/h</div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {summary && (
        <section className="glass-card today-summary">
          <header className="section-header">
            <h2>Today&apos;s summary</h2>
          </header>
          <p>{summary}</p>
        </section>
      )}
    </div>
  )
}

function StatCard({ label, value, extra, className = '' }) {
  return (
    <div className={`stat-card ${className}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {extra && <div className="stat-extra">{extra}</div>}
    </div>
  )
}

function getUvClass(uv) {
  if (uv == null) return ''
  if (uv <= 2) return 'uv-low'
  if (uv <= 5) return 'uv-moderate'
  if (uv <= 7) return 'uv-high'
  if (uv <= 10) return 'uv-very-high'
  return 'uv-extreme'
}

function getUvLabel(uv) {
  if (uv == null) return ''
  if (uv <= 2) return 'Low'
  if (uv <= 5) return 'Moderate'
  if (uv <= 7) return 'High'
  if (uv <= 10) return 'Very High'
  return 'Extreme'
}

