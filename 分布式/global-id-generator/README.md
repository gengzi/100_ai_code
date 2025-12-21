# 分布式全局 ID 生成器（工业级 Snowflake 实现）

这是一个可直接落地到生产的「分布式全局 ID 生成器」示例工程（Java / Maven），提供：

- 64-bit `long` 全局唯一 ID（单机高吞吐、线程安全）
- Snowflake 位段可配置（epoch、bit 分配、容错策略）
- 时钟回拨检测与处理（小回拨等待，大回拨快速失败）
- 可插拔的 `WorkerIdAssigner`（静态配置 / 基于机器信息的兜底方案）
- ID 解析（从 ID 反解时间戳、机房、节点、序列号）

## 1. 适用场景

- 订单号、交易流水号、日志 traceId（`long`）
- 多机房/多实例水平扩容，需要不依赖中心化 DB 自增
- 强一致唯一性：单机保证不重复；分布式依赖 **workerId 不冲突**

## 2. 设计概览（默认位段）

默认采用常见 Snowflake 结构（总计 63 bit，有符号 `long` 的最高位保持 0）：

- `timestampBits = 41`：毫秒级时间差（相对 `epochMillis`）
- `datacenterIdBits = 5`：机房/可用区（0~31）
- `workerIdBits = 5`：节点/进程（0~31）
- `sequenceBits = 12`：同一毫秒内序列（0~4095）

吞吐：单节点理论上 `4096 * 1000 = 4,096,000` IDs/s（受锁/CPU影响）。

## 3. 快速开始

### 3.1 构建与测试

```bash
mvn -q test
```

### 3.2 运行示例

```bash
mvn -q -DskipTests package
java -cp target/global-id-generator-1.0.0.jar com.example.id.ExampleMain
```

## 4. 生产落地建议（非常重要）

### 4.1 workerId 分配策略（必须保证不冲突）

工程提供了三种思路：

1) `StaticWorkerIdAssigner`：最推荐（最可控）
- 通过配置中心/启动参数/环境变量下发 `datacenterId` 与 `workerId`
- 优点：可控、可审计、不会因硬件信息变化导致漂移

2) `MachineBasedWorkerIdAssigner`：兜底方案
- 通过 MAC/主机名/进程信息哈希出 ID（尽量分散）
- 适合：开发/测试环境或无分配系统时临时使用
- 风险：不同机器可能哈希碰撞；机器网卡变化会导致 workerId 变化

3) 企业级常见做法（建议你接入，但本工程不强绑定依赖）
- Zookeeper/Etcd/Redis/DB：启动时申请一个 workerId，带租约/心跳，退出释放
- K8s：通过 StatefulSet ordinal/NodeName + 规则映射

### 4.2 时钟回拨处理

默认策略：
- 若检测到 `now < lastTimestamp` 且回拨幅度 `<= maxBackwardMs`：等待到追平
- 否则抛出 `ClockMovedBackwardsException`

建议：
- 生产环境开启 NTP，但避免同时对大量机器进行强制回拨
- 尽量使用 `chrony` 之类的平滑校时

## 5. 代码入口

- 生成器：`com.example.id.SnowflakeIdGenerator`
- 配置：`com.example.id.SnowflakeOptions`
- workerId：`com.example.id.WorkerIdAssigner`
- 解析：`com.example.id.IdCodec`

## 6. FAQ

### Q1：ID 是否严格递增？

单实例内：大多数情况下递增（同毫秒内按 sequence 递增）。  
多实例：全局不保证严格递增，但整体随时间增长。

### Q2：能不能生成字符串 ID？

支持：`nextIdAsBase62()` 生成更短的 Base62 字符串（便于 URL/日志）。

