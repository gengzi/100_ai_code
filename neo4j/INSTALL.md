# Neo4j 安装和配置指南

## Windows 环境安装

### 方法 1: 使用安装包安装

1. **下载 Neo4j**
   - 访问: https://neo4j.com/download/
   - 下载 Windows 社区版(免费)

2. **安装**
   - 运行安装程序
   - 选择安装目录(默认: `C:\Program Files\Neo4j`)
   - 设置初始密码(默认用户名: neo4j)

3. **启动 Neo4j**
   ```cmd
   cd "C:\Program Files\Neo4j\bin"
   neo4j.bat console
   ```

4. **访问 Neo4j Browser**
   - 打开浏览器访问: http://localhost:7474
   - 使用用户名 `neo4j` 和你设置的密码登录

### 方法 2: 使用 Docker 安装

1. **安装 Docker Desktop**
   - 下载: https://www.docker.com/products/docker-desktop

2. **运行 Neo4j 容器**
   ```cmd
   docker run ^
       --name neo4j ^
       -p 7474:7474 -p 7687:7687 ^
       -e NEO4J_AUTH=neo4j/12345678 ^
       -v %cd%\neo4j-data:/data ^
       neo4j:latest
   ```

3. **管理容器**
   ```cmd
   # 启动
   docker start neo4j

   # 停止
   docker stop neo4j

   # 查看日志
   docker logs neo4j
   ```

### 方法 3: 使用 Chocolatey 安装

1. **安装 Chocolatey**(如果未安装)
   ```cmd
   # 以管理员身份运行 PowerShell
   Set-ExecutionPolicy Bypass -Scope Process -Force
   [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
   iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

2. **安装 Neo4j**
   ```cmd
   choco install neo4j-community
   ```

3. **启动服务**
   ```cmd
   neo4j.bat console
   ```

## Linux 环境安装

### 方法 1: 使用包管理器

**Ubuntu/Debian:**
```bash
# 添加 Neo4j 仓库
wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo apt-key add -
echo 'deb https://debian.neo4j.com stable latest' | sudo tee /etc/apt/sources.list.d/neo4j.list

# 安装
sudo apt-get update
sudo apt-get install neo4j

# 启动
sudo systemctl start neo4j
sudo systemctl enable neo4j
```

**CentOS/RHEL:**
```bash
# 添加仓库
sudo rpm -Uvh https://debian.neo4j.com/neotechnology-fedora-release-latest.stable.noarch.rpm

# 安装
sudo yum install neo4j

# 启动
sudo systemctl start neo4j
sudo systemctl enable neo4j
```

### 方法 2: 使用 Docker

```bash
docker run \
    --name neo4j \
    -p 7474:7474 -p 7687:7687 \
    -e NEO4J_AUTH=neo4j/12345678 \
    -v $(pwd)/neo4j-data:/data \
    -d \
    neo4j:latest
```

### 方法 3: 使用 Homebrew (macOS)

```bash
# 安装
brew install neo4j

# 启动
neo4j start

# 停止
neo4j stop

# 重启
neo4j restart
```

## 配置 Neo4j

### 修改配置文件

找到 `neo4j.conf` 文件:

- **Windows**: `C:\Program Files\Neo4j\conf\neo4j.conf`
- **Linux**: `/var/lib/neo4j/conf/neo4j.conf`
- **macOS**: `/usr/local/var/neo4j/conf/neo4j.conf`

**常用配置项:**

```properties
# 监听地址
dbms.default_listen_address=0.0.0.0

# HTTP 连接(Neo4j Browser)
dbms.connector.http.listen_address=:7474

# Bolt 连接(Java Driver)
dbms.connector.bolt.listen_address=:7687

# 内存配置
dbms.memory.heap.initial_size=512m
dbms.memory.heap.max_size=2G

# 数据目录
dbms.directories.data=data
```

### 修改密码

**方法 1: 通过 Neo4j Browser**
```cypher
:server change-password
```

**方法 2: 通过命令行**
```bash
cypher-shell -u neo4j -p old-password
CALL dbms.security.changePassword('new-password');
```

**方法 3: 重置密码(忘记密码时)**
```bash
# 1. 停止 Neo4j
# 2. 编辑 neo4j.conf,添加:
dbms.security.auth_enabled=false

# 3. 重启 Neo4j
# 4. 通过 Cypher 修改密码
CALL dbms.security.changeUserPassword('neo4j', 'new-password');

# 5. 恢复配置并重启
```

## 验证安装

### 1. 检查服务状态

**Windows:**
```cmd
neo4j.bat status
```

**Linux:**
```bash
sudo systemctl status neo4j
```

**Docker:**
```bash
docker ps | grep neo4j
```

### 2. 测试连接

**使用 cypher-shell:**
```bash
cypher-shell -u neo4j -p 12345678
```

**使用浏览器:**
访问: http://localhost:7474

### 3. 运行测试查询

在 Neo4j Browser 或 cypher-shell 中执行:

```cypher
// 创建测试节点
CREATE (p:Person {name: '测试用户'})
RETURN p;

// 查询节点
MATCH (n:Person) RETURN n;

// 统计节点
MATCH (n) RETURN count(n) as total;
```

## 防火墙配置

### Windows
```cmd
# 添加防火墙规则
netsh advfirewall firewall add rule name="Neo4j HTTP" dir=in action=allow protocol=TCP localport=7474
netsh advfirewall firewall add rule name="Neo4j Bolt" dir=in action=allow protocol=TCP localport=7687
```

### Linux (UFW)
```bash
sudo ufw allow 7474/tcp
sudo ufw allow 7687/tcp
sudo ufw reload
```

### Linux (firewalld)
```bash
sudo firewall-cmd --permanent --add-port=7474/tcp
sudo firewall-cmd --permanent --add-port=7687/tcp
sudo firewall-cmd --reload
```

## 常见问题

### 1. 端口被占用

**检查端口占用:**
```bash
# Windows
netstat -ano | findstr :7687

# Linux/Mac
lsof -i :7687
```

**解决方案:**
- 关闭占用端口的程序
- 或修改 Neo4j 配置使用其他端口

### 2. Java 版本不兼容

Neo4j 5.x 需要 Java 17+

**检查 Java 版本:**
```bash
java -version
```

**安装 Java 17:**
```bash
# Ubuntu/Debian
sudo apt-get install openjdk-17-jdk

# CentOS/RHEL
sudo yum install java-17-openjdk

# macOS
brew install openjdk@17
```

### 3. 内存不足

**修改内存配置:**
```properties
# neo4j.conf
dbms.memory.heap.initial_size=512m
dbms.memory.heap.max_size=1G
dbms.memory.pagecache.size=512m
```

### 4. 权限问题

**Linux:**
```bash
sudo chown -R neo4j:neo4j /var/lib/neo4j
sudo chmod -R 755 /var/lib/neo4j
```

## 卸载 Neo4j

### Windows
```cmd
# 使用控制面板卸载
# 或手动删除
rmdir /s "C:\Program Files\Neo4j"
rmdir /s "%APPDATA%\Neo4j Desktop"
```

### Linux
```bash
# 停止服务
sudo systemctl stop neo4j

# 卸载
sudo apt-get remove neo4j*
# 或
sudo yum remove neo4j*

# 删除数据
sudo rm -rf /var/lib/neo4j
```

### Docker
```bash
# 停止并删除容器
docker stop neo4j
docker rm neo4j

# 删除数据卷
docker volume rm neo4j-data
```

## 下一步

安装完成后,请返回主 README 文档继续配置和运行项目。

## 参考资源

- [Neo4j 官方文档](https://neo4j.com/docs/)
- [Neo4j 操作手册](https://neo4j.com/docs/operations-manual/current/)
- [Cypher 查询语言](https://neo4j.com/docs/cypher-manual/current/)
