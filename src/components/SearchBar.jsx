import { useEffect, useState } from 'react'
import { useWeather } from '../context/WeatherContext.jsx'

const FLAG_BASE = 'https://flagcdn.com/24x18'

function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return ''
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

export default function SearchBar() {
  const {
    city,
    setCity,
    searchCity,
    detectLocation,
    recentSearches,
    suggestions,
    suggestionsLoading,
    loadSuggestions,
    clearSuggestions,
    unit,
    toggleUnit,
  } = useWeather()

  const [inputValue, setInputValue] = useState(city)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    setInputValue(city)
  }, [city])

  const handleChange = (e) => {
    const value = e.target.value
    setInputValue(value)
    setCity(value)
    loadSuggestions(value)
    setShowDropdown(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return
    searchCity(inputValue.trim())
    setShowDropdown(false)
  }

  const handleSelectSuggestion = (item) => {
    const label = item.country ? `${item.name}, ${item.country}` : item.name
    setInputValue(label)
    setCity(label)
    searchCity(label)
    clearSuggestions()
    setShowDropdown(false)
  }

  const handleSelectRecent = (item) => {
    const label = item.key
    setInputValue(label)
    setCity(label)
    searchCity(label)
    setShowDropdown(false)
  }

  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 150)
  }

  return (
    <section className="search-section glass-card">
      <form className="search-form" onSubmit={handleSubmit}>
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-bar"
            type="text"
            placeholder="Search any city worldwide..."
            value={inputValue}
            onChange={handleChange}
            onFocus={() => setShowDropdown(true)}
            onBlur={handleBlur}
          />

          <button
            type="button"
            className="pill-toggle secondary"
            onClick={detectLocation}
            title="Use current location"
          >
            🎯
          </button>

          <button type="submit" className="primary-button">
            Search
          </button>
        </div>

        <div className="search-extra">
          <button
            type="button"
            className="pill-toggle"
            onClick={toggleUnit}
            title="Toggle temperature unit"
          >
            {unit === 'celsius' ? '°C / °F' : '°F / °C'}
          </button>
        </div>
      </form>

      {showDropdown && (suggestions.length > 0 || recentSearches.length > 0) && (
        <div className="search-dropdown glass-card">
          {suggestionsLoading && <div className="dropdown-section">Loading…</div>}

          {suggestions.length > 0 && (
            <div className="dropdown-section">
              <div className="dropdown-title">Suggestions</div>
              {suggestions.map((s) => (
                <button
                  type="button"
                  key={`${s.name}-${s.country}-${s.lat}-${s.lon}`}
                  className="dropdown-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectSuggestion(s)}
                >
                  <span className="dropdown-label">
                    {getFlagEmoji(s.country_code || '')}{' '}
                    {s.name}
                    {s.country ? `, ${s.country}` : ''}
                  </span>
                  <span className="dropdown-sub">
                    {s.lat.toFixed(2)}, {s.lon.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {recentSearches.length > 0 && (
            <div className="dropdown-section">
              <div className="dropdown-title">Recent searches</div>
              {recentSearches.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  className="dropdown-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectRecent(item)}
                >
                  <span className="dropdown-label">
                    {getFlagEmoji(item.country_code || '')} {item.key}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

