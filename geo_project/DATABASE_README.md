# GEO Platform 数据库管理

## 概述

GEO Platform 使用 H2 文件数据库，数据持久化存储在 `./data/geodb.mv.db` 文件中。

## 数据库特性

- **轻量级**：H2 是一个轻量级的关系型数据库，无需单独安装
- **文件存储**：数据存储在本地文件中，重启后数据不会丢失
- **ACID 兼容**：支持事务处理，保证数据一致性
- **内存缓存**：提供良好的性能表现
- **Web 控制台**：提供基于 Web 的数据库管理界面

## 数据库文件位置

```
geo_project/
├── data/
│   └── geodb.mv.db          # 主数据库文件
│   └── geodb.trace.db       # 日志文件（运行时生成）
└── backups/                 # 数据库备份目录
```

## Web 控制台访问

访问 H2 数据库 Web 控制台：
- **URL**: http://localhost:8095/h2-console
- **JDBC URL**: `jdbc:h2:file:./data/geodb`
- **用户名**: `sa`
- **密码**: （留空）

## 数据库表结构

### 1. optimization_records
存储优化记录信息
- `id`: 主键
- `optimization_id`: 优化ID（唯一标识）
- `title`: 标题
- `raw_content`: 原始内容
- `target_query`: 目标查询
- `optimized_content`: 优化后内容
- `created_at`: 创建时间

### 2. geo_content
存储内容发布信息
- `id`: 主键
- `raw_content`: 原始内容
- `target_query`: 目标查询
- `optimized_content`: 优化内容
- `title`: 标题
- `optimization_id`: 优化ID
- `platform_type`: 平台类型
- `published_url`: 发布URL
- `created_at`: 创建时间
- `published_at`: 发布时间
- `status`: 状态（CREATED, OPTIMIZED, PUBLISHED, FAILED）
- `error_message`: 错误信息

## 管理工具

### 1. 备份数据库
```bash
# Windows
database-backup.bat

# 功能：
# - 自动创建备份
# - 按时间戳命名备份文件
# - 保存到 backups/ 目录
```

### 2. 恢复数据库
```bash
# Windows
database-restore.bat

# 功能：
# - 列出可用备份
# - 选择备份文件进行恢复
# - 自动备份当前数据
```

### 3. 清理数据库
```bash
# Windows
database-clean.bat

# 功能：
# - 备份当前数据
# - 删除所有数据库文件
# - 重置为空数据库
```

## 维护建议

### 定期备份
- 建议每周至少备份一次数据库
- 在进行重大更改前手动备份
- 保留多个历史备份文件

### 数据监控
- 定期检查数据库文件大小
- 清理过期或不需要的记录
- 监控数据库性能

### 故障排除
1. **数据库连接失败**
   - 检查 `data/` 目录权限
   - 确认没有其他进程占用数据库文件

2. **数据丢失**
   - 检查最近的备份文件
   - 使用 `database-restore.bat` 恢复数据

3. **性能问题**
   - 检查数据库文件大小
   - 考虑清理旧记录
   - 使用 Web 控制台分析查询性能

## 配置参数

数据库配置在 `src/main/resources/application.yml` 中：

```yaml
spring:
  datasource:
    url: jdbc:h2:file:./data/geodb;DB_CLOSE_ON_EXIT=FALSE;AUTO_RECONNECT=TRUE
    username: sa
    password:
  jpa:
    hibernate:
      ddl-auto: update  # 自动更新表结构
    show-sql: true     # 显示SQL语句
```

### 重要配置说明
- `DB_CLOSE_ON_EXIT=FALSE`: 应用退出时不关闭数据库
- `AUTO_RECONNECT=TRUE`: 自动重连
- `ddl-auto=update`: 自动更新表结构（生产环境建议改为 `validate`）

## 数据迁移

如果需要从内存数据库迁移到文件数据库：

1. 停止应用程序
2. 备份当前数据（如果有重要数据）
3. 更新配置文件（已完成）
4. 启动应用程序（自动创建文件数据库）

## 安全注意事项

- 定期备份数据库文件
- 不要将数据库文件上传到公共代码仓库
- 生产环境建议设置数据库密码
- 限制 H2 控制台的访问权限

## 故障恢复步骤

1. **停止应用程序**
2. **识别问题原因**
3. **从备份恢复**（如果需要）
4. **重新启动应用程序**
5. **验证数据完整性**

## 性能优化

- 定期清理过期数据
- 考虑为常用查询添加索引
- 监控数据库连接池使用情况
- 优化长查询和大数据量操作