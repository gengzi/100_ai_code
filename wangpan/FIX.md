# 抖音视频下载方案说明

## 问题说明

F2库的API结构比较复杂，直接集成存在兼容性问题。因此我们采用了更简单可靠的方案。

## 当前实现方案

### 1. 自定义抖音视频服务

已实现 `backend/services/douyin_service.py`，提供以下功能：

#### 视频信息获取方法（按优先级）：

1. **TikHub API**（推荐，最稳定）
   - 需要注册TikHub账号获取API Key
   - 提供免费额度
   - 稳定可靠，支持所有抖音视频
   - 注册地址: https://beta-web.tikhub.io/users/signup?referral_code=6hLcGD94

2. **HTML解析**（免费，有限制）
   - 解析抖音网页HTML提取视频数据
   - 适用于公开视频
   - 可能受反爬限制

3. **模拟数据**（测试模式）
   - 当以上方法都失败时使用
   - 用于测试系统功能

### 2. 配置方式

#### 方法1: 使用TikHub API（推荐）

```bash
# 1. 注册TikHub账号获取API Key
# 访问: https://beta-web.tikhub.io/users/signup?referral_code=6hLcGD94

# 2. 配置API Key
cd backend
cp .env.example .env

# 编辑.env文件
# TIKHUB_API_KEY=your_api_key_here

# 3. 启动服务
python main.py
```

#### 方法2: 不配置API（HTML解析模式）

直接运行，系统会尝试通过解析HTML获取视频信息：
- ✅ 免费使用
- ⚠️ 可能受限制
- ⚠️ 仅适用于公开视频

### 3. 支持的功能

- ✅ 解析短链接
- ✅ 提取视频ID
- ✅ 获取视频信息（标题、作者、封面等）
- ✅ 下载视频文件
- ✅ 下载封面
- ✅ 保存文案
- ✅ 下载音频
- ✅ 批量下载

## 快速开始

### 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 配置（可选）

```bash
# 复制环境变量文件
cp .env.example .env

# 编辑配置（推荐配置TikHub API）
# nano .env 或 vim .env
```

### 启动服务

```bash
# 方式1: 直接运行
python main.py

# 方式2: 使用启动脚本
# Windows: start.bat
# Linux/Mac: ./start.sh
```

### 使用API

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

# 查询任务进度
curl http://localhost:5000/api/progress/{task_id}

# 查看所有任务
curl http://localhost:5000/api/tasks
```

## TikHub API 优势

### 为什么推荐TikHub？

1. **稳定性**: 专业API服务，稳定性高
2. **免费额度**: 每日签到可获取免费额度
3. **完整功能**: 支持所有抖音视频类型
4. **持续更新**: 跟随抖音更新维护API
5. **简单易用**: RESTful API，易于集成

### TikHub注册

1. 访问注册页面: https://beta-web.tikhub.io/users/signup?referral_code=6hLcGD94
2. 注册并登录
3. 进入控制台获取API Key
4. 在`.env`文件中配置`TIKHUB_API_KEY`

### 免费额度

- 每日签到可获取免费额度
- 新用户注册奖励
- 推荐好友获得奖励

## 常见问题

### 1. 不配置TikHub可以使用吗？

可以使用，但只能通过HTML解析获取视频，可能会遇到：
- 视频信息获取失败
- 下载链接403错误
- 反爬限制

### 2. TikHub收费吗？

- 每日签到免费获取额度
- 新用户有注册奖励
- 额度用完后可以购买
- 免费额度足够个人使用

### 3. 下载视频失败怎么办？

1. 检查网络连接
2. 确认抖音链接格式正确
3. 配置TikHub API提高成功率
4. 查看后端日志获取详细错误信息

### 4. 如何获取更多帮助？

- TikHub文档: https://docs.tikhub.io/
- TikHub Discord: https://discord.gg/5hYb7kZ7
- 项目Issues: 提交问题到GitHub

## 下一步

1. 安装依赖: `pip install -r requirements.txt`
2. 配置TikHub API（推荐）: 编辑`.env`文件
3. 启动服务: `python main.py`
4. 访问API文档: `http://localhost:5000/docs`
5. 测试下载功能

## 技术说明

当前实现：
- ✅ 不依赖复杂的第三方库
- ✅ 简单可靠的HTTP请求
- ✅ 支持多种视频信息获取方式
- ✅ 易于维护和扩展
- ✅ 完整的错误处理

未来可能：
- 添加更多视频源支持
- 实现格式转换功能
- 添加更多下载选项
- 优化下载速度
