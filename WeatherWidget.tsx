'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sunrise,
  Sunset,
  Sun,
} from 'lucide-react';

// ============================================
// Types
// ============================================
interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  weatherInfo: { desc: string; icon: string };
  windSpeed: number;
  windDirection: number;
  time: string;
  uvIndex: number;
}

interface DailyForecast {
  date: string;
  dayName: string;
  dateStr: string;
  weatherCode: number;
  weatherInfo: { desc: string; icon: string };
  tempMax: number;
  tempMin: number;
  precipProb: number;
  windMax: number;
  sunrise: string;
  sunset: string;
  uvIndexMax: number;
}

interface WeatherData {
  city: string;
  current: CurrentWeather;
  forecast: DailyForecast[];
}

// ============================================
// Helper functions
// ============================================
function getWindDirection(deg: number): string {
  const dirs = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];
  return dirs[Math.round(deg / 45) % 8];
}

function getUVLevel(uv: number): string {
  if (uv <= 2) return 'Thấp';
  if (uv <= 5) return 'Trung bình';
  if (uv <= 7) return 'Cao';
  if (uv <= 10) return 'Rất cao';
  return 'Cực đoan';
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// ============================================
// WeatherWidget Component
// ============================================
export default function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeather = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch('/api/weather', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error('Lỗi khi lấy dữ liệu thời tiết');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    // Auto-refresh every 3 minutes
    const interval = setInterval(() => fetchWeather(), 180000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="weather-widget weather-widget--loading">
        <div className="weather-loading-pulse">
          <div className="weather-loading-icon">🌡️</div>
          <div className="weather-loading-text">Đang tải thời tiết TP.HCM...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="weather-widget weather-widget--error">
        <span className="weather-error-icon">⚠️</span>
        <span className="weather-error-text">{error || 'Không có dữ liệu'}</span>
        <button className="weather-retry-btn" onClick={() => fetchWeather(true)}>
          <RefreshCw size={14} />
          <span>Thử lại</span>
        </button>
      </div>
    );
  }

  const { current, forecast } = data;
  const today = forecast[0];

  return (
    <div className={`weather-widget${expanded ? ' weather-widget--expanded' : ''}`}>
      {/* Header - Always visible */}
      <button className="weather-header" onClick={() => setExpanded(!expanded)}>
        <div className="weather-header-left">
          <span className="weather-city-icon">📍</span>
          <span className="weather-city-name">TP. Hồ Chí Minh</span>
          <span className="weather-current-icon">{current.weatherInfo.icon}</span>
          <span className="weather-current-temp">{current.temperature}°</span>
        </div>
        <div className="weather-header-right">
          <span className="weather-current-desc">{current.weatherInfo.desc}</span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="weather-content">
          {/* Current details */}
          <div className="weather-details-grid">
            <div className="weather-detail-item">
              <Thermometer size={16} />
              <span className="weather-detail-label">Cảm giác</span>
              <span className="weather-detail-value">{current.apparentTemperature}°C</span>
            </div>
            <div className="weather-detail-item">
              <Droplets size={16} />
              <span className="weather-detail-label">Độ ẩm</span>
              <span className="weather-detail-value">{current.humidity}%</span>
            </div>
            <div className="weather-detail-item">
              <Wind size={16} />
              <span className="weather-detail-label">Gió</span>
              <span className="weather-detail-value">{current.windSpeed} km/h {getWindDirection(current.windDirection)}</span>
            </div>
            <div className="weather-detail-item">
              <Droplets size={16} />
              <span className="weather-detail-label">Mưa</span>
              <span className="weather-detail-value">{current.precipitation} mm</span>
            </div>
            <div className="weather-detail-item">
              <Sunrise size={16} />
              <span className="weather-detail-label">Bình minh</span>
              <span className="weather-detail-value">{formatTime(today.sunrise)}</span>
            </div>
            <div className="weather-detail-item">
              <Sunset size={16} />
              <span className="weather-detail-label">Hoàng hôn</span>
              <span className="weather-detail-value">{formatTime(today.sunset)}</span>
            </div>
            <div className="weather-detail-item">
              <Sun size={16} />
              <span className="weather-detail-label">UV</span>
              <span className="weather-detail-value">{current.uvIndex ?? '—'} ({getUVLevel(current.uvIndex ?? 0)})</span>
            </div>
          </div>

          {/* 7-day forecast */}
          <div className="weather-forecast-section">
            <div className="weather-forecast-title">Dự báo 7 ngày</div>
            <div className="weather-forecast-list">
              {forecast.map((day, i) => (
                <div
                  key={day.date}
                  className={`weather-forecast-row${i === 0 ? ' weather-forecast-row--today' : ''}`}
                >
                  <span className="weather-forecast-day">
                    {i === 0 ? 'Hôm nay' : day.dayName}
                    <span className="weather-forecast-date">{day.dateStr}</span>
                  </span>
                  <span className="weather-forecast-icon">{day.weatherInfo.icon}</span>
                  <span className="weather-forecast-desc">{day.weatherInfo.desc}</span>
                  <span className="weather-forecast-precip">
                    {day.precipProb > 0 ? (
                      <>
                        <Droplets size={12} />
                        {day.precipProb}%
                      </>
                    ) : (
                      <span className="weather-forecast-precip-none">—</span>
                    )}
                  </span>
                  <div className="weather-forecast-temps">
                    <span className="weather-forecast-temp weather-forecast-temp--max">
                      {day.tempMax}°
                    </span>
                    <span className="weather-forecast-temp-divider">/</span>
                    <span className="weather-forecast-temp weather-forecast-temp--min">
                      {day.tempMin}°
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Refresh button */}
          <button className="weather-refresh-btn" onClick={() => fetchWeather(true)}>
            <RefreshCw size={14} className={refreshing ? 'weather-spin' : ''} />
            <span>Cập nhật</span>
          </button>

          {/* Source */}
          <div className="weather-source">Nguồn: Open-Meteo</div>
        </div>
      )}
    </div>
  );
}
