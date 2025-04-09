// Constants
const API_KEY = '4f8dc7d60ee47e346a86ba9ba5ae236d'; // 您的OpenWeatherMap API密钥
const DEFAULT_CITY = 'Jiangyin'; // 默认城市
const DEFAULT_COUNTRY = 'CN'; // 默认国家代码
const UNITS = 'metric'; // 单位制（metric公制，imperial英制）
const LANG = 'zh_cn'; // 语言设置

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
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
    let currentCity = DEFAULT_CITY;
    let currentCountry = DEFAULT_COUNTRY;
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
        
        // 加载天气数据
        loadWeatherData();
        
        // 事件监听器
        if(refreshBtn) {
            refreshBtn.addEventListener('click', handleRefreshClick);
        }
        
        if(unitToggle) {
            unitToggle.addEventListener('change', handleUnitToggleChange);
        }
        
        if(searchBtn) {
            searchBtn.addEventListener('click', handleSearchClick);
        }
        
        if(cityInput) {
            cityInput.addEventListener('keyup', handleCityInputKeyup);
            cityInput.addEventListener('focus', () => {
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
                searchResults.classList.remove('active');
            });
            cityInput.parentNode.appendChild(clearButton);
        }
        
        // 热门城市标签点击
        cityTags.forEach(tag => {
            tag.addEventListener('click', () => {
                const city = tag.getAttribute('data-city');
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
        
        console.log('初始化完成，监听事件已设置');
    }
    
    // 更新日期和时间
    function updateDateTime() {
        const now = new Date();
        
        // 设置日期
        if(currentDateElement) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            currentDateElement.textContent = now.toLocaleDateString('zh-CN', options);
        }
        
        // 设置时间
        if(currentTimeElement) {
            currentTimeElement.textContent = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
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
            // 当前天气数据
            const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${currentCity},${currentCountry}&appid=${API_KEY}&units=${currentUnit}&lang=${LANG}`);
            if (!weatherResponse.ok) {
                throw new Error('Weather data fetch failed');
            }
            weatherData = await weatherResponse.json();
            
            // 改变网站标题为城市名
            if(cityNameElement) {
                cityNameElement.textContent = `${weatherData.name} 天气预报`;
                document.title = `${weatherData.name} 天气预报`;
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
            
            // 更新预报
            updateForecast(forecastData);
            
            // 更新温度趋势图
            updateTemperatureChart(forecastData);
            
            // 初始化地图
            initMap(weatherData.coord.lat, weatherData.coord.lon);
            
            // 应用背景变化基于当前天气
            applyWeatherBackground(weatherData.weather[0].id);
            
        } catch (error) {
            console.error('Error fetching weather data:', error);
            showError(`无法获取城市 "${currentCity}" 的天气数据，请检查城市名称是否正确。`);
        } finally {
            hideLoading();
        }
    }
    
    // 更新当前天气信息
    function updateCurrentWeather(data) {
        // 设置图标
        if(weatherIcon) {
            const iconCode = data.weather[0].icon;
            weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
            weatherIcon.alt = data.weather[0].description;
        }
        
        // 设置描述
        if(weatherDescription) {
            weatherDescription.textContent = data.weather[0].description;
        }
        
        // 设置温度
        if(currentTemp) {
            currentTemp.textContent = Math.round(data.main.temp);
        }
        
        if(feelsLike) {
            feelsLike.textContent = Math.round(data.main.feels_like);
        }
        
        // 设置其他详情
        if(windSpeed) {
            windSpeed.textContent = `${data.wind.speed} m/s`;
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
        if(!cityInput) return;
        
        const query = cityInput.value.trim();
        if (query) {
            console.log('搜索按钮点击，查询:', query);
            currentCity = query;
            currentCountry = ''; // 让API自动确定国家
            loadWeatherData();
            if(searchResults) {
                searchResults.classList.remove('active');
            }
        }
    }
    
    // 处理输入框键盘事件
    function handleCityInputKeyup(e) {
        if (e.key === 'Enter') {
            handleSearchClick();
        } else if (cityInput.value.length >= 3) {
            searchCities(cityInput.value);
        } else {
            if(searchResults) {
                searchResults.classList.remove('active');
            }
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
        // 可以用toast或警告框显示错误
        alert(message);
    }
});