# SFTP→S3 异步与资源控制方案

## 目标
- 端到端非阻塞：SFTP 侧用 MINA SSHD（NIO），S3 侧用 AWS SDK v2 `S3AsyncClient`（Netty），避免每个传输占用线程。
- 控制资源上限：通过“分片大小 + 每文件 in-flight + 全局 in-flight”硬性封顶内存与请求量。
- 吞吐 vs 请求数平衡：大分片降低 S3 QPS，小分片提升弱网吞吐；参数可配。

## 交互流程
- 下载（read）：`GetObject` → `AsyncResponseTransformer.toPublisher()` → 小型有界队列（如 4×64K）→ SFTP 输出；背压按需 `request(1)`，偏移不连续则新开 Range GET。每个会话独立 S3 流。
- 上传（write）：SFTP 32K 块落本地临时文件（`FileChannel`），内存仅保留小写缓冲；收到 `close` 后上传。小文件（<64MB）用单次 PutObject；大文件按 8–32MB 分片做 MPU，分片异步并行；完成后删除临时文件。
- 重命名/移动：异步 `CopyObject`/MPU copy + 删除源；目录移动按前缀分页。
- 删除：`DeleteObject`，批量用 `DeleteObjects` 分批（≤1000/批）。
- 列目录：`ListObjectsV2`（delimiter="/"）异步分页；短时缓存目录元数据。

## 背压与限流
- 每文件 in-flight 分片：默认 2（可配）。
- 全局 in-flight 分片：默认 64（可配）；超出时暂停 SFTP 窗口，待完成后恢复。
- 分片大小：默认 16MB；<8MB 直接 Put；可调 8–32MB。
- 下载缓冲：每文件 1MB 有界缓冲，结合 SFTP 窗口。
- 带宽/请求速率：按用户/全局令牌桶；限制 in-flight、QPS、粗粒度带宽。
- 临时目录配额：限制总占用/每用户占用，超限阻塞或拒绝新上传句柄。

## 临时文件与 TTL 清理
- 活跃标记：用 `lastModified` 或状态表记录“最后写入时间”；open 句柄保持活跃。
- 清理判定：周期扫描；若 `now - lastModified > ttl` 且无打开句柄/无排队上传，则删除并记审计。
- 防误删：检测锁或上传中则跳过。
- 断点续传：如启用，可在 TTL 内保留，超时清理。
- 审计：记录路径/大小/最后时间/原因=ttl。

## 内存估算（示例）
- 上传缓冲：16MB 分片 × 单文件 2 × 全局 64 ≈ 1GB。
- 下载缓冲：64 活跃下载 × 1MB ≈ 64MB。
- 其他开销数百 MB，总体约 1.5–2GB；若 8MB 分片则 ~512MB 上传缓冲但 QPS 上升。

## 一致性与安全
- 可选临时前缀 `.uploading/`，完成后 copy/删除，确保“可见即完整”。
- eventual consistency：List/Head 轻量重试；上传后校验 ETag/Content-MD5。
- SSE：支持 SSE-S3/SSE-KMS/SSE-C；AK/SK 加密存储，最小权限。

## 可观测
- 指标：S3 调用次数/延迟/错误码；in-flight 分片数、队列长度、带宽、会话并发、内存。
- 审计：动作、路径、bucket/key、字节数、耗时、结果/错误。

## 落地顺序
1) S3AsyncClient 工厂 + 存储配置；实现异步 list/get/put（小文件）。
2) 自定义读写 channel 对接 MINA FileSystemView，支持 Range 下载、顺序上传。
3) Async MPU（分片聚合/并行/完成），断点续传状态存储。
4) 异步 rename/move（copy+delete 分页），批量删除。
5) 限流/背压，分片大小与 in-flight 配置化，指标与告警。
