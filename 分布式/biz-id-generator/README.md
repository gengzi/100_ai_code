# 分布式业务全局 ID（订单号/流水号）生成器

该工程提供一种更贴近“业务单号/流水号”的分布式全局 ID 方案：**前缀 + 日期 + 可选维度 + 号段序列**。  
底层采用「号段（Segment）缓存」模式（类似美团 Leaf 的 segment 思路）：中心库只负责分配号段，业务服务在内存里高速发号。

## 1. 适用场景

- 订单号、退款单号、对账流水号、出入库单号等 **可读、可按日期分组** 的业务 ID
- 需要 **每日从 1 递增**（或按自然日重置）且分布式发号
- 要求高吞吐、低延迟，同时避免 DB 每次发号都 `UPDATE`

## 2. 方案特点

- **强唯一**：同一 `bizTag`（通常=业务类型+日期）由数据库号段保证不重叠
- **高性能**：服务端一次从 DB 申请 `step` 个号段，内存内自增发放
- **可扩展**：多业务类型、多日期并行；可配置步长 `step` 和格式
- **可运维**：DB 只承担“偶尔更新”，对 DB 压力远小于逐条发号

## 3. ID 格式（默认）

默认生成形如：

`{prefix}{yyyyMMdd}{sequence}`

例如：`ORD202512170000001234`

你可以扩展增加维度（如 `region`、`channel`、`shard`），但建议维度只参与 **前缀拼接**，序列仍由号段分配保证唯一。

## 4. 数据库表（MySQL 示例）

```sql
CREATE TABLE biz_id_alloc (
  biz_tag      VARCHAR(128) NOT NULL PRIMARY KEY,
  max_id       BIGINT       NOT NULL,
  step         INT          NOT NULL,
  version      BIGINT       NOT NULL,
  update_time  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

- `biz_tag`：建议包含日期，如 `ORD:20251217`
- `max_id`：已分配的最大值（上界）
- `step`：每次申请号段长度（比如 1000、5000、10000）
- `version`：乐观锁（避免并发更新互相覆盖）

## 5. 快速开始

### 5.1 构建与测试（内置 Maven Wrapper）

```bash
cd biz-id-generator
.\mvnw.cmd -q test
```

### 5.2 示例运行

```bash
cd biz-id-generator
.\mvnw.cmd -q -DskipTests package
java -jar target/biz-id-generator-1.0.0.jar
```

## 6. 生产落地建议

- `step` 选取：一般从 `1000` 起，根据 QPS 调整。`step` 越大，DB 压力越小，但服务重启会浪费一点号段尾部。
- `biz_tag` 强烈建议包含日期：`{bizCode}:{yyyyMMdd}`，这样天然“按天重置”。
- 表膨胀：如果按天生成 `biz_tag`，行数会增长。建议定期清理历史（只要不再需要继续发号即可）。
- 高可用：中心库需要 HA（主从/集群）。服务端可做降级：DB 不可用时返回错误或切换 Snowflake（如你需要我可以加）。

## 7. 代码入口

- 业务 ID：`com.example.bizid.BizIdService`
- 号段发号器：`com.example.bizid.segment.SegmentIdGenerator`
- DB 号段分配（JDBC）：`com.example.bizid.repo.JdbcIdAllocRepository`

