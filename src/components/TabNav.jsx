import { useWeather } from '../context/WeatherContext.jsx'

const TABS = [
  { id: 'today', label: 'Today', icon: '🌡️' },
  { id: 'forecast', label: 'Forecast', icon: '📅' },
  { id: 'history', label: 'History', icon: '📜' },
  { id: 'air', label: 'Air Quality', icon: '💨' },
]

export default function TabNav({ activeTab, onChange }) {
  const { isLoading } = useWeather()

  return (
    <nav className="tab-nav glass-card">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
          disabled={isLoading}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}

