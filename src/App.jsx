import './App.css'
import { useWeather } from './context/WeatherContext.jsx'
import TodayTab from './components/TodayTab.jsx'
import ForecastTab from './components/ForecastTab.jsx'
import HistoryTab from './components/HistoryTab.jsx'
import AirQualityTab from './components/AirQualityTab.jsx'
import SearchBar from './components/SearchBar.jsx'
import TabNav from './components/TabNav.jsx'
import AlertsBanner from './components/AlertsBanner.jsx'

function App() {
  const { activeTab, setActiveTab, theme, toggleTheme } = useWeather()

  return (
    <div className={`app-root theme-${theme}`}>
      <BackgroundOrbs />

      <div className="app-shell">
        <header className="app-header">
          <div className="app-header-main">
            <h1 className="app-title">Weather Intelligence</h1>
            <p className="app-subtitle">
              Real-time weather from Weatherstack · 16-day forecast, history &
              air quality from Open-Meteo.
            </p>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="pill-toggle"
              onClick={toggleTheme}
            >
              <span>{theme === 'dark' ? '🌙 Dark' : '☀️ Light'}</span>
            </button>
          </div>
        </header>

        <AlertsBanner />

        <SearchBar />

        <TabNav activeTab={activeTab} onChange={setActiveTab} />

        <main className="tab-content">
          {activeTab === 'today' && <TodayTab />}
          {activeTab === 'forecast' && <ForecastTab />}
          {activeTab === 'history' && <HistoryTab />}
          {activeTab === 'air' && <AirQualityTab />}
        </main>

        <footer className="app-footer">
          <span>Powered by Weatherstack & Open-Meteo</span>
        </footer>
      </div>
    </div>
  )
}

function BackgroundOrbs() {
  return (
    <div className="animated-bg">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="bg-overlay" />
    </div>
  )
}

export default App
