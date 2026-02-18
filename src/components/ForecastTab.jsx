import { useMemo, useState } from 'react'
import { useWeather } from '../context/WeatherContext.jsx'
import { getWeatherInfo } from '../utils/weatherCodes'

function cToF(c) {
  return (c * 9) / 5 + 32
}

export default function ForecastTab() {
  const { forecastData, unit } = useWeather()
  const [view, setView] = useState('daily')
  const [selectedDate, setSelectedDate] = useState(null)

  const daily = forecastData?.daily || []
  const hourly = forecastData?.hourly || null

  const selectedIndex =
    selectedDate != null
      ? daily.findIndex((d) => d.date === selectedDate)
      : daily.length
  const focused =
    selectedIndex >= 0 && selectedIndex < daily.length
      ? daily[selectedIndex]
      : daily[0]

  const hourlyForSelected = useMemo(() => {
    if (!hourly || !hourly.time || !focused) return []
    const prefix = focused.date
    return hourly.time
      .map((t, index) => {
        if (!t.startsWith(prefix)) return null
        const hour = t.split('T')[1]?.slice(0, 5)
        const tempC = hourly.temperature_2m[index]
        const precip = hourly.precipitation_probability?.[index] ?? 0
        const wind = hourly.windspeed_10m?.[index] ?? 0
        const info = getWeatherInfo(hourly.weathercode[index])
        return {
          time: hour,
          tempC,
          precip,
          wind,
          emoji: info.emoji,
        }
      })
      .filter(Boolean)
  }, [hourly, focused])

  if (!forecastData) {
    return (
      <div className="placeholder">
        Search for a city to load 16-day forecast.
      </div>
    )
  }

  return (
    <div className="forecast-layout">
      <div className="forecast-toolbar">
        <div className="view-toggle glass-pill">
          <button
            type="button"
            className={view === 'daily' ? 'active' : ''}
            onClick={() => setView('daily')}
          >
            Daily
          </button>
          <button
            type="button"
            className={view === 'hourly' ? 'active' : ''}
            onClick={() => setView('hourly')}
          >
            Hourly
          </button>
        </div>
      </div>

      {view === 'daily' ? (
        <DailyForecast
          daily={daily}
          unit={unit}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          hourly={hourly}
        />
      ) : (
        <HourlyView
          focused={focused}
          hourlyForSelected={hourlyForSelected}
          unit={unit}
        />
      )}
    </div>
  )
}

function DailyForecast({ daily, unit, selectedDate, onSelectDate }) {
  if (!daily || !daily.length) {
    return (
      <div className="placeholder">
        No forecast data returned from Open-Meteo.
      </div>
    )
  }

  const getLabel = (date, index) => {
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date()
    tomorrow.setDate(new Date().getDate() + 1)
    const tom = tomorrow.toISOString().split('T')[0]
    if (date === today) return 'Today'
    if (date === tom) return 'Tomorrow'
    return new Date(date).toLocaleDateString(undefined, { weekday: 'long' })
  }

  return (
    <div className="forecast-daily-grid">
      {daily.map((day, index) => {
        const max =
          unit === 'celsius'
            ? `${Math.round(day.tempMax)}°C`
            : `${Math.round(cToF(day.tempMax))}°F`
        const min =
          unit === 'celsius'
            ? `${Math.round(day.tempMin)}°C`
            : `${Math.round(cToF(day.tempMin))}°F`
        const label = getLabel(day.date, index)
        return (
          <details
            key={day.date}
            className={`forecast-day-card glass-card ${
              selectedDate === day.date ? 'selected' : ''
            }`}
            onClick={() => onSelectDate(day.date)}
          >
            <summary>
              <div className="forecast-day-header">
                <div className="forecast-day-main">
                  <div className="forecast-day-title">
                    <span className="forecast-day-name">{label}</span>
                    <span className="forecast-day-date">
                      {new Date(day.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="forecast-day-emoji">{day.emoji}</div>
                </div>
                <div className="forecast-day-meta">
                  <span className="max-temp">{max}</span>
                  <span className="min-temp">{min}</span>
                  <span className="forecast-tag">
                    🌧 {Math.round(day.rainProbability ?? 0)}%
                  </span>
                  <span className="forecast-tag">
                    💧 {day.precipitation?.toFixed(1) ?? 0} mm
                  </span>
                  <span className="forecast-tag">
                    💨 {Math.round(day.windSpeed ?? 0)} km/h
                  </span>
                </div>
              </div>
            </summary>
            <div className="forecast-day-extra">
              <div>
                <strong>Sunrise:</strong> {formatTime(day.sunrise)}
              </div>
              <div>
                <strong>Sunset:</strong> {formatTime(day.sunset)}
              </div>
            </div>
          </details>
        )
      })}
    </div>
  )
}

function HourlyView({ focused, hourlyForSelected, unit }) {
  if (!focused) {
    return (
      <div className="placeholder">
        Select a day in the daily view to inspect its hourly timeline.
      </div>
    )
  }

  if (!hourlyForSelected.length) {
    return (
      <div className="placeholder">
        No hourly data available for this day.
      </div>
    )
  }

  const temps = hourlyForSelected.map((h) => h.tempC)
  const minTemp = Math.min(...temps)
  const maxTemp = Math.max(...temps)
  const range = maxTemp - minTemp || 1

  return (
    <div className="glass-card hourly-view">
      <header className="section-header">
        <h2>
          Hourly for{' '}
          {new Date(focused.date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </h2>
      </header>
      <div className="hourly-graph-scroll">
        <div className="hourly-graph">
          {hourlyForSelected.map((h) => {
            const norm = (h.tempC - minTemp) / range
            const height = 40 + norm * 60
            const temp =
              unit === 'celsius'
                ? `${Math.round(h.tempC)}°C`
                : `${Math.round(cToF(h.tempC))}°F`
            return (
              <div key={h.time} className="hourly-bar-col">
                <div className="hourly-bar" style={{ height: `${height}px` }}>
                  <span className="hourly-bar-temp">{temp}</span>
                </div>
                <div className="hourly-bar-meta">
                  <div>{h.emoji}</div>
                  <div className="small">{h.time}</div>
                  <div className="small">
                    💧 {h.precip ?? 0}% · 💨 {Math.round(h.wind)} km/h
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function formatTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

