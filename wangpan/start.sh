#!/bin/bash
# 抖音视频下载器启动脚本 (Linux/Mac)

echo "===================================="
echo "抖音视频下载器 - 启动脚本"
echo "===================================="
echo ""

# 检查Python是否安装
if ! command -v python3 &> /dev/null; then
    echo "[错误] 未找到Python3，请先安装Python 3.8+"
    exit 1
fi

echo "[1/3] 检查后端依赖..."
cd backend

if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

echo "激活虚拟环境..."
source venv/bin/activate

echo "安装依赖..."
pip install -r requirements.txt -q

echo ""
echo "[2/3] 启动后端服务..."
echo "后端服务将在 http://localhost:5000 启动"
echo ""

# 在后台启动后端服务
python main.py &
BACKEND_PID=$!

# 等待后端启动
sleep 3

cd ..

echo ""
echo "[3/3] 打开前端界面..."
echo "请在浏览器中打开: frontend/index.html"
echo ""

# 尝试打开默认浏览器
if command -v xdg-open &> /dev/null; then
    xdg-open frontend/index.html
elif command -v open &> /dev/null; then
    open frontend/index.html
else
    echo "请手动在浏览器中打开 frontend/index.html"
fi

echo ""
echo "===================================="
echo "启动完成！"
echo "后端API: http://localhost:5000"
echo "API文档: http://localhost:5000/docs"
echo "后端进程PID: $BACKEND_PID"
echo "===================================="
echo ""
echo "按Ctrl+C停止后端服务"

# 等待用户中断
wait $BACKEND_PID
