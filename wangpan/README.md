# 抖音视频下载器 - 自动上传百度网盘

一个功能强大的抖音视频下载工具，支持批量下载、多清晰度选择、格式转换，并可自动上传到百度网盘。

**核心特性**: 集成了 [F2](https://github.com/Johnserf-Seed/f2) 库，实现高效的抖音视频解析和下载。

## 功能特性

- 🎥 **批量下载抖音视频** - 支持同时处理多个视频链接
- 🎬 **多种清晰度选择** - 1080P、720P、480P、360P
- 📸 **下载视频封面** - 保存视频缩略图
- 📝 **下载视频文案** - 提取视频描述和标题
- 🎵 **音视频分离** - 单独下载音频轨道
- 🔄 **格式转换** - 支持MP4、AVI、MOV格式
- ☁️ **自动上传百度网盘** - 下载完成后自动备份
- 📊 **实时下载进度** - 可视化显示下载状态
- 🎨 **现代化Web界面** - 响应式设计，操作便捷

## 项目结构

```
wangpan/
├── frontend/              # 前端代码
│   ├── index.html        # 主页面
│   ├── styles.css        # 样式文件
│   └── script.js         # JavaScript代码
├── backend/              # 后端代码
│   ├── main.py          # FastAPI主应用
│   ├── requirements.txt  # Python依赖
│   ├── f2_config.yaml   # F2配置文件示例
│   ├── .env.example     # 环境变量示例
│   └── services/        # 服务模块
│       ├── douyin_service.py    # 抖音视频服务（基于F2）
│       ├── baidu_service.py     # 百度网盘服务
│       └── task_manager.py      # 任务管理器
├── start.bat            # Windows启动脚本
├── start.sh             # Linux/Mac启动脚本
└── README.md            # 项目说明
```

## 快速开始

### 前置要求

- Python 3.8+
- Node.js 16+（可选，用于开发）

### 关于F2

本项目使用 [F2](https://github.com/Johnserf-Seed/f2) 库进行抖音视频的解析和下载。F2是一个强大的多平台视频下载工具，支持：
- 抖音单个作品、主页作品、点赞作品、收藏作品、合集等
- TikTok视频下载
- 直播流录制
- 用户信息获取
- 等等

安装时会自动安装F2及其依赖。

### 安装步骤

#### 1. 克隆项目

```bash
git clone <repository_url>
cd wangpan
```

#### 2. 安装后端依赖

```bash
cd backend
pip install -r requirements.txt
```

#### 3. 配置环境变量

```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑.env文件，填入你的百度网盘API配置
# 如果不需要使用百度网盘功能，可以暂时不配置
```

#### 4. 启动后端服务

```bash
cd backend
python main.py
```

服务将在 `http://localhost:5000` 启动。

#### 5. 访问前端界面

直接在浏览器中打开 `frontend/index.html` 文件，或者使用HTTP服务器：

```bash
cd frontend
# 使用Python的HTTP服务器
python -m http.server 8080

# 或使用Node.js的http-server
npx http-server -p 8080
```

然后访问 `http://localhost:8080`。

## 使用说明

### 基本使用

1. 在视频链接输入框中粘贴抖音视频链接（支持批量输入，每行一个）
2. 选择下载设置：
   - 视频清晰度
   - 下载内容（视频、封面、文案、音频）
   - 格式转换选项
   - 百度网盘上传设置
3. 点击"开始下载"按钮
4. 查看实时下载进度

### 抖音链接格式支持

- `https://www.douyin.com/video/123456`
- `https://v.douyin.com/xxxxxx/`
- 短链接格式

### 百度网盘配置

如需使用百度网盘上传功能，需要：

1. 前往[百度网盘开放平台](https://pan.baidu.com/union/doc/0ksg0sbig)申请应用
2. 获取 App Key 和 Secret Key
3. 在 `.env` 文件中配置：
   ```
   BAIDU_APP_KEY=your_app_key
   BAIDU_SECRET_KEY=your_secret_key
   BAIDU_ACCESS_TOKEN=your_access_token
   ```

## API文档

启动后端服务后，可以访问以下地址查看API文档：

- Swagger UI: `http://localhost:5000/docs`
- ReDoc: `http://localhost:5000/redoc`

### 主要API端点

#### 提交下载任务

```http
POST /api/download
Content-Type: application/json

{
  "urls": [
    "https://www.douyin.com/video/123456"
  ],
  "settings": {
    "quality": "1080p",
    "downloadVideo": true,
    "downloadCover": false,
    "downloadDescription": false,
    "downloadAudio": false,
    "formatConversion": "none",
    "uploadToBaidu": true,
    "baiduPath": "/抖音视频"
  }
}
```

#### 获取任务进度

```http
GET /api/progress/{task_id}
```

#### 获取所有任务

```http
GET /api/tasks
```

## 技术栈

### 前端
- 纯HTML5 + CSS3 + JavaScript
- 响应式设计
- 现代化UI界面

### 后端
- **FastAPI** - 高性能Python Web框架
- **F2** - 抖音/TikTok视频下载核心库
- aiohttp - 异步HTTP客户端
- httpx - 现代化的HTTP客户端
- Pydantic - 数据验证

### 核心依赖
- f2[dy] - F2库（抖音支持）
- aiofiles - 异步文件操作
- aiosqlite - 异步数据库
- PyYAML - YAML配置文件支持
- m3u8 - M3U8视频流处理

## 开发说明

### 使用F2库

本项目已经集成了 [F2](https://github.com/Johnserf-Seed/f2) 库，直接使用即可。

#### F2配置

1. **基础配置**（可选）

   F2会自动工作，但你也可以创建自定义配置文件：

   ```bash
   # 创建F2配置目录
   mkdir -p ~/.f2

   # 复制示例配置
   cp backend/f2_config.yaml ~/.f2/config.yaml

   # 根据需要编辑配置
   nano ~/.f2/config.yaml
   ```

2. **配置Cookie**（可选）

   如果需要下载需要登录的视频（如私密视频、收藏等），需要配置Cookie：

   - 在浏览器中登录抖音
   - 打开开发者工具 (F12)
   - 复制Cookie值
   - 在 `~/.f2/config.yaml` 中配置或在 `.env` 文件中设置 `DOUYIN_COOKIE`

3. **代理设置**（可选）

   如果需要使用代理：

   ```bash
   # 在 .env 文件中设置
   HTTP_PROXY=http://127.0.0.1:7890
   HTTPS_PROXY=http://127.0.0.1:7890
   ```

#### F2 API使用示例

```python
from f2.apps.douyin import fetch_one_video

# 获取单个视频信息
video_data = await fetch_one_video("https://www.douyin.com/video/123456")

# 视频信息会包含：
# - aweme_details: 视频详细信息
# - author: 作者信息
# - video: 视频下载链接
# - music: 音频信息
# 等等
```

更多F2使用方法请参考 [F2官方文档](https://johnserf-seed.github.io/f2/)。

### 百度网盘API

百度网盘上传功能支持两种模式：
1. **真实模式**: 配置了API密钥后，实际上传到百度网盘
2. **模拟模式**: 未配置时，返回模拟链接用于测试

## 常见问题

### 1. F2安装失败

如果安装F2时遇到问题：

```bash
# 单独安装F2（带抖音支持）
pip install 'f2[dy]'

# 如果遇到PyExecJS相关错误
# Windows用户需要安装Node.js
# Linux/Mac用户可能需要:
sudo apt-get install nodejs npm  # Ubuntu/Debian
brew install nodejs  # macOS
```

### 2. 后端服务启动失败

检查端口5000是否被占用，或修改 `main.py` 中的端口配置。

### 3. 下载失败

- 检查网络连接
- 确认抖音链接格式正确
- 如果下载私密视频，确保已正确配置Cookie
- 查看后端日志获取详细错误信息

### 4. 视频链接403错误

- 可能是Cookie过期，需要重新获取
- 尝试配置代理
- 检查视频是否已被删除或设为私密

### 5. 百度网盘上传失败

- 检查API密钥配置是否正确
- 确认访问令牌是否有效
- 查看后端日志获取详细错误信息

### 6. 如何获取F2支持

如果遇到F2相关的问题：
- 查看 [F2官方文档](https://johnserf-seed.github.io/f2/)
- 提交 [F2 Issues](https://github.com/Johnserf-Seed/f2/issues)

## 注意事项

- 本项目仅供学习交流使用
- 请遵守抖音和百度网盘的使用条款
- 下载的视频内容请勿用于商业用途
- 建议添加适当的限流机制，避免请求过快

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 联系方式

如有问题或建议，请提交Issue。

---

**免责声明**: 本工具仅供学习和个人使用，请勿用于任何商业用途或违反相关服务条款的行为。
