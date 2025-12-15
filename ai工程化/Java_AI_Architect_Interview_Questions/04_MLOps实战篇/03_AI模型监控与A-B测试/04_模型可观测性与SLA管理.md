# 模型可观测性与SLA管理
## 题目描述
设计一套面向线上服务的模型可观测性与 SLA 管理方案，覆盖指标采集、日志、告警、A/B 实验、漂移检测与降级策略。

## 答案要点
- 指标：延迟(P50/P95/P99)、QPS、错误率、超时率、降级/熔断次数、缓存命中率、Token 用量
- 质量：在线反馈（点赞/差评）、标注集定期回归、漂移检测（输入分布/Embedding 分布）
- SLA：核心接口与非核心接口分级；超限链路（限流→降级→熔断→告警）
- A/B 与金丝雀：按用户/租户/流量比例分组，记录分组指标对比
- 日志：请求/响应摘要、特征/Prompt/模型版本、依赖调用、错误堆栈，敏感字段脱敏

## 核心原理
- 指标+日志+追踪形成闭环；分级 SLA 定义可接受的错误与延迟边界
- 质量评估需离线评测集 + 在线反馈，漂移/退化时自动告警与回滚

## 实践清单
1) 指标采集：Micrometer + Prometheus，关键指标：`ai.requests.total`、`ai.requests.error`、`ai.response.time`、`ai.cache.hit`、`ai.tokens.used`
2) 告警阈值：错误率>1%、P99>2s、超时率>1%、降级/熔断次数突增；分级通知（告警/致命）
3) A/B/金丝雀：按 userId hash 分桶；对比延迟、错误率、评分反馈；出现回归自动回滚
4) 漂移检测：输入特征分布 KS/PSI；Embedding 均值/协方差监控；异常触发告警与重训评估
5) 日志：保留 requestId/traceId、租户、模型/Prompt 版本、命中缓存与否；输出前脱敏
6) 降级：限流→小模型/缓存答复→兜底提示；重试仅对可重试错误，带退避

## 代码示例（指标与限流片段）
```java
@Bean
public RateLimiter rateLimiter() {
    return RateLimiter.of("llm-rate", RateLimiterConfig.custom()
        .limitForPeriod(100)                  // 每窗口许可数
        .limitRefreshPeriod(Duration.ofSeconds(1))
        .timeoutDuration(Duration.ofMillis(50))
        .build());
}

@Timed(value = "ai.response.time", description = "LLM 响应时间")
public String generate(String prompt) {
    return RateLimiter.decorateSupplier(rateLimiter, () -> llmClient.generate(prompt)).get();
}
```

## 验收与测试
- 指标：压测验证 P95/P99、QPS、错误率；故障注入测试告警与降级是否生效
- 质量：小型评测集回归对比（A/B）；在线反馈闭环跑通
- 漂移：模拟分布变化，验证检测与告警触发；回滚/切换模型路径可用
