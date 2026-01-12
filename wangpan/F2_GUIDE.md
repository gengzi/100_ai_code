# F2使用指南

本文档介绍如何在本项目中使用F2库。

## 什么是F2？

F2是一个强大的Python库，用于下载多个平台的视频内容，包括：
- 抖音 (Douyin)
- TikTok
- Twitter
- 微博
- 等等

官方仓库: https://github.com/Johnserf-Seed/f2
官方文档: https://johnserf-seed.github.io/f2/

## 安装

### 基础安装

```bash
pip install f2[dy]
```

### 安装所有平台支持

```bash
pip install f2[dy,tk,tw,wb,x]
```

- dy: 抖音
- tk: TikTok
- tw: Twitter
- wb: 微博
- x: Twitter/X

## 配置

### 1. 配置文件位置

F2默认会查找 `~/.f2/config.yaml` 配置文件。

### 2. 创建配置文件

```bash
# 创建配置目录
mkdir -p ~/.f2

# 复制示例配置
cp backend/f2_config.yaml ~/.f2/config.yaml
```

### 3. 主要配置项

```yaml
douyin:
  headers:
    User-Agent: "Mozilla/5.0 ..."
    Cookie: ""  # 可选，用于登录状态

  download:
    path: "downloads"  # 下载路径
    naming: "{create}_{desc}_{nickname}"  # 文件命名
    chunk: 16  # 下载线程数
```

## 使用示例

### Python API

```python
import asyncio
from f2.apps.douyin import fetch_one_video

async def download_video():
    url = "https://www.douyin.com/video/71234567890"
    video_data = await fetch_one_video(url)

    # 获取视频信息
    aweme_details = video_data.get("aweme_details", {})

    # 提取视频标题
    title = aweme_details.get("desc", "")

    # 提取视频URL
    video_url = aweme_details.get("video", {}).get("play_addr", {}).get("url_list", [])[0]

    print(f"标题: {title}")
    print(f"视频URL: {video_url}")

# 运行
asyncio.run(download_video())
```

### 命令行

```bash
# 下载单个视频
f2 dy -u "https://www.douyin.com/video/71234567890"

# 下载用户主页所有视频
f2 dy -u "https://www.douyin.com/user/..."

# 下载点赞列表
f2 dy --like "https://www.douyin.com/user/..."

# 下载收藏列表
f2 dy --collection "https://www.douyin.com/user/..."

# 下载合集
f2 dy --mix "https://www.douyin.com/collection/..."
```

## 在本项目中使用

### 服务层集成

本项目的 `backend/services/douyin_service.py` 已经集成了F2：

```python
from f2.apps.douyin import fetch_one_video, DouyinHandler

class DouyinService:
    def __init__(self):
        self.handler = DouyinHandler()

    async def download_video(self, url: str):
        # 使用F2获取视频信息
        video_data = await fetch_one_video(url)
        # 处理视频数据...
```

### API调用

```python
# 通过API调用
import requests

response = requests.post('http://localhost:5000/api/download', json={
    "urls": ["https://www.douyin.com/video/71234567890"],
    "settings": {
        "quality": "1080p",
        "downloadVideo": true,
        "downloadCover": false,
        "downloadDescription": true,
        "downloadAudio": false,
        "formatConversion": "none",
        "uploadToBaidu": false
    }
})
```

## 常见功能

### 获取视频信息

```python
from f2.apps.douyin import fetch_one_video

video_data = await fetch_one_video(url)
```

### 获取用户信息

```python
from f2.apps.douyin import fetch_user_profile

user_data = await fetch_user_profile(sec_user_id)
```

### 获取用户作品

```python
from f2.apps.douyin import fetch_user_post_videos

videos_data = await fetch_user_post_videos(sec_user_id)
```

### 获取点赞作品

```python
from f2.apps.douyin import fetch_user_like_videos

liked_videos = await fetch_user_like_videos(sec_user_id)
```

### 获取收藏夹

```python
from f2.apps.douyin import fetch_user_collects_videos

collections = await fetch_user_collects_videos(sec_user_id)
```

## Cookie配置（可选）

如果需要下载私密视频或使用登录功能，需要配置Cookie。

### 获取Cookie

1. 在浏览器中打开抖音网页版
2. 登录账号
3. 按F12打开开发者工具
4. 切换到 Network 标签
5. 刷新页面
6. 找到任意请求，查看请求头中的 Cookie
7. 复制Cookie值

### 配置Cookie

**方法1：配置文件**

编辑 `~/.f2/config.yaml`：

```yaml
douyin:
  headers:
    Cookie: "你的Cookie值"
```

**方法2：环境变量**

编辑 `backend/.env`：

```bash
DOUYIN_COOKIE=你的Cookie值
```

## 代理设置（可选）

如果需要使用代理：

**方法1：配置文件**

```yaml
common:
  proxy: "http://127.0.0.1:7890"
```

**方法2：环境变量**

```bash
HTTP_PROXY=http://127.0.0.1:7890
HTTPS_PROXY=http://127.0.0.1:7890
```

## 常见问题

### 1. PyExecJS错误

确保已安装Node.js：

```bash
# Windows
# 下载并安装 https://nodejs.org/

# Linux
sudo apt-get install nodejs npm

# macOS
brew install nodejs
```

### 2. 视频下载403错误

- 检查Cookie是否过期
- 尝试使用代理
- 确认视频是否可访问

### 3. 依赖安装失败

```bash
# 升级pip
python -m pip install --upgrade pip

# 单独安装F2
pip install f2[dy]
```

## 更多资源

- [F2官方文档](https://johnserf-seed.github.io/f2/)
- [F2 GitHub](https://github.com/Johnserf-Seed/f2)
- [F2 CLI文档](https://johnserf-seed.github.io/f2/guide/cli/)
- [API示例](https://johnserf-seed.github.io/f2/guide/api-examples/)

## 免责声明

F2库仅供学习和研究使用，请遵守相关平台的使用条款。
