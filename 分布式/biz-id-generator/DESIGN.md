# DESIGN（业务 ID + 号段模式）

## 为什么不用 Snowflake？

Snowflake 适合“纯唯一 long”，但业务单号往往还要：

- 带业务前缀（ORD/REF/INV）
- 带日期（便于对账/查数）
- 期望同日内递增（更符合业务认知）

因此采用：**号段模式**（DB 分配范围，服务内存发号）。

## 号段分配（Segment）

每次从 DB 申请一个区间：

- DB 当前记录：`max_id = M`
- 申请步长：`step = S`
- 分配给服务：`(M+1) ... (M+S)`
- DB 更新为：`max_id = M + S`

并发安全通过 `version` 乐观锁实现。

## 每日重置

将日期编码进 `biz_tag`：

`biz_tag = bizCode + ":" + yyyyMMdd`

则每天都是一条新记录（从 `max_id=0` 开始），天然“重置”。

## 性能与可用性

服务端缓存 `SegmentBuffer`（双号段）：

- 当前号段快耗尽时预取下一段
- 当前耗尽后无缝切换

DB 压力大幅降低，吞吐主要受服务端 CPU/锁影响。

