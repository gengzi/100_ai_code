# 基于Spring Cloud的AI微服务架构设计

## 题目1: ⭐⭐⭐ AI微服务架构的Service Mesh集成

**问题描述**:
在大型AI系统中，多个AI服务之间需要复杂的调用关系和治理能力。请设计一个基于Spring Cloud和Istio的AI微服务架构，实现服务发现、负载均衡、熔断降级和分布式追踪。

**答案要点**:
- **服务拆分策略**: 按AI能力垂直拆分服务
- **Service Mesh**: Istio流量管理和安全策略
- **服务治理**: 熔断、限流、重试机制
- **可观测性**: 分布式追踪、日志聚合、监控告警

**代码示例**:
```java
// 主服务入口 - AI Gateway
@SpringBootApplication
@EnableEurekaClient
@EnableZuulProxy
@EnableCircuitBreaker
@EnableDiscoveryClient
public class AIGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(AIGatewayApplication.class, args);
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public Sampler sampler() {
        return Sampler.create(1.0f); // 100%采样率
    }
}

// AI服务网关配置
@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
            .route("nlp-service", r -> r.path("/api/nlp/**")
                .filters(f -> f.stripPrefix(2)
                    .requestRateLimiter(config -> config.setRateLimiter(redisRateLimiter()))
                    .circuitBreaker(config -> config.setName("nlp-circuit-breaker")))
                .uri("lb://nlp-service"))

            .route("cv-service", r -> r.path("/api/cv/**")
                .filters(f -> f.stripPrefix(2)
                    .requestRateLimiter(config -> config.setRateLimiter(redisRateLimiter()))
                    .circuitBreaker(config -> config.setName("cv-circuit-breaker")))
                .uri("lb://cv-service"))

            .route("recommendation-service", r -> r.path("/api/recommendation/**")
                .filters(f -> f.stripPrefix(2)
                    .requestRateLimiter(config -> config.setRateLimiter(redisRateLimiter()))
                    .circuitBreaker(config -> config.setName("recommendation-circuit-breaker")))
                .uri("lb://recommendation-service"))

            .build();
    }

    @Bean
    public RedisRateLimiter redisRateLimiter() {
        return new RedisRateLimiter(100, 200, 1); // 每秒100个请求，突发200个
    }

    @Bean
    public FilterRegistrationBean<TraceFilter> traceFilter() {
        FilterRegistrationBean<TraceFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new TraceFilter());
        registration.addUrlPatterns("/*");
        return registration;
    }
}

// NLP微服务
@RestController
@RequestMapping("/api/nlp")
@Slf4j
public class NLPController {

    private final TextProcessingService textService;
    private final SentimentAnalysisService sentimentService;
    private final NERService nerService;
    private final Tracer tracer;

    public NLPController(TextProcessingService textService,
                        SentimentAnalysisService sentimentService,
                        NERService nerService,
                        Tracer tracer) {
        this.textService = textService;
        this.sentimentService = sentimentService;
        this.nerService = nerService;
        this.tracer = tracer;
    }

    @PostMapping("/sentiment")
    @Timed(name = "nlp.sentiment.analysis", description = "Sentiment analysis processing time")
    public ResponseEntity<SentimentResponse> analyzeSentiment(@RequestBody SentimentRequest request) {
        Span span = tracer.nextSpan().name("sentiment-analysis");
        try (Tracer.SpanInScope ws = tracer.withSpanInScope(span)) {
            span.tag("service", "nlp");
            span.tag("operation", "sentiment-analysis");
            span.tag("text.length", String.valueOf(request.getText().length()));

            log.info("开始情感分析: textLength={}", request.getText().length());

            // 异步处理
            CompletableFuture<SentimentResult> future = CompletableFuture
                .supplyAsync(() -> sentimentService.analyze(request.getText()))
                .thenApply(result -> {
                    span.tag("sentiment.score", String.valueOf(result.getScore()));
                    return result;
                });

            SentimentResult result = future.get(30, TimeUnit.SECONDS);

            SentimentResponse response = new SentimentResponse(
                result.getSentiment(),
                result.getScore(),
                result.getConfidence()
            );

            span.tag("result", "success");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            span.tag("error", e.getMessage());
            log.error("情感分析失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new SentimentResponse("ERROR", 0.0, 0.0));
        } finally {
            span.end();
        }
    }

    @PostMapping("/ner")
    public ResponseEntity<NERResponse> extractEntities(@RequestBody NERRequest request) {
        Span span = tracer.nextSpan().name("named-entity-recognition");
        try (Tracer.SpanInScope ws = tracer.withSpanInScope(span)) {
            span.tag("service", "nlp");
            span.tag("operation", "ner");

            List<NamedEntity> entities = nerService.extractEntities(request.getText());

            span.tag("entities.count", String.valueOf(entities.size()));

            NERResponse response = new NERResponse(entities);
            span.tag("result", "success");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            span.tag("error", e.getMessage());
            log.error("命名实体识别失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } finally {
            span.end();
        }
    }

    @PostMapping("/batch-process")
    @Async("asyncExecutor")
    public CompletableFuture<ResponseEntity<BatchProcessResponse>> batchProcess(
            @RequestBody BatchProcessRequest request) {

        return CompletableFuture.supplyAsync(() -> {
            Span span = tracer.nextSpan().name("batch-nlp-processing");
            try (Tracer.SpanInScope ws = tracer.withSpanInScope(span)) {
                span.tag("service", "nlp");
                span.tag("operation", "batch-process");
                span.tag("batch.size", String.valueOf(request.getTexts().size()));

                List<String> results = new ArrayList<>();
                int successCount = 0;
                int errorCount = 0;

                for (String text : request.getTexts()) {
                    try {
                        String processed = textService.preprocess(text);
                        results.add(processed);
                        successCount++;
                    } catch (Exception e) {
                        log.error("批量处理单条文本失败: {}", text, e);
                        errorCount++;
                    }
                }

                BatchProcessResponse response = new BatchProcessResponse(
                    results, successCount, errorCount
                );

                span.tag("success.count", String.valueOf(successCount));
                span.tag("error.count", String.valueOf(errorCount));
                span.tag("result", "success");

                return ResponseEntity.ok(response);

            } finally {
                span.end();
            }
        });
    }
}

// 推荐服务
@RestController
@RequestMapping("/api/recommendation")
@Slf4j
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final ModelManager modelManager;
    private final CacheManager cacheManager;
    private final Tracer tracer;

    public RecommendationController(RecommendationService recommendationService,
                                  ModelManager modelManager,
                                  CacheManager cacheManager,
                                  Tracer tracer) {
        this.recommendationService = recommendationService;
        this.modelManager = modelManager;
        this.cacheManager = cacheManager;
        this.tracer = tracer;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<RecommendationResponse> getUserRecommendations(
            @PathVariable String userId,
            @RequestParam(defaultValue = "10") int limit) {

        Span span = tracer.nextSpan().name("user-recommendation");
        try (Tracer.SpanInScope ws = tracer.withSpanInScope(span)) {
            span.tag("service", "recommendation");
            span.tag("operation", "user-recommendation");
            span.tag("user.id", userId);

            // 检查缓存
            String cacheKey = "user_recommendations:" + userId;
            RecommendationResponse cached = cacheManager.get(cacheKey, RecommendationResponse.class);

            if (cached != null) {
                span.tag("cache.hit", "true");
                return ResponseEntity.ok(cached);
            }

            span.tag("cache.hit", "false");

            // 获取用户画像
            UserProfile userProfile = recommendationService.getUserProfile(userId);
            span.tag("user.profile.complexity", String.valueOf(userProfile.getFeatures().size()));

            // 多模型融合推荐
            CompletableFuture<List<Recommendation>> cfFuture = CompletableFuture
                .supplyAsync(() -> modelManager.getPredictions("collaborative-filtering", userProfile));

            CompletableFuture<List<Recommendation>> contentFuture = CompletableFuture
                .supplyAsync(() -> modelManager.getPredictions("content-based", userProfile));

            CompletableFuture<List<Recommendation>> hybridFuture = CompletableFuture
                .supplyAsync(() -> modelManager.getPredictions("hybrid-model", userProfile));

            // 等待所有预测完成
            CompletableFuture.allOf(cfFuture, contentFuture, hybridFuture).get();

            List<Recommendation> cfRecommendations = cfFuture.get();
            List<Recommendation> contentRecommendations = contentFuture.get();
            List<Recommendation> hybridRecommendations = hybridFuture.get();

            // 融合结果
            List<Recommendation> mergedRecommendations = recommendationService.mergeRecommendations(
                cfRecommendations, contentRecommendations, hybridRecommendations, limit
            );

            RecommendationResponse response = new RecommendationResponse(
                userId, mergedRecommendations, System.currentTimeMillis()
            );

            // 缓存结果
            cacheManager.put(cacheKey, response, Duration.ofMinutes(30));

            span.tag("recommendations.count", String.valueOf(mergedRecommendations.size()));
            span.tag("result", "success");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            span.tag("error", e.getMessage());
            log.error("用户推荐失败: userId={}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } finally {
            span.end();
        }
    }
}

// 服务间通信配置
@Configuration
@EnableFeignClients
public class FeignConfig {

    @Bean
    public RequestInterceptor requestInterceptor() {
        return new RequestInterceptor() {
            @Override
            public void apply(RequestTemplate template) {
                // 添加追踪头
                Span span = tracer.currentSpan();
                if (span != null) {
                    template.header("X-Trace-Id", span.context().traceId());
                    template.header("X-Span-Id", span.context().spanId());
                }

                // 添加认证头
                template.header("Authorization", "Bearer " + getAuthToken());
            }
        };
    }

    @Bean
    public Logger.Level feignLoggerLevel() {
        return Logger.Level.FULL;
    }

    @Bean
    public Retryer retryer() {
        return new Retryer.Default(100, 1000, 3); // 初始间隔100ms，最大1000ms，重试3次
    }

    private String getAuthToken() {
        // 获取JWT token
        return "your-jwt-token";
    }
}

// Feign客户端定义
@FeignClient(name = "model-service", configuration = FeignConfig.class)
public interface ModelServiceClient {

    @PostMapping("/predict")
    CompletableFuture<PredictionResponse> predictAsync(@RequestBody PredictionRequest request);

    @PostMapping("/batch-predict")
    BatchPredictionResponse batchPredict(@RequestBody BatchPredictionRequest request);

    @GetMapping("/health")
    HealthStatus health();
}

// 服务健康检查
@Component
public class ServiceHealthIndicator implements HealthIndicator {

    private final DiscoveryClient discoveryClient;
    private final ModelServiceClient modelServiceClient;

    @Override
    public Health health() {
        try {
            // 检查服务注册状态
            List<String> services = discoveryClient.getServices();

            // 检查依赖服务健康状态
            HealthStatus modelHealth = modelServiceClient.health();

            if (modelHealth.isHealthy() && !services.isEmpty()) {
                return Health.up()
                    .withDetail("registeredServices", services.size())
                    .withDetail("modelService", modelHealth)
                    .build();
            } else {
                return Health.down()
                    .withDetail("error", "依赖服务不健康")
                    .build();
            }

        } catch (Exception e) {
            return Health.down()
                .withDetail("error", e.getMessage())
                .build();
        }
    }
}

// 异步执行器配置
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean("asyncExecutor")
    public Executor asyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(Runtime.getRuntime().availableProcessors());
        executor.setMaxPoolSize(Runtime.getRuntime().availableProcessors() * 2);
        executor.setQueueCapacity(1000);
        executor.setThreadNamePrefix("Async-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }

    @Bean("modelInferenceExecutor")
    public Executor modelInferenceExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("Model-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}

// 配置管理
@ConfigurationProperties(prefix = "ai.microservices")
@Data
public class MicroserviceProperties {
    private String modelServiceUrl = "http://model-service";
    private int connectionTimeout = 5000;
    private int readTimeout = 10000;
    private boolean circuitBreakerEnabled = true;
    private double circuitBreakerFailureThreshold = 0.5;
    private int circuitBreakerTimeout = 60000;
    private int rateLimitPerSecond = 100;
    private int rateLimitBurstCapacity = 200;
}

// 数据传输对象
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SentimentRequest {
    private String text;
    private String language;
    private Map<String, Object> metadata;
}

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SentimentResponse {
    private String sentiment;
    private double score;
    private double confidence;
}

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NERRequest {
    private String text;
    private String language;
    private List<String> entityTypes;
}

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NERResponse {
    private List<NamedEntity> entities;
    private long processingTime;
}

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NamedEntity {
    private String text;
    private String type;
    private int start;
    private int end;
    private double confidence;
}

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RecommendationResponse {
    private String userId;
    private List<Recommendation> recommendations;
    private long timestamp;
}

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Recommendation {
    private String itemId;
    private String itemType;
    private double score;
    private String reason;
    private Map<String, Object> features;
}
```

---

## 题目2: ⭐⭐⭐⭐ AI微服务的弹性设计模式

**问题描述**:
AI微服务在处理大规模并发请求时需要具备高度的弹性。请设计一个完整的弹性架构方案，包括自适应熔断、智能重试、故障隔离和自愈能力。

**答案要点**:
- **自适应熔断**: 基于成功率和响应时间的动态阈值
- **智能重试**: 指数退避和抖动算法
- **故障隔离**: Bulkhead模式和舱壁隔离
- **自愈机制**: 自动检测和恢复策略

**代码示例**:
```java
// 自适应熔断器
@Component
@Slf4j
public class AdaptiveCircuitBreakerManager {

    private final Map<String, AdaptiveCircuitBreaker> circuitBreakers = new ConcurrentHashMap<>();
    private final MetricsCollector metricsCollector;
    private final ScheduledExecutorService scheduler;

    public AdaptiveCircuitBreakerManager(MetricsCollector metricsCollector) {
        this.metricsCollector = metricsCollector;
        this.scheduler = Executors.newScheduledThreadPool(2);

        // 定期调整熔断器参数
        scheduler.scheduleAtFixedRate(this::adjustCircuitBreakers, 60, 60, TimeUnit.SECONDS);
    }

    public <T> CompletableFuture<T> execute(String serviceName, Supplier<CompletableFuture<T>> operation) {
        AdaptiveCircuitBreaker breaker = getOrCreateCircuitBreaker(serviceName);

        return breaker.execute(operation)
            .whenComplete((result, throwable) -> {
                if (throwable == null) {
                    breaker.recordSuccess();
                } else {
                    breaker.recordFailure(throwable);
                }
            });
    }

    private AdaptiveCircuitBreaker getOrCreateCircuitBreaker(String serviceName) {
        return circuitBreakers.computeIfAbsent(serviceName, name ->
            new AdaptiveCircuitBreaker(name, metricsCollector));
    }

    private void adjustCircuitBreakers() {
        for (AdaptiveCircuitBreaker breaker : circuitBreakers.values()) {
            ServiceMetrics metrics = metricsCollector.getServiceMetrics(breaker.getServiceName());
            breaker.adjustParameters(metrics);
        }
    }
}

public class AdaptiveCircuitBreaker {

    private final String serviceName;
    private final MetricsCollector metricsCollector;

    // 熔断器状态
    private volatile CircuitBreakerState state = CircuitBreakerState.CLOSED;
    private volatile double failureThreshold = 0.5; // 默认失败率阈值50%
    private volatile int minThroughput = 10; // 最小请求量
    private volatile long timeoutDuration = 60000; // 超时时长

    // 统计数据
    private final AtomicInteger totalRequests = new AtomicInteger(0);
    private final AtomicInteger failureCount = new AtomicInteger(0);
    private volatile long lastFailureTime = 0;
    private volatile long windowStartTime = System.currentTimeMillis();

    private final ReadWriteLock lock = new ReReadWriteLock();

    public AdaptiveCircuitBreaker(String serviceName, MetricsCollector metricsCollector) {
        this.serviceName = serviceName;
        this.metricsCollector = metricsCollector;
    }

    public <T> CompletableFuture<T> execute(Supplier<CompletableFuture<T>> operation) {
        if (state == CircuitBreakerState.OPEN) {
            // 检查是否可以转为半开状态
            if (System.currentTimeMillis() - lastFailureTime > timeoutDuration) {
                transitionToHalfOpen();
            } else {
                return CompletableFuture.failedFuture(
                    new CircuitBreakerOpenException("Circuit breaker is open for service: " + serviceName));
            }
        }

        return operation.get()
            .whenComplete((result, throwable) -> {
                lock.writeLock().lock();
                try {
                    totalRequests.incrementAndGet();

                    if (throwable == null) {
                        handleSuccess();
                    } else {
                        handleFailure(throwable);
                    }
                } finally {
                    lock.writeLock().unlock();
                }
            });
    }

    private void handleSuccess() {
        if (state == CircuitBreakerState.HALF_OPEN) {
            transitionToClosed();
        }

        metricsCollector.recordCircuitBreakerEvent(serviceName, "success");
    }

    private void handleFailure(Throwable throwable) {
        failureCount.incrementAndGet();
        lastFailureTime = System.currentTimeMillis();

        if (state == CircuitBreakerState.HALF_OPEN) {
            transitionToOpen();
        } else if (shouldOpen()) {
            transitionToOpen();
        }

        metricsCollector.recordCircuitBreakerEvent(serviceName, "failure", throwable.getClass().getSimpleName());
    }

    private boolean shouldOpen() {
        int currentThroughput = totalRequests.get();
        if (currentThroughput < minThroughput) {
            return false;
        }

        long currentTime = System.currentTimeMillis();
        if (currentTime - windowStartTime > 60000) { // 1分钟窗口
            // 重置统计数据
            totalRequests.set(0);
            failureCount.set(0);
            windowStartTime = currentTime;
            return false;
        }

        double currentFailureRate = (double) failureCount.get() / currentThroughput;
        return currentFailureRate >= failureThreshold;
    }

    private void transitionToOpen() {
        state = CircuitBreakerState.OPEN;
        log.warn("熔断器打开: service={}, failureRate={}", serviceName, getCurrentFailureRate());
        metricsCollector.recordCircuitBreakerStateChange(serviceName, "CLOSED", "OPEN");
    }

    private void transitionToHalfOpen() {
        state = CircuitBreakerState.HALF_OPEN;
        log.info("熔断器半开: service={}", serviceName);
        metricsCollector.recordCircuitBreakerStateChange(serviceName, "OPEN", "HALF_OPEN");
    }

    private void transitionToClosed() {
        state = CircuitBreakerState.CLOSED;
        resetStatistics();
        log.info("熔断器关闭: service={}", serviceName);
        metricsCollector.recordCircuitBreakerStateChange(serviceName, "HALF_OPEN", "CLOSED");
    }

    private void resetStatistics() {
        totalRequests.set(0);
        failureCount.set(0);
        lastFailureTime = 0;
        windowStartTime = System.currentTimeMillis();
    }

    public void adjustParameters(ServiceMetrics metrics) {
        lock.writeLock().lock();
        try {
            // 基于历史性能调整参数
            double avgResponseTime = metrics.getAverageResponseTime();
            double p95ResponseTime = metrics.getP95ResponseTime();
            double currentErrorRate = metrics.getErrorRate();

            // 根据响应时间调整超时
            if (avgResponseTime > timeoutDuration * 0.7) {
                timeoutDuration = (long) (avgResponseTime * 2);
                log.info("调整熔断器超时时间: service={}, newTimeout={}ms", serviceName, timeoutDuration);
            }

            // 根据错误率调整失败阈值
            if (currentErrorRate > 0.1 && currentErrorRate < failureThreshold) {
                failureThreshold = Math.max(0.3, currentErrorRate * 1.5);
                log.info("调整熔断器失败阈值: service={}, newThreshold={}", serviceName, failureThreshold);
            }

            // 根据请求量调整最小吞吐量
            long avgThroughput = metrics.getAverageThroughput();
            if (avgThroughput > minThroughput * 2) {
                minThroughput = (int) (avgThroughput * 0.5);
                log.info("调整最小吞吐量: service={}, newMinThroughput={}", serviceName, minThroughput);
            }

        } finally {
            lock.writeLock().unlock();
        }
    }

    private double getCurrentFailureRate() {
        int total = totalRequests.get();
        return total > 0 ? (double) failureCount.get() / total : 0.0;
    }

    public CircuitBreakerState getState() { return state; }
    public String getServiceName() { return serviceName; }
}

public enum CircuitBreakerState {
    CLOSED,    // 正常状态
    OPEN,      // 熔断状态
    HALF_OPEN  // 半开状态
}

// 智能重试机制
@Component
@Slf4j
public class SmartRetryManager {

    private final RetryTemplate retryTemplate;
    private final BackoffPolicy backoffPolicy;
    private final RetryListener retryListener;

    public SmartRetryManager() {
        this.retryTemplate = createRetryTemplate();
        this.backoffPolicy = new ExponentialBackOffPolicy();
        this.retryListener = new LoggingRetryListener();
    }

    private RetryTemplate createRetryTemplate() {
        RetryTemplate template = new RetryTemplate();

        // 重试策略：最多重试5次
        SimpleRetryPolicy retryPolicy = new SimpleRetryPolicy();
        retryPolicy.setMaxAttempts(5);

        // 可重试的异常类型
        Map<Class<? extends Throwable>, Boolean> retryableExceptions = new HashMap<>();
        retryableExceptions.put(NetworkException.class, true);
        retryableExceptions.put(TimeoutException.class, true);
        retryableExceptions.put(ServiceUnavailableException.class, true);
        retryableExceptions.put(RateLimitExceededException.class, true);

        retryPolicy.setRetryableExceptions(retryableExceptions);

        // 退避策略：指数退避 + 抖动
        ExponentialBackOffPolicy backOffPolicy = new ExponentialBackOffPolicy();
        backOffPolicy.setInitialInterval(1000); // 初始1秒
        backOffPolicy.setMultiplier(2.0);       // 每次翻倍
        backOffPolicy.setMaxInterval(30000);     // 最大30秒

        // 添加抖动避免雪崩
        UniformRandomBackOffPolicy jitterPolicy = new UniformRandomBackOffPolicy();
        jitterPolicy.setMinBackOffPeriod(500);
        jitterPolicy.setMaxBackOffPeriod(5000);

        CompositeBackOffPolicy compositeBackOffPolicy = new CompositeBackOffPolicy();
        compositeBackOffPolicy.addPolicy(backOffPolicy);
        compositeBackOffPolicy.addPolicy(jitterPolicy);

        template.setRetryPolicy(retryPolicy);
        template.setBackOffPolicy(compositeBackOffPolicy);
        template.registerListener(retryListener);

        return template;
    }

    public <T> CompletableFuture<T> executeWithRetry(String operationName,
                                                   Supplier<CompletableFuture<T>> operation,
                                                   Class<? extends Throwable>[] retryableExceptions) {

        return CompletableFuture.supplyAsync(() -> {
            return retryTemplate.execute(context -> {
                try {
                    log.debug("执行操作: {}, 尝试次数: {}", operationName, context.getRetryCount() + 1);

                    CompletableFuture<T> future = operation.get();
                    T result = future.get(getTimeoutForRetry(context.getRetryCount()), TimeUnit.MILLISECONDS);

                    log.debug("操作成功: {}, 尝试次数: {}", operationName, context.getRetryCount() + 1);
                    return result;

                } catch (Exception e) {
                    log.warn("操作失败: {}, 尝试次数: {}, 错误: {}",
                            operationName, context.getRetryCount() + 1, e.getMessage());

                    // 检查是否应该重试
                    if (shouldRetry(e, retryableExceptions, context)) {
                        throw new RetryableException("操作可重试: " + e.getMessage(), e);
                    } else {
                        throw new NonRetryableException("操作不可重试: " + e.getMessage(), e);
                    }
                }
            });
        });
    }

    private boolean shouldRetry(Exception e, Class<? extends Throwable>[] retryableExceptions, RetryContext context) {
        // 检查重试次数限制
        if (context.getRetryCount() >= 4) { // 最多重试4次，加上初始调用总共5次
            return false;
        }

        // 检查异常类型
        for (Class<? extends Throwable> retryableException : retryableExceptions) {
            if (retryableException.isInstance(e)) {
                return true;
            }
        }

        return false;
    }

    private long getTimeoutForRetry(int retryCount) {
        // 根据重试次数动态调整超时时间
        return Math.min(30000, 5000 + retryCount * 2000); // 5秒基础，每次增加2秒，最大30秒
    }

    private static class LoggingRetryListener implements RetryListener {
        @Override
        public <T, E extends Throwable> boolean open(RetryContext context, RetryCallback<T, E> callback) {
            return true;
        }

        @Override
        public <T, E extends Throwable> void close(RetryContext context, RetryCallback<T, E> callback, Throwable throwable) {
            if (throwable == null) {
                log.info("重试操作成功，总重试次数: {}", context.getRetryCount());
            } else {
                log.error("重试操作最终失败，总重试次数: {}", context.getRetryCount(), throwable);
            }
        }

        @Override
        public <T, E extends Throwable> void onError(RetryContext context, RetryCallback<T, E> callback, Throwable throwable) {
            log.warn("重试操作出错，当前重试次数: {}, 错误: {}",
                    context.getRetryCount(), throwable.getMessage());
        }
    }
}

// 故障隔离 - Bulkhead模式
@Component
@Slf4j
public class BulkheadManager {

    private final Map<String, ThreadPoolBulkhead> bulkheads = new ConcurrentHashMap<>();

    public <T> CompletableFuture<T> executeWithinBulkhead(String serviceName,
                                                          Supplier<CompletableFuture<T>> operation,
                                                          int maxConcurrentCalls) {
        ThreadPoolBulkhead bulkhead = getOrCreateBulkhead(serviceName, maxConcurrentCalls);

        return CompletableFuture.supplyAsync(() -> {
            try {
                return bulkhead.executeSupplier(() -> {
                    try {
                        return operation.get().get();
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                });
            } catch (BulkheadFullException e) {
                log.warn("舱壁已满，拒绝请求: service={}", serviceName);
                throw new ServiceOverloadedException("服务过载，请稍后重试", e);
            }
        });
    }

    private ThreadPoolBulkhead getOrCreateBulkhead(String serviceName, int maxConcurrentCalls) {
        return bulkheads.computeIfAbsent(serviceName, name ->
            ThreadPoolBulkhead.ofDefaults(name + "-bulkhead"));
    }

    @Scheduled(fixedRate = 30000) // 每30秒检查一次
    public void monitorBulkheads() {
        for (Map.Entry<String, ThreadPoolBulkhead> entry : bulkheads.entrySet()) {
            String serviceName = entry.getKey();
            ThreadPoolBulkhead bulkhead = entry.getValue();

            Bulkhead.Metrics metrics = bulkhead.getMetrics();

            // 监控舱壁使用情况
            double availableConcurrentCalls = metrics.getAvailableConcurrentCalls();
            int maxConcurrentCalls = metrics.getMaxAllowedConcurrentCalls();

            double usageRate = 1.0 - (availableConcurrentCalls / maxConcurrentCalls);

            if (usageRate > 0.8) {
                log.warn("舱壁使用率过高: service={}, usageRate={:.2f}%",
                        serviceName, usageRate * 100);
            }
        }
    }
}

// 自愈机制
@Component
@Slf4j
public class SelfHealingManager {

    private final HealthCheckService healthCheckService;
    private final ServiceRegistry serviceRegistry;
    private final AlertManager alertManager;
    private final ScheduledExecutorService scheduler;

    public SelfHealingManager(HealthCheckService healthCheckService,
                             ServiceRegistry serviceRegistry,
                             AlertManager alertManager) {
        this.healthCheckService = healthCheckService;
        this.serviceRegistry = serviceRegistry;
        this.alertManager = alertManager;
        this.scheduler = Executors.newScheduledThreadPool(4);

        startSelfHealingMonitoring();
    }

    private void startSelfHealingMonitoring() {
        // 每5分钟执行健康检查
        scheduler.scheduleAtFixedRate(this::performHealthChecks, 0, 5, TimeUnit.MINUTES);

        // 每30分钟执行性能检查
        scheduler.scheduleAtFixedRate(this::performPerformanceChecks, 1, 30, TimeUnit.MINUTES);
    }

    private void performHealthChecks() {
        List<String> services = serviceRegistry.getAllServices();

        for (String serviceName : services) {
            CompletableFuture.supplyAsync(() -> {
                try {
                    HealthStatus status = healthCheckService.checkServiceHealth(serviceName);
                    processHealthStatus(serviceName, status);
                    return status;
                } catch (Exception e) {
                    log.error("健康检查失败: service={}", serviceName, e);
                    return HealthStatus.unhealthy("健康检查异常: " + e.getMessage());
                }
            }).whenComplete((status, throwable) -> {
                if (throwable != null) {
                    log.error("健康检查执行异常: service={}", serviceName, throwable);
                }
            });
        }
    }

    private void performPerformanceChecks() {
        List<String> services = serviceRegistry.getAllServices();

        for (String serviceName : services) {
            try {
                PerformanceMetrics metrics = healthCheckService.getPerformanceMetrics(serviceName);
                processPerformanceMetrics(serviceName, metrics);
            } catch (Exception e) {
                log.error("性能检查失败: service={}", serviceName, e);
            }
        }
    }

    private void processHealthStatus(String serviceName, HealthStatus status) {
        if (!status.isHealthy()) {
            log.warn("服务不健康: service={}, status={}", serviceName, status.getMessage());

            // 触发自愈流程
            triggerSelfHealing(serviceName, status);
        } else {
            // 服务恢复正常，清除告警
            alertManager.clearServiceAlert(serviceName);
        }
    }

    private void processPerformanceMetrics(String serviceName, PerformanceMetrics metrics) {
        // 检查性能指标
        if (metrics.getCpuUsage() > 90 || metrics.getMemoryUsage() > 90) {
            log.warn("服务资源使用率过高: service={}, cpu={}%, memory={}%",
                    serviceName, metrics.getCpuUsage(), metrics.getMemoryUsage());

            // 触发资源优化
            optimizeServiceResources(serviceName, metrics);
        }

        if (metrics.getAverageResponseTime() > 5000) { // 5秒
            log.warn("服务响应时间过长: service={}, avgResponseTime={}ms",
                    serviceName, metrics.getAverageResponseTime());

            // 触发性能优化
            optimizeServicePerformance(serviceName, metrics);
        }
    }

    private void triggerSelfHealing(String serviceName, HealthStatus status) {
        // 记录告警
        alertManager.sendAlert(Alert.builder()
            .serviceName(serviceName)
            .type(AlertType.SERVICE_UNHEALTHY)
            .severity(AlertSeverity.HIGH)
            .message("服务不健康: " + status.getMessage())
            .timestamp(LocalDateTime.now())
            .build());

        // 尝试自愈
        String healingAction = determineHealingAction(serviceName, status);

        CompletableFuture.supplyAsync(() -> {
            try {
                return executeHealingAction(serviceName, healingAction);
            } catch (Exception e) {
                log.error("自愈执行失败: service={}, action={}", serviceName, healingAction, e);
                return false;
            }
        }).whenComplete((success, throwable) -> {
            if (Boolean.TRUE.equals(success)) {
                log.info("自愈成功: service={}, action={}", serviceName, healingAction);
                alertManager.sendAlert(Alert.builder()
                    .serviceName(serviceName)
                    .type(AlertType.SELF_HEALING_SUCCESS)
                    .severity(AlertSeverity.INFO)
                    .message("自愈成功: " + healingAction)
                    .timestamp(LocalDateTime.now())
                    .build());
            } else {
                log.error("自愈失败: service={}, action={}", serviceName, healingAction);
                alertManager.sendAlert(Alert.builder()
                    .serviceName(serviceName)
                    .type(AlertType.SELF_HEALING_FAILED)
                    .severity(AlertSeverity.CRITICAL)
                    .message("自愈失败，需要人工干预: " + healingAction)
                    .timestamp(LocalDateTime.now())
                    .build());
            }
        });
    }

    private String determineHealingAction(String serviceName, HealthStatus status) {
        String errorMessage = status.getMessage().toLowerCase();

        if (errorMessage.contains("connection") || errorMessage.contains("network")) {
            return "restart_service";
        } else if (errorMessage.contains("memory") || errorMessage.contains("oom")) {
            return "scale_up_memory";
        } else if (errorMessage.contains("timeout")) {
            return "increase_timeout";
        } else {
            return "restart_service"; // 默认重启服务
        }
    }

    private boolean executeHealingAction(String serviceName, String action) {
        switch (action) {
            case "restart_service":
                return serviceRegistry.restartService(serviceName);
            case "scale_up_memory":
                return serviceRegistry.scaleService(serviceName, 1.5); // 增加50%内存
            case "increase_timeout":
                return serviceRegistry.updateServiceConfig(serviceName,
                    Map.of("timeout", "30000")); // 30秒超时
            default:
                log.warn("未知的自愈动作: {}", action);
                return false;
        }
    }

    private void optimizeServiceResources(String serviceName, PerformanceMetrics metrics) {
        // 根据资源使用情况调整配置
        Map<String, Object> newConfig = new HashMap<>();

        if (metrics.getCpuUsage() > 90) {
            newConfig.put("cpu.limit", String.valueOf((int)(metrics.getCpuLimit() * 1.2)));
        }

        if (metrics.getMemoryUsage() > 90) {
            newConfig.put("memory.limit", String.valueOf((int)(metrics.getMemoryLimit() * 1.2)));
        }

        if (!newConfig.isEmpty()) {
            serviceRegistry.updateServiceConfig(serviceName, newConfig);
            log.info("资源优化配置已应用: service={}, config={}", serviceName, newConfig);
        }
    }

    private void optimizeServicePerformance(String serviceName, PerformanceMetrics metrics) {
        // 性能优化策略
        if (metrics.getAverageResponseTime() > 5000) {
            // 增加实例数量
            serviceRegistry.scaleService(serviceName, 2);

            // 调整线程池配置
            Map<String, Object> threadPoolConfig = Map.of(
                "thread.pool.core.size", "8",
                "thread.pool.max.size", "16",
                "thread.pool.queue.capacity", "1000"
            );
            serviceRegistry.updateServiceConfig(serviceName, threadPoolConfig);

            log.info("性能优化配置已应用: service={}", serviceName);
        }
    }
}
```

---

## 题目3: ⭐⭐⭐⭐⭐ 分布式AI推理系统的架构设计

**问题描述**:
设计一个支持千万级并发的分布式AI推理系统，要求具备高可用性、低延迟、自动扩缩容和智能路由能力。请提供完整的架构方案和关键实现代码。

**答案要点**:
- **分层架构**: API网关、负载均衡、推理服务、存储层
- **智能路由**: 基于模型类型、负载、地理位置的路由策略
- **自动扩缩容**: 基于指标和预测的弹性伸缩
- **一致性哈希**: 会话保持和数据分布
- **缓存策略**: 多级缓存和预加载机制

**代码示例**:
```java
// 分布式AI推理系统架构
@RestController
@RequestMapping("/api/inference")
@Slf4j
public class DistributedInferenceController {

    private final InferenceRouter inferenceRouter;
    private final ModelCacheManager modelCacheManager;
    private final MetricsCollector metricsCollector;
    private final Tracer tracer;

    public DistributedInferenceController(InferenceRouter inferenceRouter,
                                        ModelCacheManager modelCacheManager,
                                        MetricsCollector metricsCollector,
                                        Tracer tracer) {
        this.inferenceRouter = inferenceRouter;
        this.modelCacheManager = modelCacheManager;
        this.metricsCollector = metricsCollector;
        this.tracer = tracer;
    }

    @PostMapping("/predict/{modelId}")
    public ResponseEntity<PredictionResponse> predict(@PathVariable String modelId,
                                                   @RequestBody PredictionRequest request,
                                                   HttpServletRequest httpRequest) {
        Span span = tracer.nextSpan().name("distributed-prediction");
        try (Tracer.SpanInScope ws = tracer.withSpanInScope(span)) {
            span.tag("model.id", modelId);
            span.tag("request.size", String.valueOf(request.getInput().length()));

            // 获取请求上下文
            RequestContext context = RequestContext.builder()
                .modelId(modelId)
                .clientIp(getClientIp(httpRequest))
                .userAgent(httpRequest.getHeader("User-Agent"))
                .priority(request.getPriority())
                .build();

            // 路由到最优推理节点
            CompletableFuture<PredictionResponse> future = inferenceRouter.routeRequest(context, request);

            // 设置超时
            PredictionResponse response = future.get(request.getTimeoutSeconds(), TimeUnit.SECONDS);

            span.tag("result", "success");
            span.tag("response.time", String.valueOf(response.getInferenceTime()));

            return ResponseEntity.ok(response);

        } catch (TimeoutException e) {
            span.tag("error", "timeout");
            metricsCollector.recordTimeout(modelId);
            return ResponseEntity.status(HttpStatus.REQUEST_TIMEOUT)
                .body(PredictionResponse.error("推理超时"));

        } catch (Exception e) {
            span.tag("error", e.getMessage());
            metricsCollector.recordError(modelId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(PredictionResponse.error("推理失败: " + e.getMessage()));
        } finally {
            span.end();
        }
    }

    @PostMapping("/batch-predict/{modelId}")
    public ResponseEntity<BatchPredictionResponse> batchPredict(@PathVariable String modelId,
                                                              @RequestBody BatchPredictionRequest request,
                                                              HttpServletRequest httpRequest) {
        Span span = tracer.nextSpan().name("batch-inference");
        try (Tracer.SpanInScope ws = tracer.withSpanInScope(span)) {
            span.tag("model.id", modelId);
            span.tag("batch.size", String.valueOf(request.getRequests().size()));

            RequestContext context = RequestContext.builder()
                .modelId(modelId)
                .clientIp(getClientIp(httpRequest))
                .batchMode(true)
                .build();

            // 智能分批处理
            List<CompletableFuture<PredictionResponse>> futures = inferenceRouter.routeBatchRequest(
                context, request.getRequests()
            );

            // 等待所有结果
            List<PredictionResponse> responses = futures.stream()
                .map(future -> {
                    try {
                        return future.get(60, TimeUnit.SECONDS);
                    } catch (Exception e) {
                        log.error("批量推理中的单个请求失败", e);
                        return PredictionResponse.error("批量推理失败");
                    }
                })
                .collect(Collectors.toList());

            BatchPredictionResponse batchResponse = new BatchPredictionResponse(responses);
            span.tag("result", "success");

            return ResponseEntity.ok(batchResponse);

        } catch (Exception e) {
            span.tag("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } finally {
            span.end();
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

// 智能路由器
@Component
@Slf4j
public class InferenceRouter {

    private final LoadBalancer loadBalancer;
    private final ConsistentHashRing hashRing;
    private final InferenceClusterManager clusterManager;
    private final PredictionCache predictionCache;
    private final RouteOptimizer routeOptimizer;

    public InferenceRouter(LoadBalancer loadBalancer,
                          ConsistentHashRing hashRing,
                          InferenceClusterManager clusterManager,
                          PredictionCache predictionCache,
                          RouteOptimizer routeOptimizer) {
        this.loadBalancer = loadBalancer;
        this.hashRing = hashRing;
        this.clusterManager = clusterManager;
        this.predictionCache = predictionCache;
        this.routeOptimizer = routeOptimizer;
    }

    public CompletableFuture<PredictionResponse> routeRequest(RequestContext context,
                                                           PredictionRequest request) {
        // 1. 检查缓存
        String cacheKey = generateCacheKey(context.getModelId(), request);
        PredictionResponse cachedResponse = predictionCache.get(cacheKey);

        if (cachedResponse != null && !request.isNoCache()) {
            log.debug("缓存命中: model={}, cacheKey={}", context.getModelId(), cacheKey);
            return CompletableFuture.completedFuture(cachedResponse);
        }

        // 2. 选择最优路由策略
        RouteStrategy strategy = routeOptimizer.selectStrategy(context, request);

        // 3. 执行路由
        switch (strategy) {
            case CONSISTENT_HASH:
                return routeWithConsistentHash(context, request);
            case LOAD_BALANCED:
                return routeWithLoadBalancing(context, request);
            case GEOGRAPHIC:
                return routeWithGeographicOptimization(context, request);
            case PREDICTIVE:
                return routeWithPredictiveOptimization(context, request);
            default:
                return routeWithLoadBalancing(context, request);
        }
    }

    public List<CompletableFuture<PredictionResponse>> routeBatchRequest(RequestContext context,
                                                                       List<PredictionRequest> requests) {
        // 批量请求优化策略
        BatchOptimizationStrategy batchStrategy = determineBatchStrategy(context, requests);

        switch (batchStrategy) {
            case SINGLE_NODE:
                return routeBatchToSingleNode(context, requests);
            case DISTRIBUTED:
                return routeBatchDistributed(context, requests);
            case HYBRID:
                return routeBatchHybrid(context, requests);
            default:
                return routeBatchDistributed(context, requests);
        }
    }

    private CompletableFuture<PredictionResponse> routeWithConsistentHash(RequestContext context,
                                                                      PredictionRequest request) {
        // 基于模型ID和用户会话的一致性哈希
        String hashKey = context.getModelId() + ":" + context.getSessionId();
        InferenceNode targetNode = hashRing.getNode(hashKey);

        if (targetNode == null || !targetNode.isHealthy()) {
            // 降级到负载均衡
            return routeWithLoadBalancing(context, request);
        }

        return executeInference(targetNode, context, request);
    }

    private CompletableFuture<PredictionResponse> routeWithLoadBalancing(RequestContext context,
                                                                      PredictionRequest request) {
        // 基于节点负载的智能负载均衡
        List<InferenceNode> availableNodes = clusterManager.getHealthyNodes(context.getModelId());

        if (availableNodes.isEmpty()) {
            return CompletableFuture.failedFuture(
                new NoAvailableNodesException("没有可用的推理节点"));
        }

        InferenceNode selectedNode = loadBalancer.selectNode(availableNodes, context, request);
        return executeInference(selectedNode, context, request);
    }

    private CompletableFuture<PredictionResponse> routeWithGeographicOptimization(RequestContext context,
                                                                                PredictionRequest request) {
        // 基于地理位置的路由优化
        InferenceNode nearestNode = clusterManager.getNearestNode(
            context.getClientIp(), context.getModelId()
        );

        if (nearestNode != null && nearestNode.isHealthy()) {
            return executeInference(nearestNode, context, request);
        } else {
            return routeWithLoadBalancing(context, request);
        }
    }

    private CompletableFuture<PredictionResponse> routeWithPredictiveOptimization(RequestContext context,
                                                                               PredictionRequest request) {
        // 基于机器学习的预测路由
        InferenceNode predictedNode = routeOptimizer.predictOptimalNode(context, request);

        if (predictedNode != null && predictedNode.isHealthy()) {
            return executeInference(predictedNode, context, request);
        } else {
            return routeWithLoadBalancing(context, request);
        }
    }

    private List<CompletableFuture<PredictionResponse>> routeBatchToSingleNode(
            RequestContext context, List<PredictionRequest> requests) {

        // 找到负载最轻的节点
        InferenceNode bestNode = clusterManager.getLeastLoadedNode(context.getModelId());

        if (bestNode == null) {
            return requests.stream()
                .map(req -> CompletableFuture.failedFuture<PredictionResponse>(
                    new NoAvailableNodesException("没有可用的推理节点")))
                .collect(Collectors.toList());
        }

        // 批量发送到单个节点
        return Arrays.stream(bestNode.batchInference(context, requests))
            .map(CompletableFuture::completedFuture)
            .collect(Collectors.toList());
    }

    private List<CompletableFuture<PredictionResponse>> routeBatchDistributed(
            RequestContext context, List<PredictionRequest> requests) {

        // 分散到多个节点
        List<InferenceNode> nodes = clusterManager.getHealthyNodes(context.getModelId());

        if (nodes.isEmpty()) {
            return requests.stream()
                .map(req -> CompletableFuture.failedFuture<PredictionResponse>(
                    new NoAvailableNodesException("没有可用的推理节点")))
                .collect(Collectors.toList());
        }

        // 使用轮询分配请求
        List<CompletableFuture<PredictionResponse>> futures = new ArrayList<>();
        AtomicInteger nodeIndex = new AtomicInteger(0);

        for (PredictionRequest request : requests) {
            InferenceNode node = nodes.get(nodeIndex.get() % nodes.size());
            futures.add(executeInference(node, context, request));
            nodeIndex.incrementAndGet();
        }

        return futures;
    }

    private List<CompletableFuture<PredictionResponse>> routeBatchHybrid(
            RequestContext context, List<PredictionRequest> requests) {

        // 混合策略：小批量用单节点，大批量用分布式
        if (requests.size() <= 10) {
            return routeBatchToSingleNode(context, requests);
        } else {
            return routeBatchDistributed(context, requests);
        }
    }

    private CompletableFuture<PredictionResponse> executeInference(InferenceNode node,
                                                                 RequestContext context,
                                                                 PredictionRequest request) {
        Span span = tracer.nextSpan().name("execute-inference");
        try (Tracer.SpanInScope ws = tracer.withSpanInScope(span)) {
            span.tag("node.id", node.getId());
            span.tag("node.region", node.getRegion());

            return node.inferenceAsync(context, request)
                .whenComplete((response, throwable) -> {
                    if (throwable == null) {
                        // 缓存成功的推理结果
                        if (shouldCacheResponse(response)) {
                            String cacheKey = generateCacheKey(context.getModelId(), request);
                            predictionCache.put(cacheKey, response, Duration.ofMinutes(15));
                        }

                        // 更新路由优化器
                        routeOptimizer.recordRoutingSuccess(node, context, request, response);

                        span.tag("result", "success");
                        span.tag("inference.time", String.valueOf(response.getInferenceTime()));
                    } else {
                        // 记录路由失败
                        routeOptimizer.recordRoutingFailure(node, context, request, throwable);

                        span.tag("error", throwable.getMessage());
                    }
                });

        } catch (Exception e) {
            span.tag("error", e.getMessage());
            return CompletableFuture.failedFuture(e);
        } finally {
            span.end();
        }
    }

    private boolean shouldCacheResponse(PredictionResponse response) {
        // 只缓存成功的推理结果
        return response.isSuccess() &&
               response.getInferenceTime() < 5000 && // 推理时间小于5秒
               response.getConfidence() > 0.8;      // 置信度大于80%
    }

    private String generateCacheKey(String modelId, PredictionRequest request) {
        // 生成缓存键，包含模型ID和输入内容的哈希
        String inputHash = DigestUtils.md5Hex(request.getInput().toString());
        return modelId + ":" + inputHash;
    }

    private BatchOptimizationStrategy determineBatchStrategy(RequestContext context,
                                                           List<PredictionRequest> requests) {
        int batchSize = requests.size();
        long totalInputSize = requests.stream()
            .mapToLong(req -> req.getInput().toString().length())
            .sum();

        // 根据批处理大小和输入大小确定策略
        if (batchSize <= 5 && totalInputSize <= 10000) {
            return BatchOptimizationStrategy.SINGLE_NODE;
        } else if (batchSize >= 100 || totalInputSize >= 1000000) {
            return BatchOptimizationStrategy.DISTRIBUTED;
        } else {
            return BatchOptimizationStrategy.HYBRID;
        }
    }
}

// 一致性哈希环
@Component
public class ConsistentHashRing {

    private final TreeMap<Long, InferenceNode> ring = new TreeMap<>();
    private final int virtualNodes = 150; // 虚拟节点数量
    private final InferenceClusterManager clusterManager;

    public ConsistentHashRing(InferenceClusterManager clusterManager) {
        this.clusterManager = clusterManager;
        rebuildRing();
    }

    @Scheduled(fixedRate = 30000) // 每30秒重建一次哈希环
    public void rebuildRing() {
        synchronized (ring) {
            ring.clear();

            List<InferenceNode> nodes = clusterManager.getAllNodes();
            for (InferenceNode node : nodes) {
                addNodeToRing(node);
            }

            log.debug("哈希环重建完成，节点数: {}, 虚拟节点数: {}",
                     nodes.size(), ring.size());
        }
    }

    private void addNodeToRing(InferenceNode node) {
        for (int i = 0; i < virtualNodes; i++) {
            String virtualNodeName = node.getId() + ":" + i;
            long hash = hash(virtualNodeName);
            ring.put(hash, node);
        }
    }

    public InferenceNode getNode(String key) {
        synchronized (ring) {
            if (ring.isEmpty()) {
                return null;
            }

            long hash = hash(key);
            Map.Entry<Long, InferenceNode> entry = ring.ceilingEntry(hash);

            if (entry == null) {
                // 环形查找第一个节点
                entry = ring.firstEntry();
            }

            return entry != null ? entry.getValue() : null;
        }
    }

    private long hash(String key) {
        return Hashing.murmur3_128().hashString(key, StandardCharsets.UTF_8).asLong();
    }

    public Set<InferenceNode> getNodes() {
        synchronized (ring) {
            return new HashSet<>(ring.values());
        }
    }
}

// 路由优化器
@Component
@Slf4j
public class RouteOptimizer {

    private final RoutePredictionModel predictionModel;
    private final RouteHistoryRepository historyRepository;
    private final MetricsCollector metricsCollector;

    public RouteOptimizer(RoutePredictionModel predictionModel,
                         RouteHistoryRepository historyRepository,
                         MetricsCollector metricsCollector) {
        this.predictionModel = predictionModel;
        this.historyRepository = historyRepository;
        this.metricsCollector = metricsCollector;
    }

    public RouteStrategy selectStrategy(RequestContext context, PredictionRequest request) {
        // 基于历史数据预测最优路由策略
        RouteFeatures features = extractFeatures(context, request);
        RoutePrediction prediction = predictionModel.predict(features);

        log.debug("路由策略预测: model={}, strategy={}, confidence={}",
                 context.getModelId(), prediction.getStrategy(), prediction.getConfidence());

        // 如果预测置信度较低，使用默认策略
        if (prediction.getConfidence() < 0.6) {
            return RouteStrategy.LOAD_BALANCED;
        }

        return prediction.getStrategy();
    }

    public InferenceNode predictOptimalNode(RequestContext context, PredictionRequest request) {
        RouteFeatures features = extractFeatures(context, request);
        NodePrediction prediction = predictionModel.predictOptimalNode(features);

        if (prediction.getConfidence() > 0.7) {
            return prediction.getOptimalNode();
        }

        return null; // 置信度不够，使用其他策略
    }

    public void recordRoutingSuccess(InferenceNode node, RequestContext context,
                                   PredictionRequest request, PredictionResponse response) {
        RouteHistory history = RouteHistory.builder()
            .nodeId(node.getId())
            .modelId(context.getModelId())
            .clientIp(context.getClientIp())
            .requestSize(request.getInput().toString().length())
            .responseTime(response.getInferenceTime())
            .success(true)
            .timestamp(LocalDateTime.now())
            .build();

        historyRepository.save(history);

        // 定期重训练预测模型
        if (shouldRetrainModel()) {
            retrainModel();
        }
    }

    public void recordRoutingFailure(InferenceNode node, RequestContext context,
                                   PredictionRequest request, Throwable error) {
        RouteHistory history = RouteHistory.builder()
            .nodeId(node.getId())
            .modelId(context.getModelId())
            .clientIp(context.getClientIp())
            .requestSize(request.getInput().toString().length())
            .responseTime(-1) // 失败
            .success(false)
            .errorType(error.getClass().getSimpleName())
            .timestamp(LocalDateTime.now())
            .build();

        historyRepository.save(history);
    }

    private RouteFeatures extractFeatures(RequestContext context, PredictionRequest request) {
        return RouteFeatures.builder()
            .modelId(context.getModelId())
            .clientRegion(getClientRegion(context.getClientIp()))
            .requestSize(request.getInput().toString().length())
            .priority(context.getPriority())
            .timeOfDay(LocalDateTime.now().getHour())
            .dayOfWeek(LocalDateTime.now().getDayOfWeek().getValue())
            .isBatchMode(context.isBatchMode())
            .build();
    }

    private String getClientRegion(String clientIp) {
        // 简化实现：基于IP段判断地区
        if (clientIp.startsWith("192.168.") || clientIp.startsWith("10.")) {
            return "internal";
        } else if (clientIp.startsWith("223.")) {
            return "beijing";
        } else if (clientIp.startsWith("183.")) {
            return "shanghai";
        } else {
            return "unknown";
        }
    }

    private boolean shouldRetrainModel() {
        // 每小时或者收集了1000条新数据时重训练
        long recentCount = historyRepository.countRecentRecords(Duration.ofHours(1));
        return recentCount >= 1000;
    }

    private void retrainModel() {
        CompletableFuture.runAsync(() -> {
            try {
                log.info("开始重训练路由预测模型");
                List<RouteHistory> historyData = historyRepository.getRecentRecords(Duration.ofDays(7));
                predictionModel.train(historyData);
                log.info("路由预测模型重训练完成");
            } catch (Exception e) {
                log.error("路由预测模型重训练失败", e);
            }
        });
    }
}

public enum RouteStrategy {
    CONSISTENT_HASH,    // 一致性哈希
    LOAD_BALANCED,     // 负载均衡
    GEOGRAPHIC,        // 地理优化
    PREDICTIVE         // 预测优化
}

public enum BatchOptimizationStrategy {
    SINGLE_NODE,      // 单节点处理
    DISTRIBUTED,      // 分布式处理
    HYBRID           // 混合策略
}
```

---

**总结**: 基于Spring Cloud的AI微服务架构设计需要综合考虑服务治理、弹性设计、智能路由和分布式协调等多个方面。通过实现自适应熔断、智能重试、故障隔离和自愈机制，可以构建出高可用、高性能的AI微服务系统。关键在于合理运用微服务设计模式，并结合AI系统的特点进行优化。