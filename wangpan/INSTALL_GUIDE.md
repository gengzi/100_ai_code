# 完整安装和测试指南

## 📦 安装步骤

### 1. 安装 f2 和所有依赖

```bash
cd backend

# 升级 pip
python -m pip install --upgrade pip

# 安装 f2（会自动安装所有依赖）
pip install 'f2[dy]'

# 或者从 requirements.txt 安装
pip install -r requirements.txt
```

### 2. 验证安装

```bash
# 测试 f2 是否安装成功
python -c "import f2; print('✓ f2 安装成功')"
python -c "from f2.apps.douyin.handler import DouyinHandler; print('✓ DouyinHandler 可以使用')"

# 测试项目服务
python -c "from services.douyin_service import DouyinService; print('✓ DouyinService 导入成功')"
```

### 3. 配置（已完成）

✅ Cookie 已在 `backend/f2_config.yaml` 中配置
✅ 百度网盘密钥已在 `backend/services/baidu_service.py` 中配置

### 4. 启动服务

```bash
cd backend
python main.py
```

服务将在 `http://localhost:5000` 启动。

## 🎯 快速测试

### 方式1: 使用 API

```bash
# 提交下载任务
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

### 方式2: 使用前端界面

1. 在浏览器中打开 `frontend/index.html`
2. 粘贴抖音视频链接
3. 点击"开始下载"

### 方式3: 直接使用 f2 CLI

```bash
# 下载单个视频
f2 dy -c backend/f2_config.yaml -u "https://www.douyin.com/video/7300000000000000"

# 下载用户主页所有视频
f2 dy -c backend/f2_config.yaml -M post -u "用户主页链接"
```

## 🔧 配置说明

### f2_config.yaml（已配置）

```yaml
douyin:
  headers:
    Cookie: "你的完整Cookie"  # ✓ 已配置
```

### baidu_service.py（已配置）

```python
self.app_key = "FDSJDDS4x3nzNPxb4GRw2gXvRaT7wDEH"
self.secret_key = "svgZqRG0a8kcB6gOn6eQvOYf45eTN0kJ"
self.access_token = "u7HJPNIO!7dSoo1Kc~F7tAEQQH@tNhND"
```

## 📊 功能测试清单

测试以下功能：

- [ ] 单个视频下载
- [ ] 批量视频下载
- [ ] 下载视频封面
- [ ] 保存视频文案
- [ ] 下载音频
- [ ] 上传百度网盘
- [ ] 实时进度显示

## 🐛 常见问题

### 1. f2 安装失败

```bash
# 使用国内镜像
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple 'f2[dy]'

# 或手动安装依赖
pip install aiohttp httpx pyyaml aiosqlite
pip install 'f2[dy]'
```

### 2. Cookie 无效

**症状**: 提示需要登录或 403 错误

**解决**:
1. 在浏览器中重新登录抖音
2. 打开开发者工具 (F12)
3. 复制新的 Cookie
4. 更新 `backend/f2_config.yaml`

### 3. 服务启动失败

```bash
# 检查端口占用
# Windows: netstat -ano | findstr :5000
# Linux: lsof -i :5000

# 查看详细错误
python main.py --log-level debug
```

### 4. 下载失败

**检查**:
- Cookie 是否有效
- 网络连接是否正常
- 视频链接是否正确
- 查看后端日志

## 📝 环境变量配置（可选）

创建 `backend/.env` 文件：

```bash
# F2配置文件路径（可选）
# F2_CONFIG_PATH=/path/to/custom_config.yaml

# 抖音Cookie（可选，会覆盖配置文件）
# DOUYIN_COOKIE=你的Cookie

# 代理设置（可选）
# HTTP_PROXY=http://127.0.0.1:7890
# HTTPS_PROXY=http://127.0.0.1:7890

# 百度网盘（可选，已在代码中配置）
# BAIDU_APP_KEY=xxx
# BAIDU_SECRET_KEY=xxx
# BAIDU_ACCESS_TOKEN=xxx
```

## 🎉 使用 f2 的优势

现在你的项目使用 f2：

- ✅ **稳定可靠** - f2 是成熟的抖音下载工具
- ✅ **功能完整** - 支持所有抖音视频类型
- ✅ **持续更新** - f2 团队持续维护和更新
- ✅ **配置灵活** - 支持配置文件和参数
- ✅ **Cookie 支持** - 可以下载私密视频
- ✅ **完整日志** - 详细的调试信息

## 📚 更多资源

- **F2 文档**: https://f2.wiki/
- **F2 GitHub**: https://github.com/Johnserf-Seed/f2
- **F2 配置**: https://f2.wiki/guide/what-is-f2
- **API 列表**: https://f2.wiki/guide/apps/douyin/overview

## 🚀 开始使用

```bash
# 1. 安装依赖
cd backend
pip install 'f2[dy]'

# 2. 启动服务
python main.py

# 3. 访问前端
# 在浏览器中打开 frontend/index.html

# 4. 开始下载
# 输入抖音链接，点击下载
```

---

**提示**:
- Cookie 已配置，可以直接使用
- 百度网盘已配置，可以自动上传
- 配置文件路径已指定在代码中
- 所有功能都已集成
