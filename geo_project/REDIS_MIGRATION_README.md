# Redis 数据库迁移指南

## 概述

项目已成功从 H2 数据库迁移到 Redis 数据存储。本次迁移移除了 JPA 依赖，使用 Spring Data Redis 进行数据持久化。

## 主要变更

### 1. 依赖更新 (pom.xml)
- ✅ 移除 `spring-boot-starter-data-jpa` 依赖
- ✅ 移除 `h2` 数据库依赖
- ✅ 添加 `spring-boot-starter-data-redis` 依赖
- ✅ 添加 `jackson-datatype-jsr310` 支持 Java 8 时间类型

### 2. 配置更新 (application.yml)
- ✅ 移除 H2 数据库配置
- ✅ 移除 JPA/Hibernate 配置
- ✅ 添加 Redis 连接配置
- ✅ 添加 Redis 连接池配置
- ✅ 添加 Redis 缓存配置

### 3. 实体类更新
- ✅ `Content.java`: 移除 JPA 注解 (`@Entity`, `@Table`, `@Column`, `@Id` 等)
- ✅ `OptimizationRecord.java`: 移除 JPA 注解，保留纯 POJO 结构

### 4. Repository 层重写
- ✅ `ContentRepository.java`: 使用 Redis Template 替代 JPA Repository
- ✅ `OptimizationRecordRepository.java`: 使用 Redis Template 替代 JPA Repository
- ✅ 实现了索引机制，支持高效的搜索和查询

### 5. 新增配置类
- ✅ `RedisConfig.java`: 配置 Redis Template 序列化方式
- ✅ 为不同类型配置专用的 RedisTemplate

## Redis 数据结构设计

### 优化记录 (OptimizationRecord)
- 主键: `optimization:record:{optimizationId}`
- 全局索引: `optimization:records:all`
- 标题索引: `optimization:index:title:{word}`
- 查询索引: `optimization:index:query:{word}`

### 内容记录 (Content)
- 主键: `content:record:{id}`
- 全局索引: `content:records:all`
- 状态索引: `content:index:status:{status}`
- 平台索引: `content:index:platform:{platform}`
- 优化ID索引: `content:index:optimization:{optimizationId}`
- 标题索引: `content:index:title:{word}`

## 环境要求

### Redis 服务器
- **本地开发**: Redis 服务器运行在 `localhost:6379`
- **生产环境**: 可通过环境变量或配置文件修改连接信息

### 安装 Redis
```bash
# Windows (使用 WSL 或 Docker)
docker run -d -p 6379:6379 --name redis redis:alpine

# Linux/macOS
sudo apt-get install redis-server  # Ubuntu/Debian
brew install redis                  # macOS
```

## 启动步骤

1. **确保 Redis 服务运行**
```bash
# Windows (使用 Docker)
docker run -d -p 6379:6379 --name redis redis:alpine

# 检查 Redis 是否运行
docker exec redis redis-cli ping
# 或
redis-cli ping
# 应该返回: PONG
```

2. **启动应用**
```bash
# 快速测试编译
./test-redis-connection.sh  # Linux/macOS
# 或手动执行
mvn compile

# 启动应用
mvn spring-boot:run
```

3. **验证应用启动**
```bash
# 检查健康状态
curl http://localhost:8095/api/geo/health
# 应返回: {"status":"healthy",...}
```

## 功能特性

### 保持的功能
- ✅ GEO 内容优化
- ✅ 优化记录保存和查询
- ✅ 按标题搜索
- ✅ 按目标查询搜索
- ✅ 批量发布
- ✅ 状态管理

### 新增功能
- ✅ 更快的数据访问速度
- ✅ 自动数据过期 (30天)
- ✅ 内存存储，无需磁盘空间
- ✅ 支持集群扩展

### 注意事项
- ⚠️ 数据不再持久化到磁盘，Redis 重启会丢失数据
- ⚠️ 需要确保 Redis 服务器有足够的内存
- ⚠️ 备份策略需要调整

## 性能优势

1. **读写性能**: Redis 内存存储，比磁盘数据库快数倍
2. **并发性能**: Redis 单线程模型，避免锁竞争
3. **扩展性**: 支持主从复制和集群模式
4. **数据过期**: 自动清理过期数据，无需手动维护

## 监控和维护

### Redis 监控命令
```bash
# 监控 Redis 状态
redis-cli info

# 查看内存使用
redis-cli info memory

# 查看连接数
redis-cli info clients

# 实时监控
redis-cli monitor
```

### 建议的监控指标
- 内存使用率
- 连接数
- 命令执行时间
- 键过期情况

## 故障排查

### 常见问题
1. **连接失败**: 检查 Redis 服务是否启动
2. **内存不足**: 调整 Redis maxmemory 配置
3. **序列化错误**: 确认 Jackson 配置正确

### 错误排查步骤
1. 检查应用日志中的 Redis 连接错误
2. 验证 Redis 服务器状态: `redis-cli ping`
3. 检查网络连接和端口配置
4. 查看 Redis 日志

## 回滚方案

如需回滚到 H2 数据库，按以下步骤操作：

1. 恢复 pom.xml 中的 JPA 和 H2 依赖
2. 恢复 application.yml 中的数据库配置
3. 恢复实体类中的 JPA 注解
4. 恢复 Repository 接口为 JPA Repository
5. 删除 RedisConfig.java 配置类

## 后续优化建议

1. **数据备份**: 定期备份 Redis 数据
2. **监控告警**: 设置 Redis 监控和告警
3. **集群部署**: 生产环境考虑 Redis 集群
4. **内存优化**: 优化数据结构，减少内存使用
5. **持久化**: 根据需要配置 Redis AOF/RDB 持久化