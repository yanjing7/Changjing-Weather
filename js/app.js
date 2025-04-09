// Constants
const API_KEY = '4f8dc7d60ee47e346a86ba9ba5ae236d'; // 您的OpenWeatherMap API密钥
const DEFAULT_CITY = 'Jiangyin'; // 默认城市
const DEFAULT_COUNTRY = 'CN'; // 默认国家代码
const UNITS = 'metric'; // 单位制（metric公制，imperial英制）
const LANG = 'zh_cn'; // 语言设置

// DOM Elements
const currentDateEl = document.getElementById('current-date');
const currentTimeEl = document.getElementById('current-time');
const currentTempEl = document.getElementById('current-temp');
const currentIconEl = document.getElementById('current-icon');
const currentDescEl = document.getElementById('current-description');
const currentWindEl = document.getElementById('current-wind');
const currentHumidityEl = document.getElementById('current-humidity');
const currentPressureEl = document.getElementById('current-pressure');
const forecastContainerEl = document.getElementById('forecast-container');
const refreshBtn = document.getElementById('refresh-btn');
const currentYearEl = document.getElementById('current-year');
const loadingEl = document.querySelector('.loading');

// 全局变量
let temperatureChart = null;
let forecastData = [];
let currentCity = DEFAULT_CITY;
let currentCountry = DEFAULT_COUNTRY;
let currentUnit = UNITS;
let weatherData = null;
let map = null;
let currentLayer = null;

// Update time
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = now.toLocaleDateString('zh-CN', options);
    
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    currentTimeEl.textContent = now.toLocaleTimeString('zh-CN', timeOptions);
    
    // 更新页脚的年份
    currentYearEl.textContent = now.getFullYear();
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

// Get weather animation class
function getWeatherBackground(iconCode) {
    if (iconCode.startsWith('01')) {
        return 'sunny';
    } else if (iconCode.startsWith('02')) {
        return 'partly-cloudy';
    } else if (iconCode.startsWith('03') || iconCode.startsWith('04')) {
        return 'cloudy';
    } else if (iconCode.startsWith('09') || iconCode.startsWith('10')) {
        return 'rainy';
    } else if (iconCode.startsWith('11')) {
        return 'stormy';
    } else if (iconCode.startsWith('13')) {
        return 'snowy';
    } else if (iconCode.startsWith('50')) {
        return 'misty';
    }
    return '';
}

// Format date for forecast
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('zh-CN', options);
}

// 显示加载动画
function showLoading() {
    loadingEl.style.display = 'flex';
    loadingEl.style.animation = 'none';
    loadingEl.offsetHeight; // Trigger reflow
    loadingEl.style.animation = null;
}

// 隐藏加载动画
function hideLoading() {
    loadingEl.style.animation = 'fadeOut 0.5s ease-out forwards';
}

// Get current weather
async function getCurrentWeather() {
    try {
        showLoading();
        
        // If you don't have an API key yet, use mock data
        if (!API_KEY) {
            setTimeout(() => {
                getMockCurrentWeather();
                hideLoading();
            }, 1000);
            return;
        }
        
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${currentCity},${currentCountry}&appid=${API_KEY}&units=${currentUnit}&lang=${LANG}`);
        if (!response.ok) {
            throw new Error('Weather data not available');
        }
        
        const data = await response.json();
        
        // 添加动画效果
        animateValue(currentTempEl, parseFloat(currentTempEl.textContent) || 0, Math.round(data.main.temp), 1000);
        
        // Update UI with weather data
        currentIconEl.className = getWeatherIcon(data.weather[0].icon);
        currentDescEl.textContent = data.weather[0].description;
        currentWindEl.textContent = `${data.wind.speed} m/s`;
        currentHumidityEl.textContent = `${data.main.humidity}%`;
        currentPressureEl.textContent = `${data.main.pressure} hPa`;
        
        // 添加天气背景类
        document.body.className = getWeatherBackground(data.weather[0].icon);
        
        hideLoading();
    } catch (error) {
        console.error('Failed to fetch current weather:', error);
        // Use mock data if API fails
        getMockCurrentWeather();
        hideLoading();
    }
}

// Get weather forecast
async function getWeatherForecast() {
    try {
        // If you don't have an API key yet, use mock data
        if (!API_KEY) {
            getMockForecast();
            return;
        }
        
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${currentCity},${currentCountry}&appid=${API_KEY}&units=${currentUnit}&lang=${LANG}`);
        if (!response.ok) {
            throw new Error('Forecast data not available');
        }
        
        const data = await response.json();
        
        // Clear previous forecast
        forecastContainerEl.innerHTML = '';
        
        // Get one forecast per day (every 8th item is roughly one day as the API returns data in 3-hour intervals)
        const dailyForecasts = data.list.filter((item, index) => index % 8 === 0);
        forecastData = dailyForecasts;
        
        // Create forecast cards
        dailyForecasts.forEach((forecast, index) => {
            const forecastCard = document.createElement('div');
            forecastCard.className = 'forecast-card';
            
            forecastCard.innerHTML = `
                <div class="forecast-day">${formatDate(forecast.dt)}</div>
                <div class="forecast-icon">
                    <i class="${getWeatherIcon(forecast.weather[0].icon)}"></i>
                </div>
                <div class="forecast-temp">${Math.round(forecast.main.temp)}°C</div>
                <div class="forecast-description">${forecast.weather[0].description}</div>
                <div class="forecast-details">
                    <span><i class="fas fa-wind"></i> ${forecast.wind.speed} m/s</span>
                    <span><i class="fas fa-tint"></i> ${forecast.main.humidity}%</span>
                </div>
            `;
            
            // 添加点击事件以显示详细信息
            forecastCard.addEventListener('click', () => {
                showForecastDetails(forecast, index);
            });
            
            forecastContainerEl.appendChild(forecastCard);
        });
        
        // 创建图表
        createTemperatureChart(dailyForecasts);
        
    } catch (error) {
        console.error('Failed to fetch forecast:', error);
        // Use mock data if API fails
        getMockForecast();
    }
}

// Mock data for development or when API key is not available
function getMockCurrentWeather() {
    animateValue(currentTempEl, parseFloat(currentTempEl.textContent) || 0, 25, 1000);
    currentIconEl.className = 'fas fa-cloud-sun';
    currentDescEl.textContent = '晴间多云';
    currentWindEl.textContent = '3.5 m/s';
    currentHumidityEl.textContent = '68%';
    currentPressureEl.textContent = '1013 hPa';
}

function getMockForecast() {
    // Clear previous forecast
    forecastContainerEl.innerHTML = '';
    
    // Mock data for 5 days
    const mockForecast = [
        { day: '周一', icon: 'fas fa-cloud-sun', temp: 24, desc: '晴间多云', wind: '3.6 m/s', humidity: '65%', dt: Date.now()/1000 },
        { day: '周二', icon: 'fas fa-sun', temp: 27, desc: '晴天', wind: '2.8 m/s', humidity: '60%', dt: Date.now()/1000 + 86400 },
        { day: '周三', icon: 'fas fa-cloud-showers-heavy', temp: 22, desc: '小雨', wind: '4.1 m/s', humidity: '75%', dt: Date.now()/1000 + 172800 },
        { day: '周四', icon: 'fas fa-cloud', temp: 23, desc: '多云', wind: '3.2 m/s', humidity: '70%', dt: Date.now()/1000 + 259200 },
        { day: '周五', icon: 'fas fa-sun', temp: 26, desc: '晴天', wind: '2.5 m/s', humidity: '62%', dt: Date.now()/1000 + 345600 }
    ];
    
    forecastData = mockForecast.map(item => ({
        dt: item.dt,
        main: { temp: item.temp, humidity: parseInt(item.humidity) },
        wind: { speed: parseFloat(item.wind) },
        weather: [{ description: item.desc, icon: item.icon === 'fas fa-sun' ? '01d' : '02d' }]
    }));
    
    // Create forecast cards
    mockForecast.forEach((forecast, index) => {
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        
        forecastCard.innerHTML = `
            <div class="forecast-day">${forecast.day}</div>
            <div class="forecast-icon">
                <i class="${forecast.icon}"></i>
            </div>
            <div class="forecast-temp">${forecast.temp}°C</div>
            <div class="forecast-description">${forecast.desc}</div>
            <div class="forecast-details">
                <span><i class="fas fa-wind"></i> ${forecast.wind}</span>
                <span><i class="fas fa-tint"></i> ${forecast.humidity}</span>
            </div>
        `;
        
        // 添加点击事件以显示详细信息
        forecastCard.addEventListener('click', () => {
            showForecastDetails(forecastData[index], index);
        });
        
        forecastContainerEl.appendChild(forecastCard);
    });
    
    // 创建图表
    createTemperatureChart(forecastData);
}

// 数字变化动画
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// 显示天气预报详细信息
function showForecastDetails(forecast, index) {
    // 添加高亮效果
    const forecastCards = document.querySelectorAll('.forecast-card');
    forecastCards.forEach(card => card.classList.remove('active'));
    forecastCards[index].classList.add('active');
    
    // 滚动到图表位置
    document.querySelector('.weather-trend').scrollIntoView({ behavior: 'smooth' });
    
    // 更新图表中的高亮
    updateChartHighlight(index);
}

// 创建温度趋势图表
function createTemperatureChart(forecastData) {
    const ctx = document.getElementById('temperature-chart').getContext('2d');
    
    // 如果已存在图表，销毁它
    if (temperatureChart) {
        temperatureChart.destroy();
    }
    
    const labels = forecastData.map(item => formatDate(item.dt));
    const temperatures = forecastData.map(item => Math.round(item.main.temp));
    
    temperatureChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '温度 (°C)',
                data: temperatures,
                fill: true,
                backgroundColor: 'rgba(76, 162, 205, 0.2)',
                borderColor: '#4ca2cd',
                borderWidth: 2,
                pointBackgroundColor: '#4ca2cd',
                pointBorderColor: '#fff',
                pointRadius: 6,
                pointHoverRadius: 8,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    titleColor: '#333',
                    bodyColor: '#333',
                    titleFont: { 
                        family: 'Microsoft YaHei',
                        size: 14
                    },
                    bodyFont: {
                        family: 'Microsoft YaHei',
                        size: 13
                    },
                    padding: 12,
                    displayColors: false,
                    borderWidth: 1,
                    borderColor: '#ddd'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(200, 200, 200, 0.2)'
                    },
                    ticks: {
                        font: {
                            family: 'Microsoft YaHei'
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: 'Microsoft YaHei'
                        }
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            },
            hover: {
                mode: 'index',
                intersect: false
            },
            interaction: {
                mode: 'index',
                intersect: false
            }
        }
    });
}

// 更新图表中的高亮点
function updateChartHighlight(index) {
    const dataset = temperatureChart.data.datasets[0];
    const originalPointRadius = new Array(dataset.data.length).fill(6);
    const originalPointBorderWidth = new Array(dataset.data.length).fill(1);
    
    originalPointRadius[index] = 10;
    originalPointBorderWidth[index] = 2;
    
    dataset.pointRadius = originalPointRadius;
    dataset.pointBorderWidth = originalPointBorderWidth;
    
    temperatureChart.update();
}

// 添加刷新按钮事件
function setupEventListeners() {
    refreshBtn.addEventListener('click', function() {
        this.classList.add('rotating');
        this.disabled = true;
        
        getCurrentWeather();
        getWeatherForecast();
        
        setTimeout(() => {
            this.classList.remove('rotating');
            this.disabled = false;
        }, 2000);
    });
}

// Initialize
function init() {
    // 添加刷新按钮的CSS
    const style = document.createElement('style');
    style.textContent = `
        .refresh-button {
            display: flex;
            align-items: center;
            justify-content: center;
            background: #4ca2cd;
            color: white;
            border: none;
            border-radius: 20px;
            padding: 8px 16px;
            margin-top: 15px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .refresh-button:hover {
            background: #3d8eb3;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .refresh-button i {
            margin-right: 8px;
        }
        
        .rotating {
            animation: rotate 1s linear infinite;
        }
        
        @keyframes rotate {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
        }
        
        .forecast-card {
            cursor: pointer;
        }
        
        .forecast-card.active {
            border: 2px solid #4ca2cd;
            transform: translateY(-8px) scale(1.03);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
        
        .forecast-details {
            display: flex;
            justify-content: space-around;
            margin-top: 10px;
            font-size: 0.85rem;
            color: #666;
        }
        
        .forecast-details span {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .forecast-details i {
            color: #4ca2cd;
        }
        
        /* 不同天气背景 */
        body.sunny {
            background: linear-gradient(135deg, #FFD700, #FF8C00);
        }
        
        body.partly-cloudy {
            background: linear-gradient(135deg, #87CEEB, #6495ED);
        }
        
        body.cloudy {
            background: linear-gradient(135deg, #B0C4DE, #708090);
        }
        
        body.rainy {
            background: linear-gradient(135deg, #4682B4, #2F4F4F);
        }
        
        body.stormy {
            background: linear-gradient(135deg, #483D8B, #2F4F4F);
        }
        
        body.snowy {
            background: linear-gradient(135deg, #B0E0E6, #87CEFA);
        }
        
        body.misty {
            background: linear-gradient(135deg, #D3D3D3, #A9A9A9);
        }
    `;
    document.head.appendChild(style);
    
    // Update date and time immediately
    updateDateTime();
    
    // Update date and time every second
    setInterval(updateDateTime, 1000);
    
    // Set up event listeners
    setupEventListeners();
    
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