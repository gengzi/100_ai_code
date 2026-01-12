# 快速开始指南

## ✅ 修复完成！

已成功修复所有依赖问题。项目现在使用自定义的抖音视频下载服务，不再依赖F2库。

## 📦 安装步骤

### 1. 安装依赖

```bash
cd backend

# 升级pip
python -m pip install --upgrade pip

# 安装项目依赖
pip install -r requirements.txt
```

### 2. 配置环境变量（可选但推荐）

```bash
# 复制环境变量文件
cp .env.example .env

# 编辑.env文件
# Windows: notepad .env
# Linux/Mac: nano .env 或 vim .env
```

**推荐配置TikHub API**（提高成功率）：
- 注册地址: https://beta-web.tikhub.io/users/signup?referral_code=6hLcGD94
- 每日签到免费获取额度
- 在`.env`文件中设置: `TIKHUB_API_KEY=your_api_key_here`

### 3. 启动服务

```bash
# 方式1: 直接运行
python main.py

# 方式2: 使用启动脚本
# Windows: 返回项目根目录，运行 start.bat
# Linux/Mac: 返回项目根目录，运行 ./start.sh
```

服务将在 `http://localhost:5000` 启动。

### 4. 访问前端界面

```bash
# 方式1: 直接在浏览器打开
frontend/index.html

# 方式2: 使用HTTP服务器
cd frontend
python -m http.server 8080

# 然后访问: http://localhost:8080
```

## 🎯 测试功能

### API测试

```bash
# 测试提交下载任务
curl -X POST http://localhost:5000/api/download \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://www.douyin.com/video/7300000000000000"],
    "settings": {
      "quality": "1080p",
      "downloadVideo": true,
      "downloadCover": true,
      "downloadDescription": true,
      "downloadAudio": false,
      "formatConversion": "none",
      "uploadToBaidu": false
    }
  }'
```

### API文档

启动服务后访问:
- Swagger UI: `http://localhost:5000/docs`
- ReDoc: `http://localhost:5000/redoc`

## 🔧 抖音下载方式

### 当前实现支持三种方式（按优先级自动选择）：

1. **TikHub API**（推荐）
   - 需要配置API Key
   - 最稳定可靠
   - 免费额度足够使用

2. **HTML解析**（免费）
   - 自动尝试
   - 适用于公开视频
   - 可能有限制

3. **模拟数据**（测试）
   - 前两种都失败时使用
   - 用于测试系统功能

### 如何获取TikHub API Key？

1. 访问: https://beta-web.tikhub.io/users/signup?referral_code=6hLcGD94
2. 注册并登录
3. 进入控制台获取API Key
4. 在`backend/.env`文件中配置:
   ```
   TIKHUB_API_KEY=你的API_Key
   ```

## 📚 项目结构

```
wangpan/
├── frontend/                 # 前端界面
│   ├── index.html           # 主页面
│   ├── styles.css           # 样式
│   └── script.js            # JavaScript
├── backend/                 # 后端服务
│   ├── main.py              # FastAPI主应用
│   ├── requirements.txt     # Python依赖（已简化）
│   ├── .env.example         # 环境变量配置
│   └── services/            # 服务模块
│       ├── douyin_service.py    # 抖音下载服务（自定义实现）
│       ├── baidu_service.py     # 百度网盘服务
│       └── task_manager.py      # 任务管理器
├── FIX.md                   # 技术方案说明
├── start.bat                # Windows启动脚本
└── start.sh                 # Linux/Mac启动脚本
```

## ⚡ 核心特性

- ✅ 简化的依赖管理
- ✅ 自定义抖音下载服务
- ✅ 支持TikHub API（推荐）
- ✅ 支持HTML解析（免费）
- ✅ 批量下载
- ✅ 实时进度显示
- ✅ 百度网盘自动上传
- ✅ 现代化Web界面

## 🐛 故障排除

### 1. 依赖安装失败

```bash
# 清理缓存重试
pip cache purge
pip install --no-cache-dir -r requirements.txt
```

### 2. 服务启动失败

```bash
# 检查端口占用
# Windows: netstat -ano | findstr :5000
# Linux/Mac: lsof -i :5000

# 修改端口（编辑main.py）
# uvicorn.run(app, host="0.0.0.0", port=5001)
```

### 3. 下载视频失败

- 确认抖音链接格式正确
- 配置TikHub API提高成功率
- 检查网络连接
- 查看后端日志

### 4. 下载视频403错误

- 配置TikHub API
- 或配置代理
- 检查视频是否可公开访问

## 📝 配置说明

### backend/.env 文件

```bash
# 百度网盘（可选）
BAIDU_APP_KEY=your_key
BAIDU_SECRET_KEY=your_secret
BAIDU_ACCESS_TOKEN=your_token

# TikHub API（推荐）
TIKHUB_API_KEY=your_tikhub_key

# 其他配置
DOWNLOAD_DIR=downloads
LOG_LEVEL=INFO
```

## 🎉 完成！

现在你可以：
1. 安装依赖: `pip install -r requirements.txt`
2. 配置API（推荐）: 编辑`.env`文件
3. 启动服务: `python main.py`
4. 访问前端: 打开`frontend/index.html`
5. 下载视频: 输入抖音链接开始下载

## 📖 更多文档

- `README.md` - 项目总体说明
- `FIX.md` - 技术方案详细说明
- `INSTALL.md` - 详细安装指南
- `F2_GUIDE.md` - F2使用指南（仅供参考）

---

**注意**: 当前实现不再依赖F2库，使用更简单可靠的自定义方案。
