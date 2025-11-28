# 使用官方Node.js镜像
FROM node:18-alpine

# 使用国内镜像源
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 安装Canvas依赖库
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    build-base \
    python3 \
    make \
    g++

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 设置npm国内镜像源
RUN npm config set registry https://registry.npmmirror.com

# 安装依赖（生产依赖）
RUN npm install --only=production && npm cache clean --force

# 复制源代码
COPY src/ ./src/
COPY examples/ ./examples/

# 创建字体目录并复制字体文件（如果有）
RUN mkdir -p /app/fonts

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 创建日志目录并设置权限
RUN mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 启动应用
CMD ["node", "src/server.js"]