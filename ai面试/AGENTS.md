# Repository Guidelines

## 项目结构与模块组织
- `src/main/java`: 业务领域、接口层、LLM 适配器，按 `domain/infra/app` 分包保持依赖自上而下。
- `src/main/resources`: 配置、提示模板、少量启动数据；敏感配置改用环境变量覆盖。
- `src/test/java`: 单元/集成测试；`src/test/resources` 放测试配置、样例 JSON。
- `docs/`: 架构草图、接口契约、性能基线；提交前更新与变更匹配。
- `scripts/`: 本地工具脚本（数据生成、向量索引重建、CI 预检查）。
- `data/` 或 `models/`: 示例数据、轻量模型；大模型或私有数据仅存放远端并以占位符记录下载方式。

## 构建、测试与开发命令
- `./mvnw clean package -DskipTests`：标准构建，生成可运行包。
- `./mvnw test`：运行 JUnit 5 单元/集成测试。
- `./mvnw spring-boot:run`：本地启动后端，默认端口写在 `application.yml`。
- `./mvnw verify -Pcoverage`：如启用覆盖率插件时获取报告。
- `scripts/rebuild-index.sh`：若存在向量索引脚本，用于重建本地检索索引。

## 代码风格与命名约定
- Java 17+，4 空格缩进；YAML/JSON 2 空格。
- 包名小写点分；类/接口 PascalCase；方法、变量 camelCase；常量 UPPER_SNAKE；配置键 kebab-case。
- DTO/VO/command/query 使用明确后缀；提示模板文件按 `feature-purpose.prompt.md` 命名。
- 优先组合而非继承；公共接口放 `api`，实现放 `infra`，领域逻辑放 `domain`。
- 格式化遵循 IDE 的 Google Java Format/Spotless；提交前运行格式化与静态检查（如已配置 `./mvnw fmt` 或 `./mvnw checkstyle:check`）。

## 测试指南
- 默认 JUnit 5 + Mockito；必要时使用 Testcontainers 做集成验证。
- 单元测试命名 `*Test.java`；集成/端到端 `*IT.java`；测试方法用 `shouldDoWhen` 描述行为。
- 覆盖重点：并发代码、缓存/事务边界、LLM 调用的降级与重试、向量检索召回路径。
- 本地运行 `./mvnw test`；如需加速，可用 `-DskipITs` 仅跑单元测试。
- 新增接口需附带 happy path 与异常用例，并更新 `docs/` 中的契约示例。

## 提交与 Pull Request
- 提交信息遵循 Conventional Commits，例如 `feat(rag): add vector store cache`。
- 每个 PR 写明目的、主要变化、风险与验证方式；关联 Issue/需求编号。
- UI 或性能变更附截图或基准对比；接口变更附 curl 示例与返回样例。
- 代码评审前确保构建、测试通过，CI 报告干净。

## 安全与配置提示
- 不要提交密钥、令牌、模型权重；使用环境变量或密钥管理服务，`.env*` 保持在 `.gitignore`。
- 配置文件提供示例如 `application-example.yml`，说明必填项（数据库、向量库、LLM endpoint）。
- 记录外部依赖版本与兼容性（Java、Maven、向量引擎、CUDA）在 `docs/requirements.md`，便于新环境复现。
