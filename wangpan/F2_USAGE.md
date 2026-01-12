# F2 配置和使用指南

## ✅ 已正确集成 F2！

项目现在使用 f2 库进行抖音视频下载，并支持指定配置文件路径。

## 🔧 F2 配置说明

### 1. 配置文件位置

项目已包含 `backend/f2_config.yaml` 配置文件，该文件已经配置好了你的 Cookie。

### 2. 配置文件结构

```yaml
douyin:
  headers:
    User-Agent: "Mozilla/5.0 ..."
    Referer: "https://www.douyin.com/"
    Cookie: "你的Cookie"  # 已配置

  download:
    path: "downloads"
    naming: "{create}_{desc}_{nickname}"
    chunk: 16
```

### 3. Cookie 配置

你的 Cookie 已经在 `f2_config.yaml` 中配置好，可以：
- ✅ 下载公开视频
- ✅ 下载需要登录的视频
- ✅ 下载你自己的私密视频
- ✅ 下载收藏、点赞等

## 📝 使用方式

### 方式1: 使用项目配置文件（推荐）

项目会自动使用 `backend/f2_config.yaml` 配置文件：

```bash
cd backend
python main.py
```

### 方式2: 使用自定义配置文件

1. 创建自己的配置文件：
```bash
cp backend/f2_config.yaml my_config.yaml
# 编辑 my_config.yaml
```

2. 设置环境变量指定配置文件：
```bash
# Windows
set F2_CONFIG_PATH=D:\path\to\my_config.yaml
python main.py

# Linux/Mac
export F2_CONFIG_PATH=/path/to/my_config.yaml
python main.py
```

### 方式3: 使用环境变量覆盖

在 `backend/.env` 文件中设置：

```bash
# 抖音Cookie（会覆盖配置文件中的Cookie）
DOUYIN_COOKIE=你的Cookie

# 代理设置
HTTP_PROXY=http://127.0.0.1:7890
HTTPS_PROXY=http://127.0.0.1:7890
```

## 🎯 F2 使用示例

### Python 代码中使用

```python
import f2
from f2.apps.douyin.handler import DouyinHandler

# 方式1: 指定配置文件路径
f2.APP_CONFIG_FILE_PATH = "path/to/config.yaml"
handler = DouyinHandler()

# 方式2: 传入参数
kwargs = {
    "headers": {
        "User-Agent": "Mozilla/5.0 ...",
        "Referer": "https://www.douyin.com/",
    },
    "cookie": "你的Cookie",
}
handler = DouyinHandler(kwargs)

# 获取单个视频
video_data = await handler.fetch_one_video("视频链接")

# 获取用户主页作品
user_videos = await handler.fetch_user_post("sec_user_id")

# 获取点赞作品
liked_videos = await handler.fetch_user_like("sec_user_id")

# 获取收藏作品
collection = await handler.fetch_user_collection("sec_user_id")
```

### CLI 命令行使用

```bash
# 下载单个视频
f2 dy -u "https://www.douyin.com/video/7300000000000000"

# 使用自定义配置文件
f2 dy -c custom_config.yaml -u "视频链接"

# 下载用户主页所有视频
f2 dy -M post -u "用户主页链接"

# 下载点赞列表
f2 dy --like "用户主页链接"

# 下载收藏列表
f2 dy --collection "用户主页链接"

# 设置日志级别
f2 -d WARNING dy -u "视频链接"
```

## 🔍 项目中的使用

### 1. 服务初始化

在 `backend/main.py` 中：

```python
# 自动使用 backend/f2_config.yaml
f2_config_path = os.path.join(os.path.dirname(__file__), "f2_config.yaml")
douyin_service = DouyinService(config_path=f2_config_path)
```

### 2. API 调用

```python
# 在 DouyinService 中
await self.handler.fetch_one_video(url)
```

### 3. 数据解析

f2 返回的是 Filter 对象，需要解析：

```python
# 转换为字典
if hasattr(f2_data, '_to_dict'):
    data = f2_data._to_dict()

# 提取视频信息
aweme_data = data.get("aweme_details", {})
video_url = aweme_data.get("video", {}).get("play_addr", {}).get("url_list", [""])[0]
```

## 🛠️ 常见问题

### 1. Cookie 过期怎么办？

**症状**: 下载失败，提示需要登录

**解决**:
1. 在浏览器中重新登录抖音
2. 打开开发者工具 (F12)
3. 复制新的 Cookie
4. 更新 `f2_config.yaml` 中的 Cookie

### 2. 如何获取 Cookie？

1. 在浏览器中打开 https://www.douyin.com
2. 登录你的账号
3. 按 F12 打开开发者工具
4. 切换到 Network 标签
5. 刷新页面
6. 找到任意请求，查看请求头
7. 复制 Cookie 值

### 3. 配置文件不生效？

**检查**:
1. 确认配置文件路径正确
2. 检查 Cookie 是否完整
3. 查看日志输出，确认使用了哪个配置文件

### 4. 视频下载 403 错误？

**可能原因**:
- Cookie 过期
- 视频被删除或设为私密
- 触发了反爬限制

**解决**:
- 更新 Cookie
- 配置代理
- 等待一段时间再试

### 5. f2 安装失败？

```bash
# 单独安装 f2
pip install 'f2[dy]'

# 如果遇到依赖冲突
pip install --upgrade pip
pip install --no-cache-dir 'f2[dy]'
```

## 📊 支持的功能

使用 f2，你的项目现在支持：

- ✅ 单个视频下载
- ✅ 用户主页作品
- ✅ 点赞作品列表
- ✅ 收藏夹作品
- ✅ 收藏作品
- ✅ 合集作品
- ✅ 直播流录制
- ✅ 用户信息获取
- ✅ 等等...

## 🎉 完成！

现在你的项目：
1. ✅ 使用 f2 库进行抖音视频下载
2. ✅ 支持指定配置文件路径
3. ✅ 已配置好 Cookie
4. ✅ 可以下载各种类型的视频
5. ✅ 完整的错误处理

## 📚 相关文档

- F2 官方文档: https://f2.wiki/
- F2 GitHub: https://github.com/Johnserf-Seed/f2
- F2 API 列表: https://f2.wiki/guide/apps/douyin/overview

---

**注意**:
- Cookie 是敏感信息，请勿泄露
- 定期更新 Cookie 以保持功能正常
- 遵守抖音和 f2 的使用条款
