import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { getWeatherInfo } from '../utils/weatherCodes'

const WeatherContext = createContext(null)

const STORAGE_KEYS = {
  UNIT: 'weather_app_unit',
  THEME: 'weather_app_theme',
  RECENTS: 'weather_app_recent_searches',
}

export function WeatherProvider({ children }) {
  const [city, setCity] = useState('London')
  const [coordinates, setCoordinates] = useState({
    lat: null,
    lon: null,
    timezone: 'auto',
    country: '',
  })

  const [currentWeather, setCurrentWeather] = useState(null)
  const [forecastData, setForecastData] = useState(null)
  const [historyData, setHistoryData] = useState(null)
  const [historyDateRange, setHistoryDateRange] = useState({
    start: null,
    end: null,
  })
  const [airQualityData, setAirQualityData] = useState(null)

  const [activeTab, setActiveTab] = useState('today')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const [unit, setUnit] = useState('celsius')
  const [theme, setTheme] = useState('dark')
  const [recentSearches, setRecentSearches] = useState([])

  const [suggestions, setSuggestions] = useState([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  // Hydrate settings from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    const savedUnit = window.localStorage.getItem(STORAGE_KEYS.UNIT)
    const savedTheme = window.localStorage.getItem(STORAGE_KEYS.THEME)
    const savedRecents = window.localStorage.getItem(STORAGE_KEYS.RECENTS)

    if (savedUnit === 'celsius' || savedUnit === 'fahrenheit') {
      setUnit(savedUnit)
    }
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme)
    }
    if (savedRecents) {
      try {
        const parsed = JSON.parse(savedRecents)
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 5))
        }
      } catch {
        // ignore
      }
    }
  }, [])

  // Persist theme & unit
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEYS.UNIT, unit)
  }, [unit])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEYS.THEME, theme)
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(
      STORAGE_KEYS.RECENTS,
      JSON.stringify(recentSearches.slice(0, 5)),
    )
  }, [recentSearches])

  const addRecentSearch = (name, country) => {
    const key = `${name}${country ? `, ${country}` : ''}`
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.key !== key)
      return [{ key, name, country }, ...filtered].slice(0, 5)
    })
  }

  const toggleUnit = () => {
    setUnit((prev) => (prev === 'celsius' ? 'fahrenheit' : 'celsius'))
  }

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const searchCity = async (cityName) => {
    if (!cityName) return
    setIsLoading(true)
    setError(null)

    try {
      setCity(cityName)

      // 1) Current weather via Weatherstack (soft-fail: do not block forecast/history)
      try {
        const current = await fetchCurrentWeather(cityName)
        setCurrentWeather(current)
      } catch (err) {
        setError(
          (prev) =>
            prev ||
            err.message ||
            'Failed to fetch current weather from Weatherstack.',
        )
      }

      // 2) Geocode via Open-Meteo
      const geo = await fetchGeocoding(cityName)
      if (!geo) {
        throw new Error('Could not resolve this city using Open-Meteo.')
      }

      setCoordinates({
        lat: geo.latitude,
        lon: geo.longitude,
        timezone: geo.timezone,
        country: geo.country,
      })
      addRecentSearch(geo.name, geo.country)

      // 3) Forecast 16 days
      const forecast = await fetchForecast(
        geo.latitude,
        geo.longitude,
        geo.timezone,
      )
      setForecastData(forecast)

      // 4) Default history: last 7 days
      const defaultRange = getLastNDaysRange(7)
      const history = await fetchHistory(
        geo.latitude,
        geo.longitude,
        geo.timezone,
        defaultRange.start,
        defaultRange.end,
      )
      setHistoryData(history)
      setHistoryDateRange(defaultRange)

      // 5) Air quality
      const air = await fetchAirQuality(
        geo.latitude,
        geo.longitude,
        geo.timezone,
      )
      setAirQualityData(air)
    } catch (err) {
      setError(
        (prev) => prev || err.message || 'Failed to fetch weather data.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const fetchHistoryRange = async (start, end) => {
    if (!coordinates.lat || !coordinates.lon) return
    setIsLoading(true)
    setError(null)
    try {
      const history = await fetchHistory(
        coordinates.lat,
        coordinates.lon,
        coordinates.timezone || 'auto',
        start,
        end,
      )
      setHistoryData(history)
      setHistoryDateRange({ start, end })
    } catch (err) {
      setError(err.message || 'Failed to fetch historical data.')
    } finally {
      setIsLoading(false)
    }
  }

  const detectLocation = async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not available in this browser.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      })

      const lat = position.coords.latitude
      const lon = position.coords.longitude

      // Reverse lookup basic location via Open-Meteo geocoding
      const geoRes = await fetch(
        `${OPEN_METEO_GEOCODE_URL}?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`,
      )
      const geoData = await geoRes.json()

      const first = geoData?.results?.[0]
      const detectedCity = first?.name || 'Current Location'
      const timezone = first?.timezone || 'auto'

      setCity(detectedCity)
      setCoordinates({
        lat,
        lon,
        timezone,
        country: first?.country || '',
      })
      addRecentSearch(detectedCity, first?.country || '')

      // Current from Weatherstack (lat,lon as query) - soft-fail
      try {
        const current = await fetchCurrentWeather(`${lat},${lon}`)
        setCurrentWeather(current)
      } catch (err) {
        setError(
          (prev) =>
            prev ||
            err.message ||
            'Failed to fetch current weather from Weatherstack.',
        )
      }

      // Forecast
      const forecast = await fetchForecast(lat, lon, timezone)
      setForecastData(forecast)

      // Last 7 days history
      const range = getLastNDaysRange(7)
      const history = await fetchHistory(lat, lon, timezone, range.start, range.end)
      setHistoryData(history)
      setHistoryDateRange(range)

      // Air quality
      const air = await fetchAirQuality(lat, lon, timezone)
      setAirQualityData(air)
    } catch (err) {
      setError(err.message || 'Failed to detect location.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadSuggestions = async (partial) => {
    if (!partial || partial.length < 2) {
      setSuggestions([])
      return
    }

    setSuggestionsLoading(true)
    try {
      const res = await fetch(
        `${OPEN_METEO_GEOCODE_URL}?name=${encodeURIComponent(
          partial,
        )}&count=5&language=en&format=json`,
      )
      const data = await res.json()
      if (!res.ok || !data.results) {
        setSuggestions([])
      } else {
        setSuggestions(
          data.results.map((r) => ({
            name: r.name,
            country: r.country,
            lat: r.latitude,
            lon: r.longitude,
          })),
        )
      }
    } catch {
      setSuggestions([])
    } finally {
      setSuggestionsLoading(false)
    }
  }

  const clearSuggestions = () => setSuggestions([])

  const alerts = useMemo(() => {
    if (!currentWeather) return []
    const { current } = currentWeather
    if (!current) return []

    const list = []
    if (current.wind_speed > 50) {
      list.push({ type: 'wind', message: '🌪️ High Wind Warning' })
    }
    if (current.precip > 20) {
      list.push({ type: 'rain', message: '🌊 Heavy Rain Warning' })
    }
    if (current.uv_index > 8) {
      list.push({ type: 'uv', message: '☀️ High UV Warning' })
    }
    if (current.temperature > 40) {
      list.push({ type: 'heat', message: '🌡️ Extreme Heat Warning' })
    }
    if (current.temperature < 0) {
      list.push({ type: 'frost', message: '❄️ Frost Warning' })
    }
    return list
  }, [currentWeather])

  const value = {
    // Data
    city,
    coordinates,
    currentWeather,
    forecastData,
    historyData,
    historyDateRange,
    airQualityData,

    // UI state
    activeTab,
    isLoading,
    error,
    unit,
    theme,
    recentSearches,
    suggestions,
    suggestionsLoading,
    alerts,

    // Actions
    setActiveTab,
    setCity,
    toggleUnit,
    toggleTheme,
    searchCity,
    fetchHistoryRange,
    detectLocation,
    loadSuggestions,
    clearSuggestions,
  }

  return (
    <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>
  )
}

export function useWeather() {
  const ctx = useContext(WeatherContext)
  if (!ctx) {
    throw new Error('useWeather must be used within WeatherProvider')
  }
  return ctx
}

// ----------- API helpers -----------

const WEATHERSTACK_KEY =
  import.meta.env.VITE_WEATHER_API_KEY || 'ec9e10ac2bf29822ef3f708bdd508105'
const OPEN_METEO_GEOCODE_URL =
  'https://geocoding-api.open-meteo.com/v1/search'

async function fetchCurrentWeather(query) {
  const url = `http://api.weatherstack.com/current?access_key=${WEATHERSTACK_KEY}&query=${encodeURIComponent(
    query,
  )}&units=m`

  const res = await fetch(url)
  const data = await res.json()

  if (!res.ok || data.success === false) {
    throw new Error(data?.error?.info || 'Failed to fetch current weather.')
  }

  return data
}

async function fetchGeocoding(cityName) {
  const res = await fetch(
    `${OPEN_METEO_GEOCODE_URL}?name=${encodeURIComponent(
      cityName,
    )}&count=1&language=en&format=json`,
  )
  const data = await res.json()

  if (!res.ok || !data.results || !data.results.length) {
    return null
  }

  const first = data.results[0]
  return {
    latitude: first.latitude,
    longitude: first.longitude,
    name: first.name,
    country: first.country,
    timezone: first.timezone || 'auto',
  }
}

async function fetchForecast(latitude, longitude, timezone = 'auto') {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily:
      'weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,windspeed_10m_max,sunrise,sunset',
    hourly:
      'temperature_2m,precipitation_probability,weathercode,windspeed_10m',
    timezone,
    forecast_days: '16',
  })

  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
  )
  const data = await res.json()

  if (!res.ok || !data.daily || !data.daily.time) {
    throw new Error('Failed to fetch forecast from Open-Meteo.')
  }

  const daily = data.daily.time.map((date, index) => {
    const info = getWeatherInfo(data.daily.weathercode[index])
    return {
      date,
      code: data.daily.weathercode[index],
      emoji: info.emoji,
      description: info.description,
      tempMax: data.daily.temperature_2m_max[index],
      tempMin: data.daily.temperature_2m_min[index],
      precipitation: data.daily.precipitation_sum[index],
      rainProbability: data.daily.precipitation_probability_max[index],
      windSpeed: data.daily.windspeed_10m_max[index],
      sunrise: data.daily.sunrise[index],
      sunset: data.daily.sunset[index],
    }
  })

  const hourly = data.hourly

  return { daily, hourly }
}

async function fetchHistory(latitude, longitude, timezone, start, end) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    start_date: start,
    end_date: end,
    daily:
      'weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,sunrise,sunset',
    hourly: 'temperature_2m,precipitation,weathercode',
    timezone,
  })

  const res = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`,
  )
  const data = await res.json()

  if (!res.ok || !data.daily || !data.daily.time) {
    throw new Error('Failed to fetch historical data from Open-Meteo.')
  }

  const daily = data.daily.time.map((date, index) => {
    const info = getWeatherInfo(data.daily.weathercode[index])
    return {
      date,
      code: data.daily.weathercode[index],
      emoji: info.emoji,
      description: info.description,
      tempMax: data.daily.temperature_2m_max[index],
      tempMin: data.daily.temperature_2m_min[index],
      precipitation: data.daily.precipitation_sum[index],
      windSpeed: data.daily.windspeed_10m_max[index],
      sunrise: data.daily.sunrise[index],
      sunset: data.daily.sunset[index],
    }
  })

  const hourly = data.hourly

  return { daily, hourly }
}

async function fetchAirQuality(latitude, longitude, timezone = 'auto') {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    hourly: 'pm10,pm2_5,us_aqi',
    timezone,
  })

  const res = await fetch(
    `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`,
  )
  const data = await res.json()

  if (!res.ok || !data.hourly || !data.hourly.time) {
    throw new Error('Failed to fetch air quality data.')
  }

  return data
}

function getLastNDaysRange(n) {
  const endDate = new Date()
  endDate.setDate(endDate.getDate() - 1)
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - (n - 1))

  return {
    start: formatDate(startDate),
    end: formatDate(endDate),
  }
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

