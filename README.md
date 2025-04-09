# 江阴长泾天气预报网站

一个简单的天气预报网站，显示江阴长泾地区的当前天气和未来5天的天气预报。

## 功能特点

- 显示当前日期和时间
- 显示当前温度、天气状况、风速和湿度
- 显示未来5天的天气预报
- 响应式设计，适配各种设备屏幕
- 美观的用户界面

## 如何使用

1. 访问网站即可查看天气信息
2. 页面会自动更新时间和刷新天气数据

## 本地开发

1. 克隆本仓库到本地

```bash
git clone https://github.com/yourusername/changjing-weather.git
cd changjing-weather
```

2. 获取OpenWeatherMap API密钥

前往 [OpenWeatherMap](https://openweathermap.org/) 注册账号并获取免费的API密钥。

3. 在 `js/app.js` 文件中更新API密钥

```javascript
const API_KEY = '你的API密钥'; // 将你的API密钥填写在这里
```

4. 使用本地服务器运行项目

你可以使用任何静态文件服务器来运行项目，例如：

- 使用Visual Studio Code的Live Server插件
- 使用Node.js的http-server
- 使用Python的SimpleHTTPServer

```bash
# 使用http-server (需要先安装Node.js)
npx http-server

# 或使用Python
python -m http.server
```

## 部署到GitHub Pages

1. Fork本仓库或创建一个新的仓库
2. 上传代码到仓库
3. 在仓库设置中启用GitHub Pages
   - 进入仓库的Settings > Pages
   - 选择分支(通常是main或master)并保存
4. 几分钟后，你的网站将可以通过GitHub Pages URL访问

## 技术栈

- HTML5
- CSS3
- JavaScript (ES6+)
- OpenWeatherMap API
- Font Awesome图标

## 注意事项

- 免费的OpenWeatherMap API有请求次数限制
- 确保API密钥的安全，不要在公开仓库中暴露
- 当API密钥未设置时，网站会使用模拟数据演示功能

## 许可证

MIT 