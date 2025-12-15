# SFTP to S3 技术方案

## 1. 目标
- 提供 SFTP 服务端，后端直连各类 S3 兼容对象存储，支持上传、下载、列目录、移动/重命名、删除等标准 SFTP 操作。
- 提供 Web 管理控制台，支持用户与凭据管理、存储连接配置、会话/传输监控、审计查询导出。
- 易部署（Jar/容器），横向可扩展，具备安全、可观测与审计能力。

## 2. 后端技术选型
- 语言：Java 17
- 框架：Spring Boot 3（MVC + Data JPA + Security）
- SFTP 协议：Apache MINA SSHD（嵌入式 SFTP 服务器，可自定义文件系统适配 S3）
- 对象存储：AWS SDK for Java v2（Endpoint Override 兼容 AWS S3/阿里 OSS/MinIO/Ceph RGW/Wasabi 等）
- 数据库：PostgreSQL/MySQL（生产），H2（开发/PoC）
- 身份认证：
  - SFTP：密码 + 公钥双模式，凭据/指纹存库
  - Web/API：Spring Security + JWT，RBAC（admin/operator/auditor）
- 配置：Spring Config + 环境变量；敏感信息加密存储或对接 KMS
- 日志：Logback(JSON)；审计落库 + 可选对象存储归档；Webhook 推送到 SIEM/告警
- 监控：Micrometer + Prometheus 导出；健康检查 `/actuator/health`

## 3. SFTP→S3 适配与核心逻辑
- 虚拟文件系统：自定义 `FileSystemFactory` 将 SFTP 路径映射到 S3 bucket/key；每用户可绑定多个存储目标与前缀。
- 列目录：S3 ListObjectsV2 + 伪目录策略（`/` 分隔）；可加短时缓存减少 list 频率。
- 下载：S3 GetObject 流式读取；支持断点续传（Range）。
- 上传：S3 Multipart Upload；阈值/分片大小可配；记录 `uploadId + partETags` 支持续传；可用临时前缀 `.uploading/`，完成后 rename，保证“可见即完整”。
- 移动/重命名：S3 CopyObject + DeleteSource；大文件可用并行分段 copy。
- 删除：DeleteObject/Batch；可选回收站前缀。
- 权限与隔离：用户绑定可访问的 bucket/prefix；操作级权限（r/w/d/list/move）。
- 并发与限流：令牌桶/RateLimiter；按用户/全局的并发与带宽限制；队列长度保护后端 S3。
- 一致性与重试：对 eventual consistency 的存储做小延迟重试；校验 ETag/Content-MD5。

## 4. 安全
- SSH/SFTP：禁用弱算法，仅保留 curve25519/ed25519/chacha20-poly1305/aes-gcm/sha2；持久化 host key。
- 凭据：密码 bcrypt/argon2；公钥指纹存库；S3 凭据最小权限（IAM/STS）；密钥加密存储。
- 审计防篡改：审计日志入库 + 对象存储归档；可推送外部 SIEM；关键操作二次确认。
- 多租户：逻辑隔离（用户-存储绑定 + prefix）；后续可扩展租户字段做更细粒度隔离。

## 5. 前端（管理控制台）
- 技术：React + TypeScript + Vite；组件库可选 Ant Design/Arco（若已有设计体系则复用）。
- 功能：
  - 用户管理：创建/禁用、角色、限速/并发配额、密码/公钥管理。
  - 存储连接：配置 endpoint/region/AK/SK 或 STS 角色、bucket/prefix，连通性测试。
  - 监控：当前会话、并发/吞吐、错误率、S3 延迟，Prometheus 指标可视化。
  - 审计：按用户/时间/动作/路径查询，导出 CSV/JSON；告警阈值（错误率高、存储不可达）Webhook/Email。
  - 配置：安全参数、算法白名单、主机密钥轮换、日志留存策略。
- 认证：JWT + 刷新；前端路由守卫；敏感操作确认弹窗。

## 6. 数据模型（草案）
- user: id, username, pwd_hash, pubkey, roles, enabled, rate_limit, max_sessions
- storage_target: id, name, endpoint, region, access_key, secret_enc, bucket, base_prefix, extra_headers, enabled
- user_binding: user_id, storage_target_id, prefix_override, permissions(r/w/d/list/move)
- audit_log: ts, user, action, path, bucket, key, bytes, duration_ms, client_ip, result, error
- session: session_id, user, start_ts, last_seen, client_ip, active_transfers

## 7. API 分层
- REST API (JWT)：用户/存储配置/审计/监控 CRUD & 查询。
- SFTP 服务端与 REST 共享服务层；DTO/Mapper 分离持久化与对外模型。

## 8. 测试策略
- 单元：路径映射、权限校验、S3 适配（mock S3）。
- 集成：MinIO testcontainer；SFTP 客户端回归（上传/下载/rename/list/续传/并发）。
- 性能：并发传输与带宽基准；限流/队列压力测试。
- 安全：弱算法禁用、公钥认证、权限越权测试。

## 9. 部署与运维
- 形态：可执行 Jar 或容器镜像（temurin:17-jre 基础）；配置外部化；敏感信息环境变量/KMS；host key 持久化卷。
- 横向扩展：节点无状态（认证/元数据在 DB，数据在 S3）；SFTP 可经 TCP LB 分发；共享审计库。
- 可观测：日志 stdout；Prometheus `/metrics`；健康检查 `/actuator/health`。
- 备份：DB 备份；审计日志归档；S3 数据由后端冗余保障。

## 10. 里程碑（粗略）
1) 周 1：Spring Boot + MINA SSHD 骨架，S3 读写/列目录/rename MVP。
2) 周 2：权限模型、审计、限流；前端框架搭建与登录/导航。
3) 周 3：前端主要页面（用户/存储/审计/监控），告警与指标接入。
4) 周 3.5：测试、基准、打包与部署脚本、文档。
