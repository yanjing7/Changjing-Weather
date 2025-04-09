// Constants
const API_KEY = ''; // Get your API key from https://openweathermap.org/
const CITY_ID = '1801401'; // Jiangyin City ID
const LANG = 'zh_cn'; // Language for weather descriptions
const UNITS = 'metric'; // Use metric system (Celsius)

// DOM Elements
const currentDateEl = document.getElementById('current-date');
const currentTimeEl = document.getElementById('current-time');
const currentTempEl = document.getElementById('current-temp');
const currentIconEl = document.getElementById('current-icon');
const currentDescEl = document.getElementById('current-description');
const currentWindEl = document.getElementById('current-wind');
const currentHumidityEl = document.getElementById('current-humidity');
const forecastContainerEl = document.getElementById('forecast-container');

// Update time
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = now.toLocaleDateString('zh-CN', options);
    
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    currentTimeEl.textContent = now.toLocaleTimeString('zh-CN', timeOptions);
}

// Get weather icon class
function getWeatherIcon(iconCode) {
    const icons = {
        '01d': 'fas fa-sun',
        '01n': 'fas fa-moon',
        '02d': 'fas fa-cloud-sun',
        '02n': 'fas fa-cloud-moon',
        '03d': 'fas fa-cloud',
        '03n': 'fas fa-cloud',
        '04d': 'fas fa-cloud',
        '04n': 'fas fa-cloud',
        '09d': 'fas fa-cloud-showers-heavy',
        '09n': 'fas fa-cloud-showers-heavy',
        '10d': 'fas fa-cloud-sun-rain',
        '10n': 'fas fa-cloud-moon-rain',
        '11d': 'fas fa-bolt',
        '11n': 'fas fa-bolt',
        '13d': 'fas fa-snowflake',
        '13n': 'fas fa-snowflake',
        '50d': 'fas fa-smog',
        '50n': 'fas fa-smog'
    };
    
    return icons[iconCode] || 'fas fa-question';
}

// Format date for forecast
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('zh-CN', options);
}

// Get current weather
async function getCurrentWeather() {
    try {
        // If you don't have an API key yet, use mock data
        if (!API_KEY) {
            return getMockCurrentWeather();
        }
        
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?id=${CITY_ID}&appid=${API_KEY}&lang=${LANG}&units=${UNITS}`);
        if (!response.ok) {
            throw new Error('Weather data not available');
        }
        
        const data = await response.json();
        
        // Update UI with weather data
        currentTempEl.textContent = Math.round(data.main.temp);
        currentIconEl.className = getWeatherIcon(data.weather[0].icon);
        currentDescEl.textContent = data.weather[0].description;
        currentWindEl.textContent = `${data.wind.speed} m/s`;
        currentHumidityEl.textContent = `${data.main.humidity}%`;
        
    } catch (error) {
        console.error('Failed to fetch current weather:', error);
        // Use mock data if API fails
        getMockCurrentWeather();
    }
}

// Get weather forecast
async function getWeatherForecast() {
    try {
        // If you don't have an API key yet, use mock data
        if (!API_KEY) {
            return getMockForecast();
        }
        
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?id=${CITY_ID}&appid=${API_KEY}&lang=${LANG}&units=${UNITS}`);
        if (!response.ok) {
            throw new Error('Forecast data not available');
        }
        
        const data = await response.json();
        
        // Clear previous forecast
        forecastContainerEl.innerHTML = '';
        
        // Get one forecast per day (every 8th item is roughly one day as the API returns data in 3-hour intervals)
        const dailyForecasts = data.list.filter((item, index) => index % 8 === 0);
        
        // Create forecast cards
        dailyForecasts.forEach(forecast => {
            const forecastCard = document.createElement('div');
            forecastCard.className = 'forecast-card';
            
            forecastCard.innerHTML = `
                <div class="forecast-day">${formatDate(forecast.dt)}</div>
                <div class="forecast-icon">
                    <i class="${getWeatherIcon(forecast.weather[0].icon)}"></i>
                </div>
                <div class="forecast-temp">${Math.round(forecast.main.temp)}°C</div>
                <div class="forecast-description">${forecast.weather[0].description}</div>
            `;
            
            forecastContainerEl.appendChild(forecastCard);
        });
        
    } catch (error) {
        console.error('Failed to fetch forecast:', error);
        // Use mock data if API fails
        getMockForecast();
    }
}

// Mock data for development or when API key is not available
function getMockCurrentWeather() {
    currentTempEl.textContent = '25';
    currentIconEl.className = 'fas fa-cloud-sun';
    currentDescEl.textContent = '晴间多云';
    currentWindEl.textContent = '3.5 m/s';
    currentHumidityEl.textContent = '68%';
}

function getMockForecast() {
    // Clear previous forecast
    forecastContainerEl.innerHTML = '';
    
    // Mock data for 5 days
    const mockForecast = [
        { day: '周一', icon: 'fas fa-cloud-sun', temp: 24, desc: '晴间多云' },
        { day: '周二', icon: 'fas fa-sun', temp: 27, desc: '晴天' },
        { day: '周三', icon: 'fas fa-cloud-showers-heavy', temp: 22, desc: '小雨' },
        { day: '周四', icon: 'fas fa-cloud', temp: 23, desc: '多云' },
        { day: '周五', icon: 'fas fa-sun', temp: 26, desc: '晴天' }
    ];
    
    // Create forecast cards
    mockForecast.forEach(forecast => {
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        
        forecastCard.innerHTML = `
            <div class="forecast-day">${forecast.day}</div>
            <div class="forecast-icon">
                <i class="${forecast.icon}"></i>
            </div>
            <div class="forecast-temp">${forecast.temp}°C</div>
            <div class="forecast-description">${forecast.desc}</div>
        `;
        
        forecastContainerEl.appendChild(forecastCard);
    });
}

// Initialize
function init() {
    // Update date and time immediately
    updateDateTime();
    
    // Update date and time every second
    setInterval(updateDateTime, 1000);
    
    // Get weather data
    getCurrentWeather();
    getWeatherForecast();
    
    // Refresh weather data every 30 minutes (1800000 ms)
    setInterval(() => {
        getCurrentWeather();
        getWeatherForecast();
    }, 1800000);
}

// Start when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 