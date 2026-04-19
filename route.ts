import { NextResponse } from 'next/server';

// Ho Chi Minh City coordinates
const HCMC_LAT = 10.8231;
const HCMC_LON = 106.6297;

// WMO Weather interpretation codes mapping to Vietnamese descriptions and icons
const weatherCodeMap: Record<number, { desc: string; icon: string }> = {
  0: { desc: 'Trời quang', icon: '☀️' },
  1: { desc: 'Hầu hết quang', icon: '🌤️' },
  2: { desc: 'Có mây ít', icon: '⛅' },
  3: { desc: 'Mây nhiều', icon: '☁️' },
  45: { desc: 'Sương mù', icon: '🌫️' },
  48: { desc: 'Sương giá', icon: '🌫️' },
  51: { desc: 'Mưa nhẹ', icon: '🌦️' },
  53: { desc: 'Mưa vừa', icon: '🌦️' },
  55: { desc: 'Mưa rào', icon: '🌧️' },
  56: { desc: 'Mưa lạnh nhẹ', icon: '🌧️' },
  57: { desc: 'Mưa lạnh dông', icon: '🌧️' },
  61: { desc: 'Mưa nhỏ', icon: '🌧️' },
  63: { desc: 'Mưa vừa', icon: '🌧️' },
  65: { desc: 'Mưa to', icon: '🌧️' },
  66: { desc: 'Mưa lạnh nhỏ', icon: '🌨️' },
  67: { desc: 'Mưa lạnh to', icon: '🌨️' },
  71: { desc: 'Tuyết nhỏ', icon: '🌨️' },
  73: { desc: 'Tuyết vừa', icon: '🌨️' },
  75: { desc: 'Tuyết to', icon: '❄️' },
  77: { desc: 'Hạt tuyết', icon: '🌨️' },
  80: { desc: 'Mưa rào nhỏ', icon: '🌦️' },
  81: { desc: 'Mưa rào vừa', icon: '🌧️' },
  82: { desc: 'Mưa rào to', icon: '⛈️' },
  85: { desc: 'Tuyết rào nhỏ', icon: '🌨️' },
  86: { desc: 'Tuyết rào to', icon: '❄️' },
  95: { desc: 'Giông bão', icon: '⛈️' },
  96: { desc: 'Giông bão有小冰雹', icon: '⛈️' },
  99: { desc: 'Giông bão有大冰雹', icon: '⛈️' },
};

function getWeatherInfo(code: number): { desc: string; icon: string } {
  return weatherCodeMap[code] || { desc: 'Không rõ', icon: '🌡️' };
}

export async function GET() {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${HCMC_LAT}&longitude=${HCMC_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset,uv_index_max&timezone=Asia/Ho_Chi_Minh&forecast_days=7`;

    const response = await fetch(url, {
      next: { revalidate: 180 }, // Cache for 3 minutes
    });

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform current weather
    const current = data.current;
    const currentWeather = {
      temperature: Math.round(current.temperature_2m),
      apparentTemperature: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      precipitation: current.precipitation,
      weatherCode: current.weather_code,
      weatherInfo: getWeatherInfo(current.weather_code),
      windSpeed: Math.round(current.wind_speed_10m),
      windDirection: current.wind_direction_10m,
      time: current.time,
      uvIndex: Math.round(current.uv_index * 10) / 10,
    };

    // Transform daily forecast
    const daily = data.daily;
    const daysVi = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const forecast = daily.time.map((date: string, i: number) => {
      const d = new Date(date + 'T00:00:00');
      return {
        date,
        dayName: daysVi[d.getDay()],
        dateStr: `${d.getDate()}/${d.getMonth() + 1}`,
        weatherCode: daily.weather_code[i],
        weatherInfo: getWeatherInfo(daily.weather_code[i]),
        tempMax: Math.round(daily.temperature_2m_max[i]),
        tempMin: Math.round(daily.temperature_2m_min[i]),
        precipProb: daily.precipitation_probability_max[i],
        windMax: Math.round(daily.wind_speed_10m_max[i]),
        sunrise: daily.sunrise[i],
        sunset: daily.sunset[i],
        uvIndexMax: Math.round(daily.uv_index_max[i] * 10) / 10,
      };
    });

    return NextResponse.json({
      city: 'Thành phố Hồ Chí Minh',
      current: currentWeather,
      forecast,
    });
  } catch (error) {
    console.error('Weather fetch error:', error);
    return NextResponse.json(
      { error: 'Không thể lấy dữ liệu thời tiết. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
