# DESIGN（设计说明）

## 核心目标

1. **唯一性**：同一生成器实例不重复；分布式依赖 workerId 唯一
2. **性能**：单实例高吞吐、低分配（无对象创建热路径）
3. **安全性/可运维**：时钟回拨可检测与可配置处理策略
4. **可观测性**：ID 可解析，便于排查“这条数据来自哪台机器、何时生成”

## Snowflake 位段

ID 的二进制布局从高位到低位：

`timestamp | datacenterId | workerId | sequence`

默认总 bit 数为 63（避免产生负数）：

- `timestampBits = 41`：可表示约 69 年（毫秒）
- `datacenterIdBits = 5`：32 个机房/可用区
- `workerIdBits = 5`：每机房 32 个节点（或按你需要重新分配 bit）
- `sequenceBits = 12`：每节点每毫秒 4096 个序列

你可以在 `SnowflakeOptions` 里调整 bit 分配，但需满足：

- `timestampBits + datacenterIdBits + workerIdBits + sequenceBits == 63`
- `datacenterId`、`workerId` 的取值在各自 bit 的范围内

## 时钟回拨处理

当 `nowMillis < lastTimestampMillis`：

- `delta <= maxBackwardMs`：进入自旋等待，直到 `now >= lastTimestamp`
- `delta > maxBackwardMs`：直接失败（抛异常），让业务侧降级/报警/熔断

原因：回拨幅度较大时继续生成 ID 可能导致重复或乱序，隐患更大。

## 线程安全

生成器内部维护 `lastTimestamp` 和 `sequence`，它们必须以原子方式更新。  
实现采用 `synchronized`（极短临界区、无对象分配、可读性强，吞吐足够高）。

如果你的单 JVM 需要更极致吞吐，可以考虑：

- 单线程批量发号 + ring buffer
- 多段号段（segment）策略
- 多 workerId 并行（拆分业务维度）

## WorkerId 分配

本工程内置：

- 静态分配：完全由外部系统保证唯一（推荐生产）
- 机器信息哈希：尽量分散，但不保证完全无碰撞（兜底）

在真正“工业级”的大规模集群中，通常会结合：

- 注册中心（ZK/Etcd）租约 + 心跳
- K8s StatefulSet ordinal 或 node label 规则

