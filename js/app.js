// Constants
const API_KEY = '4f8dc7d60ee47e346a86ba9ba5ae236d'; // 您的OpenWeatherMap API密钥
const DEFAULT_CITY = 'Jiangyin'; // 默认城市
const DEFAULT_COUNTRY = 'CN'; // 默认国家代码
const UNITS = 'metric'; // 单位制（metric公制，imperial英制）
const LANG = 'zh_cn'; // 语言设置
const DEFAULT_TIMEZONE = 'Asia/Shanghai'; // 默认时区 - 上海时区(UTC+8)
const TIMEZONE_OFFSET = 8; // 上海时区偏移量（小时）

// 直接在全局域添加搜索函数 - 用于HTML直接调用
function searchCity() {
    const cityInput = document.getElementById('cityInput');
    const query = cityInput ? cityInput.value.trim() : '';
    
    if (query) {
        console.log('外部调用搜索函数，查询:', query);
        const event = new Event('click');
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.dispatchEvent(event);
        } else {
            // 如果找不到按钮，直接执行内部逻辑
            window.currentCity = query;
            window.currentCountry = '';
            window.loadWeatherData();
        }
    } else {
        console.log('查询为空，不执行搜索');
        alert('请输入城市名称');
    }
    return false; // 防止表单提交
}

// 设置时区函数 - 设置上海时区
function setTimezone(timezone) {
    // 时区偏移量字典
    const timezoneOffsets = {
        'Asia/Shanghai': 8,
        'Asia/Tokyo': 9,
        'Europe/London': 0,
        'America/New_York': -5,
        'America/Los_Angeles': -8
    };
    
    window.currentTimezone = timezone;
    window.currentTimezoneOffset = timezoneOffsets[timezone] || TIMEZONE_OFFSET;
    
    // 保存时区选择到本地存储
    localStorage.setItem('selectedTimezone', timezone);
    
    // 更新时间显示
    updateDateTime();
    console.log('时区已设置为:', timezone, '偏移量:', window.currentTimezoneOffset);
}

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面已加载，初始化应用...');
    
    // 暴露加载天气数据函数给全局，以便外部调用
    window.loadWeatherData = loadWeatherData;
    window.currentCity = DEFAULT_CITY;
    window.currentCountry = DEFAULT_COUNTRY;
    window.currentTimezone = DEFAULT_TIMEZONE;
    window.currentTimezoneOffset = TIMEZONE_OFFSET;
    
    // 加载动画
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    // 头部元素
    const cityNameElement = document.getElementById('cityName');
    const cityInput = document.getElementById('cityInput');
    const searchBtn = document.getElementById('searchBtn');
    const searchResults = document.getElementById('searchResults');
    const refreshBtn = document.getElementById('refreshBtn');
    const unitToggle = document.getElementById('unitToggle');
    const cityTags = document.querySelectorAll('.city-tag');
    
    // DOM元素检查
    if (!cityInput) console.error('找不到cityInput元素');
    if (!searchBtn) console.error('找不到searchBtn元素');
    if (!searchResults) console.error('找不到searchResults元素');
    
    // 日期时间元素
    const currentDateElement = document.getElementById('currentDate');
    const currentTimeElement = document.getElementById('currentTime');
    
    // 当前天气元素
    const weatherIcon = document.getElementById('weatherIcon');
    const weatherDescription = document.getElementById('weatherDescription');
    const currentTemp = document.getElementById('currentTemp');
    const feelsLike = document.getElementById('feelsLike');
    const windSpeed = document.getElementById('windSpeed');
    const humidity = document.getElementById('humidity');
    const pressure = document.getElementById('pressure');
    const uvIndex = document.getElementById('uvIndex');
    const visibility = document.getElementById('visibility');
    const precipitation = document.getElementById('precipitation');
    
    // 预报元素
    const forecastContainer = document.getElementById('forecastContainer');
    
    // 图表元素
    const tempChart = document.getElementById('tempChart');
    
    // 空气质量元素
    const aqiValue = document.getElementById('aqiValue');
    const aqiLabel = document.getElementById('aqiLabel');
    const pm25 = document.getElementById('pm25');
    const pm10 = document.getElementById('pm10');
    const o3 = document.getElementById('o3');
    const no2 = document.getElementById('no2');
    
    // 地图元素
    const weatherMap = document.getElementById('weatherMap');
    const mapControls = document.querySelectorAll('.map-controls button');
    
    // 页脚元素
    const currentYearElement = document.getElementById('currentYear');
    
    // 全局变量
    let currentUnit = UNITS;
    let weatherData = null;
    let forecastData = null;
    let chart = null;
    let map = null;
    let currentLayer = null;
    
    // 初始化
    init();
    
    function init() {
        console.log('初始化天气应用...');
        
        // 创建loadingOverlay的样式
        if(!document.getElementById('loadingStyles')) {
            const style = document.createElement('style');
            style.id = 'loadingStyles';
            style.textContent = `
                .loading-overlay {
                    display: flex;
                    opacity: 1;
                    visibility: visible;
                    transition: opacity 0.5s ease, visibility 0.5s ease;
                }
                .loading-overlay.hidden {
                    opacity: 0;
                    visibility: hidden;
                }
            `;
            document.head.appendChild(style);
        }
        
        // 设置当前年份
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        // 加载上次的时区设置
        const savedTimezone = localStorage.getItem('selectedTimezone');
        if (savedTimezone) {
            console.log('加载保存的时区设置:', savedTimezone);
            setTimezone(savedTimezone);
            // 更新时区选择下拉框
            const timezoneSelect = document.getElementById('timezoneSelect');
            if (timezoneSelect) {
                timezoneSelect.value = savedTimezone;
            }
        }
        
        // 加载上次查询的城市
        const lastCity = localStorage.getItem('lastCity');
        const lastCountry = localStorage.getItem('lastCountry');
        
        if (lastCity) {
            console.log('加载上次查询的城市:', lastCity);
            currentCity = lastCity;
            if (lastCountry) currentCountry = lastCountry;
            if (cityInput) cityInput.value = currentCity;
        }
        
        // 加载天气数据
        loadWeatherData();
        
        // 事件监听器设置
        setupEventListeners();
        
        console.log('初始化完成，监听事件已设置');
    }
    
    // 设置所有事件监听器
    function setupEventListeners() {
        console.log('设置事件监听器...');
        
        // 刷新按钮
        if(refreshBtn) {
            console.log('设置刷新按钮监听器');
            refreshBtn.addEventListener('click', handleRefreshClick);
        }
        
        // 单位切换
        if(unitToggle) {
            unitToggle.addEventListener('change', handleUnitToggleChange);
        }
        
        // 搜索按钮
        if(searchBtn) {
            console.log('设置搜索按钮监听器');
            searchBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('搜索按钮被点击');
                handleSearchClick();
            });
        }
        
        // 输入框
        if(cityInput) {
            console.log('设置输入框监听器');
            cityInput.addEventListener('keyup', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    console.log('输入框按下Enter键');
                    handleSearchClick();
                } else if (cityInput.value.length >= 3) {
                    searchCities(cityInput.value);
                } else {
                    if(searchResults) {
                        searchResults.classList.remove('active');
                    }
                }
            });
            
            cityInput.addEventListener('focus', function() {
                if (cityInput.value.length >= 3) {
                    searchCities(cityInput.value);
                }
            });
            
            // 清除输入框内容按钮
            const clearButton = document.createElement('span');
            clearButton.innerHTML = '&times;';
            clearButton.className = 'clear-input';
            clearButton.style.cssText = 'position:absolute; right:55px; top:50%; transform:translateY(-50%); cursor:pointer; color:#999; font-size:20px;';
            clearButton.addEventListener('click', () => {
                cityInput.value = '';
                cityInput.focus();
                if(searchResults) {
                    searchResults.classList.remove('active');
                }
            });
            cityInput.parentNode.appendChild(clearButton);
        }
        
        // 热门城市标签点击
        cityTags.forEach(tag => {
            tag.addEventListener('click', () => {
                const city = tag.getAttribute('data-city');
                console.log('点击城市标签:', city);
                if(cityInput) cityInput.value = city;
                currentCity = city;
                loadWeatherData();
            });
        });
        
        // 地图控制按钮
        if(mapControls && mapControls.length > 0) {
            mapControls.forEach(button => {
                button.addEventListener('click', () => {
                    const layer = button.getAttribute('data-layer');
                    updateMapLayer(layer);
                    
                    // 更新活动按钮
                    mapControls.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                });
            });
        }
    }
    
    // 更新日期和时间
    function updateDateTime() {
        const now = new Date();
        
        // 应用时区偏移
        if (window.currentTimezoneOffset) {
            // 将当前时间调整为所选时区时间
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const tzTime = new Date(utc + (3600000 * window.currentTimezoneOffset));
            
            // 设置日期
            if(currentDateElement) {
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                currentDateElement.textContent = tzTime.toLocaleDateString('zh-CN', options);
            }
            
            // 设置时间
            if(currentTimeElement) {
                currentTimeElement.textContent = tzTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            }
        } else {
            // 没有设置时区，使用本地时间
            // 设置日期
            if(currentDateElement) {
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                currentDateElement.textContent = now.toLocaleDateString('zh-CN', options);
            }
            
            // 设置时间
            if(currentTimeElement) {
                currentTimeElement.textContent = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            }
        }
        
        // 设置年份
        if(currentYearElement) {
            currentYearElement.textContent = now.getFullYear();
        }
    }
    
    // 加载天气数据
    async function loadWeatherData() {
        showLoading();
        console.log('正在加载天气数据，城市：', currentCity);
        
        try {
            // 检查缓存
            if (loadCachedWeatherData()) {
                console.log('使用缓存的天气数据');
                hideLoading();
                return;
            }
            
            // 当前天气数据
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${currentCity},${currentCountry}&appid=${API_KEY}&units=${currentUnit}&lang=${LANG}`;
            console.log('请求URL:', url);
            
            const weatherResponse = await fetch(url);
            if (!weatherResponse.ok) {
                throw new Error(`Weather data fetch failed with status ${weatherResponse.status}`);
            }
            weatherData = await weatherResponse.json();
            console.log('获取到天气数据:', weatherData);
            
            // 保存天气数据到本地存储
            saveToLocalStorage('weatherData', weatherData);
            
            // 改变网站标题为城市名
            if(cityNameElement) {
                cityNameElement.textContent = `${weatherData.name} - See Weather`;
                document.title = `${weatherData.name} - See Weather`;
            }
            
            // 更新天气数据
            updateCurrentWeather(weatherData);
            
            // 获取空气质量数据
            fetchAirQuality(weatherData.coord.lat, weatherData.coord.lon);
            
            // 获取UV指数
            fetchUVIndex(weatherData.coord.lat, weatherData.coord.lon);
            
            // 获取预报数据
            const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${currentCity},${currentCountry}&appid=${API_KEY}&units=${currentUnit}&lang=${LANG}`);
            if (!forecastResponse.ok) {
                throw new Error('Forecast data fetch failed');
            }
            forecastData = await forecastResponse.json();
            
            // 保存预报数据到本地存储
            saveToLocalStorage('forecastData', forecastData);
            
            // 更新预报
            updateForecast(forecastData);
            
            // 更新温度趋势图
            updateTemperatureChart(forecastData);
            
            // 初始化地图
            initMap(weatherData.coord.lat, weatherData.coord.lon);
            
            // 应用背景变化基于当前天气
            applyWeatherBackground(weatherData.weather[0].id);
            
            // 保存当前城市到本地存储
            localStorage.setItem('lastCity', currentCity);
            localStorage.setItem('lastCountry', currentCountry || '');
            
        } catch (error) {
            console.error('Error fetching weather data:', error);
            
            // 检查是否有缓存数据作为备份
            if (getFromLocalStorage('weatherData') && getFromLocalStorage('forecastData')) {
                console.log('使用备份缓存数据');
                loadCachedWeatherData();
                showError(`无法获取最新的天气数据，显示缓存的天气信息。错误: ${error.message}`);
            } else {
                showError(`无法获取城市 "${currentCity}" 的天气数据，请检查城市名称是否正确。错误: ${error.message}`);
            }
        } finally {
            hideLoading();
        }
    }
    
    // 更新当前天气信息
    function updateCurrentWeather(data) {
        console.log('更新当前天气信息');
        
        // 如果有时区数据，更新当前时区
        if (data.timezone) {
            window.currentTimezoneOffset = data.timezone / 3600; // 转换为小时
            console.log('从API设置时区偏移:', window.currentTimezoneOffset);
            updateDateTime();
        }
        
        // 设置图标
        if(weatherIcon) {
            const iconCode = data.weather[0].icon;
            weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
            weatherIcon.alt = data.weather[0].description;
        }
        
        // 设置描述
        if(weatherDescription) {
            weatherDescription.textContent = formatWeatherDescription(data.weather[0].description, data.weather[0].id);
        }
        
        // 设置温度
        if(currentTemp) {
            // 添加随机偏差以模拟墨迹天气风格（仅在需要时使用）
            // const tempOffset = (Math.random() * 2 - 1); // -1 到 1 之间的随机偏差
            // const adjustedTemp = Math.round(data.main.temp + tempOffset);
            // currentTemp.textContent = adjustedTemp;
            currentTemp.textContent = Math.round(data.main.temp);
        }
        
        if(feelsLike) {
            feelsLike.textContent = Math.round(data.main.feels_like);
        }
        
        // 设置其他详情
        if(windSpeed) {
            const windDirection = getWindDirection(data.wind.deg);
            windSpeed.textContent = `${windDirection} ${data.wind.speed} m/s`;
        }
        
        if(humidity) {
            humidity.textContent = `${data.main.humidity}%`;
        }
        
        if(pressure) {
            pressure.textContent = `${data.main.pressure} hPa`;
        }
        
        // 设置能见度（转换为千米）
        if(visibility) {
            const visibilityKm = data.visibility / 1000;
            visibility.textContent = `${visibilityKm.toFixed(1)} km`;
        }
        
        // 设置降水量（如果有）
        if(precipitation) {
            if (data.rain && data.rain['1h']) {
                precipitation.textContent = `${data.rain['1h']} mm`;
            } else if (data.snow && data.snow['1h']) {
                precipitation.textContent = `${data.snow['1h']} mm`;
            } else {
                precipitation.textContent = '0 mm';
            }
        }
        
        // 设置日出日落时间
        if (data.sys && data.sys.sunrise && data.sys.sunset) {
            const sunriseTime = new Date(data.sys.sunrise * 1000);
            const sunsetTime = new Date(data.sys.sunset * 1000);
            
            // 如果页面上有日出日落元素，则更新它们
            const sunriseElement = document.getElementById('sunrise');
            const sunsetElement = document.getElementById('sunset');
            
            if (sunriseElement) {
                sunriseElement.textContent = sunriseTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            }
            
            if (sunsetElement) {
                sunsetElement.textContent = sunsetTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            }
        }
    }
    
    // 获取UV指数
    async function fetchUVIndex(lat, lon) {
        if(!uvIndex) return;
        
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily,alerts&appid=${API_KEY}`);
            if (!response.ok) {
                throw new Error('UV index fetch failed');
            }
            const data = await response.json();
            
            if (data.current && data.current.uvi !== undefined) {
                uvIndex.textContent = data.current.uvi.toFixed(1);
            } else {
                uvIndex.textContent = 'N/A';
            }
        } catch (error) {
            console.error('Error fetching UV index:', error);
            uvIndex.textContent = 'N/A';
        }
    }
    
    // 获取空气质量
    async function fetchAirQuality(lat, lon) {
        if(!aqiValue || !aqiLabel || !pm25 || !pm10 || !o3 || !no2) return;
        
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
            if (!response.ok) {
                throw new Error('Air quality fetch failed');
            }
            const data = await response.json();
            
            if (data.list && data.list.length > 0) {
                const airQuality = data.list[0];
                
                // 设置AQI值和标签
                const aqi = airQuality.main.aqi;
                aqiValue.textContent = aqi;
                
                // 设置AQI标签和颜色
                let aqiText = '';
                let aqiColor = '';
                
                switch(aqi) {
                    case 1:
                        aqiText = '优';
                        aqiColor = 'var(--success-color)';
                        break;
                    case 2:
                        aqiText = '良';
                        aqiColor = '#a3cc52';
                        break;
                    case 3:
                        aqiText = '中等';
                        aqiColor = 'var(--accent-color)';
                        break;
                    case 4:
                        aqiText = '较差';
                        aqiColor = '#f57f17';
                        break;
                    case 5:
                        aqiText = '很差';
                        aqiColor = 'var(--danger-color)';
                        break;
                    default:
                        aqiText = 'N/A';
                        aqiColor = '#999';
                }
                
                aqiLabel.textContent = aqiText;
                aqiValue.style.color = aqiColor;
                
                // 设置污染物数据
                const components = airQuality.components;
                pm25.textContent = `${components.pm2_5.toFixed(1)} μg/m³`;
                pm10.textContent = `${components.pm10.toFixed(1)} μg/m³`;
                o3.textContent = `${components.o3.toFixed(1)} μg/m³`;
                no2.textContent = `${components.no2.toFixed(1)} μg/m³`;
            }
        } catch (error) {
            console.error('Error fetching air quality:', error);
            aqiValue.textContent = 'N/A';
            aqiLabel.textContent = '无数据';
        }
    }
    
    // 更新天气预报
    function updateForecast(data) {
        if(!forecastContainer) return;
        
        // 清空预报容器
        forecastContainer.innerHTML = '';
        
        // 获取未来5天的天气预报（每天中午的数据）
        const dailyForecasts = [];
        const processedDates = new Set();
        
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dateString = date.toISOString().split('T')[0];
            
            // 只选择每天中午左右(12:00-15:00)的预报
            const hour = date.getHours();
            
            if (!processedDates.has(dateString) && hour >= 12 && hour <= 15) {
                processedDates.add(dateString);
                dailyForecasts.push(item);
            }
        });
        
        // 限制为5天
        const forecastsToShow = dailyForecasts.slice(0, 5);
        
        // 创建预报卡片
        forecastsToShow.forEach((forecast, index) => {
            const date = new Date(forecast.dt * 1000);
            const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            const dayName = dayNames[date.getDay()];
            
            const card = document.createElement('div');
            card.className = 'forecast-card';
            card.innerHTML = `
                <div class="forecast-day">${dayName}</div>
                <div class="forecast-date">${date.getMonth() + 1}月${date.getDate()}日</div>
                <img class="forecast-icon" src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png" alt="${forecast.weather[0].description}">
                <div class="forecast-temp">
                    <div class="forecast-max">${Math.round(forecast.main.temp_max)}°</div>
                    <div class="forecast-min">/${Math.round(forecast.main.temp_min)}°</div>
                </div>
                <div class="forecast-description">${forecast.weather[0].description}</div>
            `;
            
            // 添加动画延迟
            card.style.animationDelay = `${index * 0.1}s`;
            
            forecastContainer.appendChild(card);
        });

        // 保存到本地缓存
        saveToLocalStorage('forecastData', data);
    }
    
    // 更新温度趋势图
    function updateTemperatureChart(data) {
        if(!tempChart) return;
        
        // 准备图表数据
        const next24Hours = data.list.slice(0, 8); // 未来24小时（3小时间隔，共8个数据点）
        
        const labels = next24Hours.map(item => {
            const date = new Date(item.dt * 1000);
            return date.getHours() + ':00';
        });
        
        const temperatures = next24Hours.map(item => Math.round(item.main.temp));
        const feelsLike = next24Hours.map(item => Math.round(item.main.feels_like));
        
        // 如果已有图表，销毁它
        if (chart) {
            chart.destroy();
        }
        
        // 创建新图表
        const ctx = tempChart.getContext('2d');
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '温度',
                        data: temperatures,
                        borderColor: '#4ca2cd',
                        backgroundColor: 'rgba(76, 162, 205, 0.2)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: '体感温度',
                        data: feelsLike,
                        borderColor: '#67b26f',
                        backgroundColor: 'rgba(103, 178, 111, 0.1)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        tension: 0.4,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return value + '°';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // 初始化地图
    function initMap(lat, lon) {
        if (!weatherMap) return;
        
        // 如果已经有地图实例，先移除
        if (map) {
            map.remove();
        }
        
        // 创建地图
        map = L.map('weatherMap').setView([lat, lon], 10);
        
        // 添加地图图层
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // 添加标记
        L.marker([lat, lon]).addTo(map)
            .bindPopup(`<b>${weatherData.name}</b><br>${weatherData.weather[0].description}<br>${Math.round(weatherData.main.temp)}°C`)
            .openPopup();
        
        // 默认选择温度图层
        updateMapLayer('temp');
        if(mapControls && mapControls.length > 0) {
            mapControls[0].classList.add('active');
        }
    }
    
    // 更新地图图层
    function updateMapLayer(layerType) {
        if (!map) return;
        
        // 移除当前图层
        if (currentLayer) {
            map.removeLayer(currentLayer);
        }
        
        // 添加新图层
        const layerUrl = getWeatherLayerUrl(layerType);
        currentLayer = L.tileLayer(layerUrl, {
            attribution: '&copy; <a href="https://openweathermap.org/">OpenWeather</a>',
            opacity: 0.5
        }).addTo(map);
    }
    
    // 获取天气图层URL
    function getWeatherLayerUrl(layerType) {
        let layerCode = '';
        
        switch(layerType) {
            case 'temp':
                layerCode = 'temp_new';
                break;
            case 'precipitation':
                layerCode = 'precipitation_new';
                break;
            case 'clouds':
                layerCode = 'clouds_new';
                break;
            case 'wind':
                layerCode = 'wind_new';
                break;
            default:
                layerCode = 'temp_new';
        }
        
        return `https://tile.openweathermap.org/map/${layerCode}/{z}/{x}/{y}.png?appid=${API_KEY}`;
    }
    
    // 应用天气背景
    function applyWeatherBackground(weatherCode) {
        let gradientColors;
        
        // 根据天气代码设置不同的背景渐变
        if (weatherCode >= 200 && weatherCode < 300) {
            // 雷暴
            gradientColors = 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)';
        } else if (weatherCode >= 300 && weatherCode < 400) {
            // 小雨
            gradientColors = 'linear-gradient(135deg, #616161 0%, #9bc5c3 100%)';
        } else if (weatherCode >= 500 && weatherCode < 600) {
            // 雨
            gradientColors = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
        } else if (weatherCode >= 600 && weatherCode < 700) {
            // 雪
            gradientColors = 'linear-gradient(135deg, #e6dada 0%, #274046 100%)';
        } else if (weatherCode >= 700 && weatherCode < 800) {
            // 雾霾
            gradientColors = 'linear-gradient(135deg, #757f9a 0%, #d7dde8 100%)';
        } else if (weatherCode === 800) {
            // 晴天
            gradientColors = 'linear-gradient(135deg, #56ccf2 0%, #2f80ed 100%)';
        } else {
            // 多云
            gradientColors = 'linear-gradient(135deg, #757f9a 0%, #d7dde8 100%)';
        }
        
        document.body.style.background = gradientColors;
        document.body.style.backgroundSize = '400% 400%';
        document.body.style.animation = 'gradientBG 15s ease infinite';
    }
    
    // 本地存储操作 - 保存
    function saveToLocalStorage(key, data) {
        try {
            const jsonData = JSON.stringify({
                data: data,
                timestamp: new Date().getTime()
            });
            localStorage.setItem(key, jsonData);
            console.log(`已保存数据到本地: ${key}`);
        } catch (e) {
            console.error('保存数据到本地存储时出错:', e);
        }
    }
    
    // 本地存储操作 - 读取
    function getFromLocalStorage(key, expirationTime = 30 * 60 * 1000) { // 默认30分钟
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;
            
            const parsedItem = JSON.parse(item);
            const now = new Date().getTime();
            
            // 检查数据是否过期
            if (now - parsedItem.timestamp > expirationTime) {
                console.log(`${key} 数据已过期`);
                localStorage.removeItem(key);
                return null;
            }
            
            console.log(`从本地加载数据: ${key}`);
            return parsedItem.data;
        } catch (e) {
            console.error('从本地存储读取数据时出错:', e);
            return null;
        }
    }
    
    // 加载时检查缓存数据
    function loadCachedWeatherData() {
        const cachedWeatherData = getFromLocalStorage('weatherData');
        const cachedForecastData = getFromLocalStorage('forecastData');
        
        if (cachedWeatherData && cachedForecastData) {
            console.log('使用缓存的天气数据');
            weatherData = cachedWeatherData;
            forecastData = cachedForecastData;
            
            // 墨迹天气风格的优化 - 轻微调整温度、湿度等数据
            // weatherData.main.temp = Math.round((weatherData.main.temp + (Math.random() * 0.8 - 0.4)) * 10) / 10;
            // weatherData.main.feels_like = Math.round((weatherData.main.feels_like + (Math.random() * 0.6 - 0.3)) * 10) / 10;
            
            // 更新UI
            if (cityNameElement) {
                cityNameElement.textContent = `${weatherData.name} 天气预报`;
                document.title = `${weatherData.name} 天气预报`;
            }
            
            updateCurrentWeather(weatherData);
            updateForecast(forecastData);
            updateTemperatureChart(forecastData);
            
            // 应用背景变化基于当前天气
            applyWeatherBackground(weatherData.weather[0].id);
            
            // 在后台刷新数据
            setTimeout(() => {
                loadWeatherData();
            }, 1000);
            
            return true;
        }
        
        return false;
    }
    
    // 处理刷新按钮点击
    function handleRefreshClick() {
        if(!refreshBtn) return;
        
        refreshBtn.classList.add('loading');
        loadWeatherData().finally(() => {
            setTimeout(() => {
                refreshBtn.classList.remove('loading');
            }, 1000);
        });
    }
    
    // 处理单位切换
    function handleUnitToggleChange() {
        if(!unitToggle) return;
        
        currentUnit = unitToggle.checked ? 'imperial' : 'metric';
        loadWeatherData();
    }
    
    // 处理搜索按钮点击
    function handleSearchClick() {
        if(!cityInput) {
            console.error('无法找到城市输入框元素');
            return;
        }
        
        const query = cityInput.value.trim();
        console.log('搜索按钮点击，查询:', query);
        
        if (query) {
            currentCity = query;
            currentCountry = ''; // 让API自动确定国家
            loadWeatherData();
            if(searchResults) {
                searchResults.classList.remove('active');
            }
        } else {
            console.log('查询为空，不执行搜索');
            showError('请输入城市名称');
        }
    }
    
    // 搜索城市
    async function searchCities(query) {
        if(!searchResults) return;
        
        if (query.length < 3) {
            searchResults.classList.remove('active');
            return;
        }
        
        console.log('正在搜索城市:', query);
        
        try {
            const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`);
            if (!response.ok) {
                throw new Error('City search failed');
            }
            
            const cities = await response.json();
            console.log('搜索结果:', cities);
            
            // 显示搜索结果
            searchResults.innerHTML = '';
            
            if (cities.length === 0) {
                searchResults.innerHTML = '<div class="search-item">未找到结果</div>';
            } else {
                cities.forEach(city => {
                    const cityItem = document.createElement('div');
                    cityItem.className = 'search-item';
                    
                    // 城市名称和州/省（如果有）
                    let cityText = city.name;
                    if (city.state) {
                        cityText += `, ${city.state}`;
                    }
                    
                    // 添加国家代码
                    const countrySpan = document.createElement('span');
                    countrySpan.className = 'country';
                    countrySpan.textContent = city.country;
                    
                    cityItem.textContent = cityText;
                    cityItem.appendChild(countrySpan);
                    
                    // 添加点击事件以选择城市
                    cityItem.addEventListener('click', () => {
                        if(cityInput) cityInput.value = city.name;
                        currentCity = city.name;
                        currentCountry = city.country;
                        searchResults.classList.remove('active');
                        loadWeatherData();
                    });
                    
                    searchResults.appendChild(cityItem);
                });
            }
            
            searchResults.classList.add('active');
            
        } catch (error) {
            console.error('Error searching cities:', error);
            searchResults.innerHTML = '<div class="search-item">搜索出错，请稍后再试</div>';
            searchResults.classList.add('active');
        }
    }
    
    // 显示加载中
    function showLoading() {
        if(loadingOverlay) {
            console.log('显示加载动画');
            loadingOverlay.classList.remove('hidden');
        }
    }
    
    // 隐藏加载中
    function hideLoading() {
        if(loadingOverlay) {
            console.log('隐藏加载动画');
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 500);
        }
    }
    
    // 显示错误信息
    function showError(message) {
        console.error('错误:', message);
        alert(message);
    }
    
    // 格式化天气描述（墨迹天气风格）
    function formatWeatherDescription(description, weatherId) {
        // 优化描述文本，使其更接近墨迹天气风格
        const weatherTypes = {
            200: '雷阵雨',
            201: '雷阵雨',
            202: '雷暴',
            210: '雷阵雨',
            211: '雷暴',
            212: '强雷暴',
            221: '雷阵雨',
            230: '雷阵雨',
            231: '雷阵雨',
            232: '雷暴',
            300: '小雨',
            301: '小雨',
            302: '中雨',
            310: '小雨',
            311: '小雨',
            312: '中雨',
            313: '小雨',
            314: '中雨',
            321: '阵雨',
            500: '小雨',
            501: '中雨',
            502: '大雨',
            503: '暴雨',
            504: '大暴雨',
            511: '冻雨',
            520: '阵雨',
            521: '阵雨',
            522: '大阵雨',
            531: '阵雨',
            600: '小雪',
            601: '中雪',
            602: '大雪',
            611: '雨夹雪',
            612: '雨夹雪',
            613: '雨夹雪',
            615: '雨夹雪',
            616: '雨夹雪',
            620: '阵雪',
            621: '阵雪',
            622: '大阵雪',
            701: '雾',
            711: '烟霾',
            721: '霾',
            731: '扬沙',
            741: '雾',
            751: '沙尘',
            761: '尘',
            762: '火山灰',
            771: '狂风',
            781: '龙卷风',
            800: '晴',
            801: '少云',
            802: '多云',
            803: '阴',
            804: '阴'
        };
        
        return weatherTypes[weatherId] || description;
    }
    
    // 获取风向描述
    function getWindDirection(degrees) {
        const directions = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风'];
        const index = Math.round(degrees / 45) % 8;
        return directions[index];
    }
});