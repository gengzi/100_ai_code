# 日志配置说明

## ✅ 日志配置已更新

现在项目会正确输出 INFO 级别的日志到控制台。

## 🔧 日志配置位置

### 1. douyin_service.py

```python
# 配置f2日志输出到控制台，并设置为INFO级别
from f2.log.logger import logger, log_setup

logger = log_setup(log_to_console=True)
logger.setLevel("INFO")  # 设置为 INFO 级别
```

**日志级别说明**:
- `DEBUG` - 最详细的日志，包含所有调试信息
- `INFO` - 一般信息，包括正常操作流程（当前设置）
- `WARNING` - 警告信息
- `ERROR` - 错误信息
- `CRITICAL` - 严重错误

### 2. main.py

```python
import logging

# 配置应用日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)
```

## 📋 日志输出示例

启动服务后会看到：

```
2025-01-10 14:30:00 - __main__ - INFO - 初始化抖音视频服务，配置文件: D:\...\f2_config.yaml
2025-01-10 14:30:00 - f2 - INFO - 使用f2配置文件: D:\...\f2_config.yaml
2025-01-10 14:30:00 - __main__ - INFO - 所有服务初始化完成
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:5000
```

下载视频时会看到：

```
2025-01-10 14:31:00 - f2 - INFO - 开始下载视频: https://www.douyin.com/video/...
2025-01-10 14:31:01 - f2 - INFO - 视频下载完成: downloads/视频标题.mp4
2025-01-10 14:31:01 - f2 - INFO - 封面下载完成: downloads/7300000000000000_cover.jpg
```

## 🎯 如何修改日志级别

### 方法1: 修改代码（推荐用于开发）

编辑 `backend/services/douyin_service.py`:

```python
# 改为 DEBUG 级别（更详细的日志）
logger.setLevel("DEBUG")

# 或改为 WARNING 级别（只显示警告和错误）
logger.setLevel("WARNING")
```

### 方法2: 使用环境变量（推荐用于生产）

在启动时设置：

```bash
# Windows
set LOG_LEVEL=DEBUG
python main.py

# Linux/Mac
export LOG_LEVEL=DEBUG
python main.py
```

然后在代码中读取：

```python
import os
log_level = os.getenv("LOG_LEVEL", "INFO")
logger.setLevel(log_level)
```

### 方法3: 使用 uvicorn 参数

```bash
# 启动时指定日志级别
uvicorn main:app --log-level info

# 或使用 debug 级别
uvicorn main:app --log-level debug
```

## 🔍 调试时使用 DEBUG 级别

如果遇到问题，可以临时启用 DEBUG 级别查看详细信息：

```python
# 在 douyin_service.py 中
logger.setLevel("DEBUG")
```

DEBUG 级别会显示：
- HTTP 请求详情
- 响应内容
- 数据解析过程
- Cookie 使用情况
- 等等...

## 📝 日志格式

当前日志格式：
```
%(asctime)s - %(name)s - %(levelname)s - %(message)s
```

示例输出：
```
2025-01-10 14:30:00,123 - f2 - INFO - 开始下载视频
```

各部分含义：
- `%(asctime)s` - 时间戳（2025-01-10 14:30:00,123）
- `%(name)s` - 日志记录器名称（f2, __main__, uvicorn 等）
- `%(levelname)s` - 日志级别（INFO, WARNING, ERROR 等）
- `%(message)s` - 日志消息

## 🎨 自定义日志格式

如果需要不同的日志格式，可以修改：

```python
# 更简单的格式
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s',
    handlers=[logging.StreamHandler()]
)

# 输出示例：
# INFO: 开始下载视频

# 更详细的格式
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)-8s [%(name)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[logging.StreamHandler()]
)

# 输出示例：
# [2025-01-10 14:30:00] INFO     [f2] 开始下载视频
```

## 💡 最佳实践

### 开发环境
```python
logger.setLevel("DEBUG")  # 查看详细日志
```

### 生产环境
```python
logger.setLevel("INFO")  # 只看重要信息
```

### 调试特定问题
```python
# 临时修改为 DEBUG
logger.setLevel("DEBUG")
# 复现问题后改回 INFO
logger.setLevel("INFO")
```

## 🔧 常见问题

### 1. 日志没有输出

**检查**:
- 确认 `log_setup(log_to_console=True)` 已调用
- 确认日志级别设置正确
- 确认代码执行到了 logger.info() 那一行

### 2. 日志太多

**解决**:
- 提高日志级别到 WARNING 或 ERROR
- 或者只看特定模块的日志

### 3. f2 的日志太详细

**解决**:
```python
# 设置 f2 的日志级别为 WARNING
logging.getLogger("f2").setLevel("WARNING")
```

## ✅ 当前配置总结

- ✅ 使用 `log_setup(log_to_console=True)` 输出到控制台
- ✅ 设置日志级别为 INFO
- ✅ 使用标准的日志格式
- ✅ 所有模块都会输出日志
- ✅ 可以随时修改日志级别

## 📖 相关文档

- [Python logging 文档](https://docs.python.org/3/library/logging.html)
- [f2 日志配置](https://f2.wiki/guide/what-is-f2)
- [Uvicorn 日志配置](https://www.uvicorn.org/settings/#logging)

---

**注意**:
- DEBUG 级别会产生大量日志，只在调试时使用
- 生产环境建议使用 INFO 或 WARNING 级别
- 敏感信息（如 Cookie）不会记录到日志中
