'use client';

import React, { useState, useEffect, useCallback, useSyncExternalStore, useRef, useMemo } from 'react';
import { Clock, Eye, EyeOff } from 'lucide-react';
import FlipUnit from './FlipUnit';
import WeatherWidget from '@/components/weather/WeatherWidget';

// ============================================
// Time hook — fires EXACTLY at each second
// ============================================
function useCurrentTime() {
  const [time, setTime] = useState(() => new Date());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let lastSec = -1;
    function scheduleNext() {
      const now = Date.now();
      const msUntilNextSecond = 1000 - (now % 1000);
      const delay = Math.max(msUntilNextSecond - 4, 1);
      timerRef.current = setTimeout(() => {
        const d = new Date();
        if (d.getSeconds() !== lastSec) {
          lastSec = d.getSeconds();
          setTime(d);
        }
        scheduleNext();
      }, delay);
    }
    scheduleNext();
    const onVisibility = () => {
      if (!document.hidden) {
        if (timerRef.current) clearTimeout(timerRef.current);
        const d = new Date();
        if (d.getSeconds() !== lastSec) {
          lastSec = d.getSeconds();
          setTime(d);
        }
        scheduleNext();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  return time;
}

function useIsMounted() {
  const subscribe = useCallback(() => () => {}, []);
  return useSyncExternalStore(subscribe, () => true, () => false);
}

// ============================================
// Vietnamese date formatting
// ============================================
function getVietnameseWeekday(day: number): string {
  return ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][day];
}

function formatDateVi(date: Date) {
  const weekday = getVietnameseWeekday(date.getDay());
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  const dateStr = `Ngày ${d} tháng ${m} năm ${y}`;
  const h = date.getHours();
  const timeStr = `${h}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  let greeting = '';
  if (h >= 5 && h < 12) greeting = 'Chào buổi sáng';
  else if (h >= 12 && h < 18) greeting = 'Chào buổi chiều';
  else if (h >= 18 && h < 22) greeting = 'Chào buổi tối';
  else greeting = 'Chúc ngủ ngon';
  return { weekday, dateStr, timeStr, greeting };
}

// ============================================
// localStorage helpers
// ============================================
function loadSetting<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(`fliqlo_${key}`);
    if (raw !== null) return JSON.parse(raw) as T;
  } catch {}
  return fallback;
}

function saveSetting<T>(key: string, value: T) {
  try { localStorage.setItem(`fliqlo_${key}`, JSON.stringify(value)); } catch {}
}

// ============================================
// Main Component
// ============================================
export default function FlipClock() {
  const time = useCurrentTime();
  const mounted = useIsMounted();

  // Settings
  const [is24Hour, setIs24Hour] = useState(() => loadSetting('is24Hour', true));
  const [showSeconds, setShowSeconds] = useState(() => loadSetting('showSeconds', false));
  const [isNewYearEffect, setIsNewYearEffect] = useState(false);
  const prevDateRef = useRef<string>('');
  const prevHourRef = useRef<number>(-1);


  // Save settings
  useEffect(() => { saveSetting('is24Hour', is24Hour); }, [is24Hour]);
  useEffect(() => { saveSetting('showSeconds', showSeconds); }, [showSeconds]);


  // Colon blink
  const colonDotsRef = useRef<(HTMLSpanElement | null)[]>([]);
  useEffect(() => {
    let on = true;
    const timer = setInterval(() => {
      on = !on;
      colonDotsRef.current.forEach((el) => { if (el) el.style.opacity = on ? '1' : '0.15'; });
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // Memoize time strings
  const hours = useMemo(() => {
    if (is24Hour) return time.getHours().toString().padStart(2, '0');
    const h = time.getHours() % 12;
    return (h === 0 ? 12 : h).toString().padStart(2, '0');
  }, [time, is24Hour]);
  const minutes = useMemo(() => time.getMinutes().toString().padStart(2, '0'), [time]);
  const seconds = useMemo(() => time.getSeconds().toString().padStart(2, '0'), [time]);
  const ampm = useMemo(() => (time.getHours() >= 12 ? 'PM' : 'AM'), [time]);
  const dateInfo = useMemo(() => formatDateVi(time), [time]);

  // Detect day change (midnight) effect
  useEffect(() => {
    const currentDate = `${time.getFullYear()}-${time.getMonth()}-${time.getDate()}`;
    const currentHour = time.getHours();
    if (prevDateRef.current && prevDateRef.current !== currentDate) {
      setIsNewYearEffect(true);
      setTimeout(() => setIsNewYearEffect(false), 5000);
    }
    // Also trigger at 00:00:00 transition
    if (prevHourRef.current === 23 && currentHour === 0) {
      setIsNewYearEffect(true);
      setTimeout(() => setIsNewYearEffect(false), 5000);
    }
    prevDateRef.current = currentDate;
    prevHourRef.current = currentHour;
  }, [time]);

  if (!mounted) return null;

  return (
    <div className={`flip-clock-wrapper${isNewYearEffect ? ' midnight-effect' : ''}`}>
      {isNewYearEffect && (
        <div className="midnight-overlay">
          <div className="midnight-stars"></div>
          {/* Confetti particles */}
          <div className="midnight-confetti">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="confetti-particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 3}s`,
                  backgroundColor: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#ff9ff3', '#54a0ff'][i % 7],
                  width: `${6 + Math.random() * 8}px`,
                  height: `${6 + Math.random() * 8}px`,
                }}
              />
            ))}
          </div>
          {/* Ripple rings */}
          <div className="midnight-ripple">
            <div className="ripple-ring" style={{ animationDelay: '0s' }} />
            <div className="ripple-ring" style={{ animationDelay: '0.5s' }} />
            <div className="ripple-ring" style={{ animationDelay: '1s' }} />
          </div>
          <div className="midnight-message">
            <span>Chúc mừng ngày mới!</span>
          </div>
        </div>
      )}
      <main className="flip-clock-main">
        <div className={`flip-clock-display${isNewYearEffect ? ' midnight-flip-glow' : ''}`}>
          <FlipUnit value={hours} size="large" isMidnight={isNewYearEffect} />
          <div className="flip-colon">
            <span ref={(el) => { colonDotsRef.current[0] = el; }} className="flip-colon__dot" />
            <span ref={(el) => { colonDotsRef.current[1] = el; }} className="flip-colon__dot" />
          </div>
          <FlipUnit value={minutes} size="large" isMidnight={isNewYearEffect} />
          {showSeconds && (
            <>
              <div className="flip-colon">
                <span ref={(el) => { colonDotsRef.current[2] = el; }} className="flip-colon__dot flip-colon__dot--small" />
                <span ref={(el) => { colonDotsRef.current[3] = el; }} className="flip-colon__dot flip-colon__dot--small" />
              </div>
              <FlipUnit value={seconds} size="small" isMidnight={isNewYearEffect} />
            </>
          )}
        </div>

        {!is24Hour && (
          <div className="flip-ampm"><span>{ampm}</span></div>
        )}

        <div className="flip-date-container">
          <div className="flip-date-greeting">{dateInfo.greeting}</div>
          <div className="flip-date-weekday">{dateInfo.weekday}</div>
          <div className="flip-date-full">{dateInfo.dateStr}</div>
          <div className="flip-date-time-text">{dateInfo.timeStr}</div>
        </div>

        {/* Weather Widget */}
        <div className="flip-weather-container">
          <WeatherWidget />
        </div>
      </main>

      {/* === Control Panel === */}
      <div className="flip-controls">
        <button onClick={() => setIs24Hour(!is24Hour)} className="flip-controls__btn" title={is24Hour ? '12H' : '24H'}>
          <Clock size={16} />
          <span>{is24Hour ? '24H' : '12H'}</span>
        </button>
        <button onClick={() => setShowSeconds(!showSeconds)} className="flip-controls__btn" title={showSeconds ? 'Ẩn giây' : 'Hiện giây'}>
          {showSeconds ? <EyeOff size={16} /> : <Eye size={16} />}
          <span>{showSeconds ? 'Ẩn Sec' : 'Hiện Sec'}</span>
        </button>
      </div>
    </div>
  );
}
