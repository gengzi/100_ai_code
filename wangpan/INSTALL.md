# 安装指南

## 安装步骤

### 1. 创建虚拟环境（推荐）

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 2. 安装依赖

```bash
cd backend
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. 验证安装

```bash
# 测试F2是否安装成功
python -c "from f2.apps.douyin import fetch_one_video; print('F2安装成功')"

# 测试FastAPI是否安装成功
python -c "import fastapi; print('FastAPI安装成功')"
```

## 常见安装问题

### 问题1: 依赖冲突

如果遇到依赖冲突错误：

```bash
# 清理pip缓存
pip cache purge

# 使用 --no-cache-dir 重新安装
pip install --no-cache-dir -r requirements.txt
```

### 问题2: PyExecJS错误

F2依赖PyExecJS，需要Node.js环境：

**Windows:**
1. 下载并安装 Node.js: https://nodejs.org/
2. 重启命令行窗口
3. 重新运行 `pip install -r requirements.txt`

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install nodejs npm
pip install -r requirements.txt
```

**macOS:**
```bash
brew install nodejs
pip install -r requirements.txt
```

### 问题3: 权限错误

```bash
# 使用用户安装模式
pip install --user -r requirements.txt

# 或者使用虚拟环境（推荐）
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 问题4: 网络问题

如果下载速度慢或失败：

**使用国内镜像源:**

```bash
# 清华源
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 阿里云源
pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/
```

**永久配置镜像源:**

```bash
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

## 手动安装F2

如果requirements.txt安装失败，可以尝试手动安装：

```bash
# 1. 先安装FastAPI和相关依赖
pip install fastapi uvicorn[standard] python-multipart

# 2. 安装HTTP客户端
pip install aiohttp requests httpx

# 3. 安装数据验证
pip install pydantic

# 4. 最后安装F2（会自动安装所有依赖）
pip install 'f2[dy]'
```

## 验证F2安装

运行以下命令测试F2是否正常工作：

```python
import asyncio
from f2.apps.douyin import fetch_one_video

async def test():
    try:
        # 测试获取视频信息（使用测试链接）
        url = "https://www.douyin.com/video/7300000000000000"
        result = await fetch_one_video(url)
        print("F2工作正常！")
        return True
    except Exception as e:
        print(f"F2测试失败: {e}")
        return False

asyncio.run(test())
```

## 下一步

安装成功后，继续：

1. 配置环境变量（可选）:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. 启动后端服务:
   ```bash
   cd backend
   python main.py
   ```

3. 访问API文档:
   ```
   http://localhost:5000/docs
   ```

## 获取帮助

如果安装过程中遇到问题：

1. 查看F2官方文档: https://johnserf-seed.github.io/f2/
2. 提交Issue: https://github.com/Johnserf-Seed/f2/issues
3. 查看项目README.md
