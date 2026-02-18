export const getWeatherInfo = (code) => {
  const codes = {
    0: { emoji: '☀️', description: 'Clear Sky', bg: '#FFD700' },
    1: { emoji: '🌤️', description: 'Mainly Clear', bg: '#87CEEB' },
    2: { emoji: '⛅', description: 'Partly Cloudy', bg: '#87CEEB' },
    3: { emoji: '☁️', description: 'Overcast', bg: '#808080' },
    45: { emoji: '🌫️', description: 'Foggy', bg: '#B0C4DE' },
    48: { emoji: '🌫️', description: 'Icy Fog', bg: '#B0C4DE' },
    51: { emoji: '🌦️', description: 'Light Drizzle', bg: '#4682B4' },
    53: { emoji: '🌦️', description: 'Drizzle', bg: '#4682B4' },
    55: { emoji: '🌧️', description: 'Heavy Drizzle', bg: '#4169E1' },
    61: { emoji: '🌧️', description: 'Light Rain', bg: '#4169E1' },
    63: { emoji: '🌧️', description: 'Rain', bg: '#0000CD' },
    65: { emoji: '🌧️', description: 'Heavy Rain', bg: '#00008B' },
    71: { emoji: '🌨️', description: 'Light Snow', bg: '#E0FFFF' },
    73: { emoji: '🌨️', description: 'Snow', bg: '#E0FFFF' },
    75: { emoji: '❄️', description: 'Heavy Snow', bg: '#B0E0E6' },
    77: { emoji: '🌨️', description: 'Snow Grains', bg: '#E0FFFF' },
    80: { emoji: '🌦️', description: 'Light Showers', bg: '#4682B4' },
    81: { emoji: '🌧️', description: 'Rain Showers', bg: '#4169E1' },
    82: { emoji: '⛈️', description: 'Heavy Showers', bg: '#00008B' },
    85: { emoji: '🌨️', description: 'Snow Showers', bg: '#E0FFFF' },
    86: { emoji: '❄️', description: 'Heavy Snow Showers', bg: '#B0E0E6' },
    95: { emoji: '⛈️', description: 'Thunderstorm', bg: '#2F4F4F' },
    96: { emoji: '⛈️', description: 'Thunderstorm with Hail', bg: '#1C1C1C' },
    99: { emoji: '⛈️', description: 'Heavy Thunderstorm', bg: '#000000' },
  }
  return codes[code] || {
    emoji: '🌡️',
    description: 'Unknown',
    bg: '#808080',
  }
}

