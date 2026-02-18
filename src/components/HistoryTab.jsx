import { useEffect, useMemo, useState } from 'react'
import { useWeather } from '../context/WeatherContext.jsx'

function cToF(c) {
  return (c * 9) / 5 + 32
}

const QUICK_RANGES = [
  { id: '7', label: 'Last 7 Days', days: 7 },
  { id: '30', label: 'Last 30 Days', days: 30 },
  { id: '90', label: 'Last 3 Months', days: 90 },
  { id: '180', label: 'Last 6 Months', days: 180 },
  { id: '365', label: 'Last 1 Year', days: 365 },
  { id: '3650', label: 'Last 10 Years', days: 3650 },
  { id: '7300', label: 'Last 20 Years', days: 7300 },
]

export default function HistoryTab() {
  const {
    historyData,
    historyDateRange,
    fetchHistoryRange,
    unit,
    coordinates,
    isLoading,
  } = useWeather()

  const today = new Date()
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() - 1)

  const [start, setStart] = useState(historyDateRange.start || '')
  const [end, setEnd] = useState(historyDateRange.end || '')

  // Keep inputs in sync with latest loaded range
  useEffect(() => {
    if (historyDateRange.start) setStart(historyDateRange.start)
    if (historyDateRange.end) setEnd(historyDateRange.end)
  }, [historyDateRange.start, historyDateRange.end])

  const handleQuick = (days) => {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 1)
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - (days - 1))
    
    // Ensure start date doesn't go before 1940 (Open-Meteo limit)
    const minDate = new Date('1940-01-01')
    if (startDate < minDate) {
      startDate.setTime(minDate.getTime())
    }
    
    const s = toDateInput(startDate)
    const e = toDateInput(endDate)
    setStart(s)
    setEnd(e)
    fetchHistoryRange(s, e)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!start || !end) return
    fetchHistoryRange(start, end)
  }

  const summaryStats = useMemo(() => {
    if (!historyData?.daily || !historyData.daily.length) return null
    const days = historyData.daily
    let hottest = days[0]
    let coldest = days[0]
    let wettest = days[0]
    let totalRain = 0
    let totalTemp = 0

    for (const d of days) {
      if (d.tempMax > hottest.tempMax) hottest = d
      if (d.tempMin < coldest.tempMin) coldest = d
      if (d.precipitation > wettest.precipitation) wettest = d
      totalRain += d.precipitation
      totalTemp += (d.tempMax + d.tempMin) / 2
    }

    const avgTemp = totalTemp / days.length

    return { hottest, coldest, wettest, avgTemp, totalRain }
  }, [historyData])

  return (
    <div className="history-layout">
      <form className="glass-card history-controls" onSubmit={handleSubmit}>
        <div className="date-row">
          <div className="field-group">
            <label>Start date</label>
            <input
              type="date"
              min="1940-01-01"
              max={toDateInput(maxDate)}
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div className="field-group">
            <label>End date</label>
            <input
              type="date"
              min="1940-01-01"
              max={toDateInput(maxDate)}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
          <button type="submit" className="primary-button">
            Get History
          </button>
        </div>

        <div className="quick-row">
          {QUICK_RANGES.map((q) => (
            <button
              key={q.id}
              type="button"
              className="pill-toggle secondary"
              onClick={() => handleQuick(q.days)}
            >
              {q.label}
            </button>
          ))}
        </div>
      </form>

      {isLoading && !historyData ? (
        <div className="placeholder">
          Loading historical weather data...
        </div>
      ) : !historyData?.daily || !historyData.daily.length ? (
        <div className="placeholder">
          {coordinates.lat && coordinates.lon
            ? 'Choose a date range or quick preset to see historical weather.'
            : 'Search for a city first to load historical weather data.'}
        </div>
      ) : (
        <>
          {summaryStats && (
            <section className="glass-card history-summary">
              <header className="section-header">
                <h2>Summary statistics</h2>
              </header>
              <div className="summary-grid">
                <SummaryCard
                  icon="🔥"
                  label="Hottest day"
                  value={formatDate(summaryStats.hottest.date)}
                  detail={`${Math.round(summaryStats.hottest.tempMax)}°C`}
                />
                <SummaryCard
                  icon="❄️"
                  label="Coldest day"
                  value={formatDate(summaryStats.coldest.date)}
                  detail={`${Math.round(summaryStats.coldest.tempMin)}°C`}
                />
                <SummaryCard
                  icon="🌧️"
                  label="Wettest day"
                  value={formatDate(summaryStats.wettest.date)}
                  detail={`${summaryStats.wettest.precipitation.toFixed(1)} mm`}
                />
                <SummaryCard
                  icon="🌡️"
                  label="Average temperature"
                  value={
                    unit === 'celsius'
                      ? `${summaryStats.avgTemp.toFixed(1)}°C`
                      : `${cToF(summaryStats.avgTemp).toFixed(1)}°F`
                  }
                />
                <SummaryCard
                  icon="💧"
                  label="Total rainfall"
                  value={`${summaryStats.totalRain.toFixed(1)} mm`}
                />
              </div>
            </section>
          )}

          <section className="glass-card history-days">
            <header className="section-header">
              <h2>Daily history</h2>
            </header>
            <div className="history-list">
              {historyData.daily.map((d) => {
                const max =
                  unit === 'celsius'
                    ? `${Math.round(d.tempMax)}°C`
                    : `${Math.round(cToF(d.tempMax))}°F`
                const min =
                  unit === 'celsius'
                    ? `${Math.round(d.tempMin)}°C`
                    : `${Math.round(cToF(d.tempMin))}°F`
                return (
                  <details key={d.date} className="history-day">
                    <summary>
                      <div className="history-day-main">
                        <span className="history-date">
                          {formatDate(d.date)}
                        </span>
                        <span className="history-temps">
                          {max} / {min}
                        </span>
                        <span className="history-rain">
                          🌧 {d.precipitation.toFixed(1)} mm
                        </span>
                        <span className="history-wind">
                          💨 {Math.round(d.windSpeed ?? 0)} km/h
                        </span>
                      </div>
                    </summary>
                    {/* For brevity we just show meta; hourly detail is in context data */}
                    <div className="history-day-extra">
                      <div>
                        <strong>Sunrise: </strong>
                        {formatTime(d.sunrise)}
                      </div>
                      <div>
                        <strong>Sunset: </strong>
                        {formatTime(d.sunset)}
                      </div>
                    </div>
                  </details>
                )
              })}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function SummaryCard({ icon, label, value, detail }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {detail && <div className="stat-extra">{detail}</div>}
    </div>
  )
}

function toDateInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

