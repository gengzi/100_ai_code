# Java AI微服务架构与API网关设计

## 🎯 学习目标

- 掌握AI微服务架构设计原则
- 学习API网关在AI服务中的应用
- 掌握服务发现和负载均衡策略
- 了解AI服务的流量管理和监控
- 学习高可用AI微服务部署模式

---

## 📚 核心面试题

### 1. AI微服务架构设计

#### 面试题1：如何设计一个高可用的AI微服务架构？

**考察要点**：
- 微服务拆分策略
- 服务间通信机制
- 数据一致性和容错设计

**参考答案**：

```java
@Service
public class AIMicroserviceArchitecture {

    private final ServiceRegistry serviceRegistry;
    private final LoadBalancer loadBalancer;
    private final CircuitBreaker circuitBreaker;

    /**
     * AI微服务架构核心组件
     */
    @Component
    public static class AIServiceOrchestrator {

        /**
         * 智能服务编排
         */
        public CompletableFuture<ServiceResponse> orchestrateAIServices(
                ServiceRequest request) {

            // 1. 服务依赖分析
            ServiceDependencyGraph dependencyGraph = analyzeDependencies(request);

            // 2. 服务调度策略
            ServiceExecutionPlan plan = createExecutionPlan(dependencyGraph, request);

            // 3. 并行服务执行
            List<CompletableFuture<ServiceResult>> futures = plan.getExecutionStages()
                .stream()
                .map(stage -> executeServiceStage(stage))
                .collect(Collectors.toList());

            // 4. 结果聚合
            return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
                .thenApply(v -> aggregateResults(futures, plan));
        }

        private ServiceExecutionPlan createExecutionPlan(
                ServiceDependencyGraph graph,
                ServiceRequest request) {

            ServiceExecutionPlan plan = new ServiceExecutionPlan();

            // 1. 数据预处理服务
            plan.addStage(ExecutionStage.builder()
                .serviceName("data-preprocessing")
                .parallel(false)
                .timeout(Duration.ofSeconds(10))
                .build());

            // 2. 模型推理服务（可并行）
            if (request.requiresMultipleModels()) {
                plan.addStage(ExecutionStage.builder()
                    .serviceName("model-inference-a")
                    .parallel(true)
                    .timeout(Duration.ofSeconds(30))
                    .build());

                plan.addStage(ExecutionStage.builder()
                    .serviceName("model-inference-b")
                    .parallel(true)
                    .timeout(Duration.ofSeconds(30))
                    .build());
            }

            // 3. 结果融合服务
            plan.addStage(ExecutionStage.builder()
                .serviceName("result-fusion")
                .parallel(false)
                .timeout(Duration.ofSeconds(5))
                .build());

            // 4. 后处理服务
            plan.addStage(ExecutionStage.builder()
                .serviceName("post-processing")
                .parallel(false)
                .timeout(Duration.ofSeconds(10))
                .build());

            return plan;
        }

        private CompletableFuture<ServiceResult> executeServiceStage(ExecutionStage stage) {
            return CompletableFuture.supplyAsync(() -> {
                try {
                    // 1. 服务发现
                    List<ServiceInstance> instances = serviceRegistry.getInstances(
                        stage.getServiceName());

                    if (instances.isEmpty()) {
                        throw new ServiceUnavailableException(
                            "No instances available for service: " + stage.getServiceName());
                    }

                    // 2. 负载均衡选择实例
                    ServiceInstance selectedInstance = loadBalancer.select(instances);

                    // 3. 熔断器包装调用
                    return circuitBreaker.executeSupplier(() -> {
                        return callRemoteService(selectedInstance, stage);
                    });

                } catch (Exception e) {
                    throw new ServiceException("Service execution failed", e);
                }
            });
        }
    }

    /**
     * AI模型服务抽象
     */
    @RestController
    @RequestMapping("/api/ai/model")
    public abstract class AbstractModelService {

        @Autowired
        protected ModelManager modelManager;

        @Autowired
        protected MetricsCollector metricsCollector;

        /**
         * 模型推理端点
         */
        @PostMapping("/predict")
        public ResponseEntity<PredictionResponse> predict(@RequestBody PredictionRequest request) {
            long startTime = System.nanoTime();

            try {
                // 1. 请求验证
                validateRequest(request);

                // 2. 模型加载
                Model model = modelManager.getModel(request.getModelId());

                // 3. 推理执行
                PredictionResult result = executePrediction(model, request);

                // 4. 性能指标记录
                long latency = (System.nanoTime() - startTime) / 1_000_000;
                metricsCollector.recordInferenceLatency(model.getModelId(), latency);
                metricsCollector.recordInferenceSuccess(model.getModelId());

                return ResponseEntity.ok(PredictionResponse.builder()
                    .result(result)
                    .latencyMs(latency)
                    .modelVersion(model.getVersion())
                    .timestamp(Instant.now())
                    .build());

            } catch (Exception e) {
                metricsCollector.recordInferenceFailure(request.getModelId());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(PredictionResponse.builder()
                        .error(e.getMessage())
                        .timestamp(Instant.now())
                        .build());
            }
        }

        protected abstract PredictionResult executePrediction(Model model, PredictionRequest request);
    }

    /**
     * 数据预处理服务
     */
    @RestController
    @RequestMapping("/api/ai/preprocessing")
    public class DataPreprocessingService {

        @Autowired
        private PreprocessingPipeline preprocessingPipeline;

        @Autowired
        private CacheManager cacheManager;

        /**
         * 批量数据预处理
         */
        @PostMapping("/batch")
        public CompletableFuture<BatchPreprocessingResult> batchPreprocess(
                @RequestBody BatchPreprocessingRequest request) {

            return CompletableFuture.supplyAsync(() -> {
                // 1. 缓存检查
                String cacheKey = generateCacheKey(request);
                BatchPreprocessingResult cached = cacheManager.get(cacheKey, BatchPreprocessingResult.class);
                if (cached != null) {
                    return cached;
                }

                // 2. 分批并行处理
                int batchSize = calculateOptimalBatchSize(request.getDataSize());
                List<CompletableFuture<PreprocessedData>> futures = IntStream.range(0, request.getDataSize())
                    .boxed()
                    .collect(Collectors.groupingBy(i -> i / batchSize))
                    .values()
                    .stream()
                    .map(batch -> CompletableFuture.supplyAsync(() -> {
                        List<DataSample> samples = batch.stream()
                            .map(request::getSample)
                            .collect(Collectors.toList());
                        return preprocessingPipeline.processBatch(samples);
                    }))
                    .collect(Collectors.toList());

                // 3. 结果合并
                List<PreprocessedData> results = futures.stream()
                    .map(CompletableFuture::join)
                    .flatMap(List::stream)
                    .collect(Collectors.toList());

                BatchPreprocessingResult result = new BatchPreprocessingResult(results);

                // 4. 缓存结果
                cacheManager.put(cacheKey, result);

                return result;
            });
        }

        /**
         * 实时流式预处理
         */
        @PostMapping("/stream")
        public Flux<PreprocessedData> streamPreprocess(
                @RequestBody Flux<RawData> dataStream) {

            return dataStream
                .onBackpressureBuffer()
                .flatMap(rawData -> Mono.fromCallable(() -> {
                    try {
                        return preprocessingPipeline.process(rawData);
                    } catch (Exception e) {
                        log.error("Stream preprocessing failed for data: {}", rawData, e);
                        return null;
                    }
                }))
                .filter(Objects::nonNull)
                .subscribeOn(Schedulers.parallel());
        }
    }
}
```

**技术要点**：
- 服务编排和依赖管理
- 异步并行执行
- 缓存优化策略
- 流式处理支持

---

### 2. API网关设计

#### 面试题2：如何设计一个专门用于AI服务的API网关？

**考察要点**：
- 请求路由和负载均衡
- 流量控制和限流
- AI服务的特殊需求处理

**参考答案**：

```java
@Component
public class AIAPIGateway {

    private final RouteLocator routeLocator;
    private final RateLimiter rateLimiter;
    private final LoadBalancer loadBalancer;
    private final RequestTransformer requestTransformer;

    /**
     * AI服务路由配置
     */
    @Bean
    public RouteLocator aiServiceRoutes(RouteLocatorBuilder builder) {
        return builder.routes()
            // 模型推理服务路由
            .route("model-inference", r -> r
                .path("/api/ai/inference/**")
                .and()
                .method(HttpMethod.POST)
                .filters(f -> f
                    .stripPrefix(2)
                    .addRequestHeader("X-Gateway-Request-Time", Instant.now().toString())
                    .requestRateLimiter(config -> config
                        .setRateLimiter(redisRateLimiter())
                        .setKeyResolver(userKeyResolver()))
                    .circuitBreaker(config -> config
                        .setName("inference-circuit-breaker")
                        .setFallbackUri("forward:/fallback/inference"))
                    .retry(retryConfig -> retryConfig
                        .setRetries(3)
                        .setBackoff(Duration.ofSeconds(1), Duration.ofSeconds(5)))
                )
                .uri("lb://model-inference-service")
            )

            // 数据预处理服务路由
            .route("data-preprocessing", r -> r
                .path("/api/ai/preprocess/**")
                .and()
                .method(HttpMethod.POST)
                .filters(f -> f
                    .stripPrefix(2)
                    .modifyRequestBody(this::transformPreprocessingRequest)
                    .filter(new RequestValidationFilter())
                    .filter(new DataSizeFilter())
                )
                .uri("lb://preprocessing-service")
            )

            // 模型管理服务路由
            .route("model-management", r -> r
                .path("/api/ai/models/**")
                .filters(f -> f
                    .stripPrefix(2)
                    .addResponseHeader("X-Model-Version", "${model.version}")
                    .filter(new AuthenticationFilter())
                )
                .uri("lb://model-management-service")
            )

            // 监控和健康检查路由
            .route("monitoring", r -> r
                .path("/api/ai/health/**")
                .filters(f -> f
                    .stripPrefix(2)
                    .setPath("/actuator/health")
                )
                .uri("lb://discovery-server")
            )
            .build();
    }

    /**
     * AI服务专用负载均衡策略
     */
    @Component
    public static class AIServiceLoadBalancer {

        private final ServiceMetricsCollector metricsCollector;

        /**
         * 基于模型性能的负载均衡
         */
        public ServiceInstance selectForModelInference(List<ServiceInstance> instances,
                                                     String modelId) {
            return instances.stream()
                .min(Comparator.comparingDouble(instance -> {
                    // 1. 获取实例性能指标
                    ServiceMetrics metrics = metricsCollector.getMetrics(instance.getId());

                    // 2. 计算综合得分
                    double latencyScore = normalizeScore(metrics.getAverageLatency(), 0, 1000);
                    double throughputScore = normalizeScore(metrics.getThroughput(), 0, 1000);
                    double errorRateScore = normalizeScore(metrics.getErrorRate(), 0, 10);
                    double cpuScore = normalizeScore(metrics.getCpuUtilization(), 0, 100);
                    double memoryScore = normalizeScore(metrics.getMemoryUtilization(), 0, 100);

                    // 3. 权重计算
                    double totalScore = latencyScore * 0.3 +
                                       throughputScore * 0.2 +
                                       errorRateScore * 0.2 +
                                       cpuScore * 0.15 +
                                       memoryScore * 0.15;

                    return totalScore;
                }))
                .orElseThrow(() -> new NoAvailableServiceException("No suitable service instance found"));
        }

        /**
         * 基于GPU可用性的负载均衡
         */
        public ServiceInstance selectForGPUInference(List<ServiceInstance> instances) {
            return instances.stream()
                .filter(instance -> hasGPUAvailable(instance))
                .min(Comparator.comparingDouble(instance -> {
                    ServiceMetrics metrics = metricsCollector.getMetrics(instance.getId());
                    return metrics.getGpuUtilization();
                }))
                .orElseThrow(() -> new NoAvailableServiceException("No GPU-enabled service instance found"));
        }

        /**
         * 基于地理位置的负载均衡
         */
        public ServiceInstance selectByGeography(List<ServiceInstance> instances,
                                               ClientLocation clientLocation) {
            return instances.stream()
                .min(Comparator.comparingDouble(instance -> {
                    ServerLocation serverLocation = getLocation(instance);
                    return calculateDistance(clientLocation, serverLocation);
                }))
                .orElse(instances.get(0));
        }

        private double normalizeScore(double value, double min, double max) {
            return (value - min) / (max - min);
        }
    }

    /**
     * AI服务限流策略
     */
    @Component
    public static class AIRateLimiter {

        private final Map<String, RateLimiter> rateLimiters;
        private final RedisTemplate<String, String> redisTemplate;

        /**
         * 基于用户等级的限流
         */
        public boolean isAllowed(String userId, String serviceType, UserTier userTier) {
            String key = "rate_limit:" + serviceType + ":" + userId;

            RateLimitConfig config = getRateLimitConfig(userTier, serviceType);

            // 使用Redis实现分布式限流
            String currentCount = redisTemplate.opsForValue().get(key);

            if (currentCount == null) {
                // 首次请求，初始化计数器
                redisTemplate.opsForValue().set(key, "1", config.getTimeWindow());
                return true;
            } else {
                int count = Integer.parseInt(currentCount);
                if (count < config.getMaxRequests()) {
                    // 增加计数
                    redisTemplate.opsForValue().increment(key);
                    return true;
                } else {
                    // 超过限制
                    return false;
                }
            }
        }

        /**
         * 基于模型复杂度的动态限流
         */
        public boolean isAllowedForModel(String userId, String modelId, ModelComplexity complexity) {
            int baseLimit = getBaseLimit(userId);
            double complexityFactor = getComplexityFactor(complexity);
            int dynamicLimit = (int) (baseLimit / complexityFactor);

            return checkUserLimit(userId, modelId, dynamicLimit);
        }

        private RateLimitConfig getRateLimitConfig(UserTier userTier, String serviceType) {
            switch (userTier) {
                case FREE:
                    return RateLimitConfig.builder()
                        .maxRequests(100)
                        .timeWindow(Duration.ofHours(1))
                        .build();
                case PROFESSIONAL:
                    return RateLimitConfig.builder()
                        .maxRequests(1000)
                        .timeWindow(Duration.ofHours(1))
                        .build();
                case ENTERPRISE:
                    return RateLimitConfig.builder()
                        .maxRequests(10000)
                        .timeWindow(Duration.ofHours(1))
                        .build();
                default:
                    return RateLimitConfig.builder()
                        .maxRequests(50)
                        .timeWindow(Duration.ofHours(1))
                        .build();
            }
        }
    }

    /**
     * AI请求转换器
     */
    @Component
    public static class AIRequestTransformer {

        /**
         * 模型推理请求转换
         */
        public Mono<ServerHttpRequest> transformInferenceRequest(
                ServerWebExchange exchange,
                ServerHttpRequest request) {

            return Mono.just(request)
                .flatMap(req -> {
                    // 1. 添加认证头
                    ServerHttpRequest.Builder builder = req.mutate()
                        .header("X-Request-ID", generateRequestId())
                        .header("X-Timestamp", Instant.now().toString());

                    // 2. 添加用户上下文
                    UserContext userContext = getUserContext(exchange);
                    if (userContext != null) {
                        builder.header("X-User-ID", userContext.getUserId())
                              .header("X-User-Tier", userContext.getTier().name());
                    }

                    // 3. 添加模型版本信息
                    String modelVersion = extractModelVersion(request);
                    if (modelVersion != null) {
                        builder.header("X-Model-Version", modelVersion);
                    }

                    // 4. 添加性能要求
                    PerformanceRequirement perfReq = extractPerformanceRequirement(request);
                    if (perfReq != null) {
                        builder.header("X-Max-Latency", String.valueOf(perfReq.getMaxLatencyMs()))
                              .header("X-Priority", perfReq.getPriority().name());
                    }

                    return Mono.just(builder.build());
                });
        }

        /**
         * 数据预处理请求优化
         */
        private Mono<ServerHttpRequest> transformPreprocessingRequest(
                ServerWebExchange exchange,
                ServerHttpRequest request) {

            // 1. 检查数据大小并优化
            long dataSize = getContentLength(request);
            if (dataSize > MAX_REQUEST_SIZE) {
                return Mono.error(new RequestSizeExceededException("Request size too large"));
            }

            // 2. 添加压缩头
            return Mono.just(request.mutate()
                .header("Accept-Encoding", "gzip, deflate")
                .header("Content-Encoding", "gzip")
                .build());
        }
    }
}
```

**技术要点**：
- 智能路由策略
- 多维度限流机制
- 请求转换和优化
- 分布式负载均衡

---

### 3. 服务发现与注册

#### 面试题3：如何在AI微服务架构中实现高效的服务发现？

**考察要点**：
- 服务注册中心设计
- 健康检查机制
- 服务版本管理

**参考答案**：

```java
@Service
public class AIServiceDiscovery {

    private final ServiceRegistry serviceRegistry;
    private final HealthChecker healthChecker;
    private final VersionManager versionManager;

    /**
     * AI服务注册器
     */
    @Component
    public static class AIServiceRegistry {

        private final ConsulClient consulClient;
        private final Map<String, ServiceMetadata> registeredServices;

        /**
         * 注册AI服务
         */
        public RegistrationResult registerAIService(AIServiceConfig config) {
            try {
                // 1. 服务健康检查配置
                HealthCheckConfig healthCheck = HealthCheckConfig.builder()
                    .http(config.getHealthCheckUrl())
                    .interval("10s")
                    .timeout("3s")
                    .deregisterCriticalServiceAfter("30s")
                    .build();

                // 2. AI服务元数据
                Map<String, String> metadata = new HashMap<>();
                metadata.put("service-type", "ai-service");
                metadata.put("model-id", config.getModelId());
                metadata.put("model-version", config.getModelVersion());
                metadata.put("hardware-type", config.getHardwareType());
                metadata.put("gpu-available", String.valueOf(config.isGpuAvailable()));
                metadata.put("max-concurrent-requests", String.valueOf(config.getMaxConcurrentRequests()));
                metadata.put("average-latency", String.valueOf(config.getAverageLatency()));

                // 3. 服务注册
                NewService service = NewService.builder()
                    .id(config.getServiceId())
                    .name(config.getServiceName())
                    .address(config.getHost())
                    .port(config.getPort())
                    .healthCheck(healthCheck)
                    .meta(metadata)
                    .tags(buildServiceTags(config))
                    .build();

                consulClient.agentServiceRegister(service);

                // 4. 本地缓存注册信息
                ServiceMetadata serviceMetadata = new ServiceMetadata(config, metadata);
                registeredServices.put(config.getServiceId(), serviceMetadata);

                return RegistrationResult.success(config.getServiceId());

            } catch (Exception e) {
                log.error("Failed to register AI service: {}", config.getServiceId(), e);
                return RegistrationResult.failure(e.getMessage());
            }
        }

        /**
         * 服务发现（带AI特性）
         */
        public List<ServiceInstance> discoverAIServices(ServiceQuery query) {
            try {
                // 1. 基础服务查询
                GetConsulServiceRequest request = GetConsulServiceRequest.builder()
                    .serviceName(query.getServiceName())
                    .tag(query.getServiceType())
                    .build();

                List<GetConsulServiceResponse> services = consulClient.getConsulService(request);

                // 2. AI服务过滤
                List<ServiceInstance> filteredServices = services.stream()
                    .filter(service -> matchesAIRequirements(service, query))
                    .map(this::convertToServiceInstance)
                    .collect(Collectors.toList());

                // 3. 排序和优化
                return sortAndOptimizeServices(filteredServices, query);

            } catch (Exception e) {
                log.error("Failed to discover AI services", e);
                return Collections.emptyList();
            }
        }

        private boolean matchesAIRequirements(GetConsulServiceResponse service, ServiceQuery query) {
            Map<String, String> metadata = service.getService().getMeta();

            // 1. 模型要求检查
            if (query.getRequiredModelId() != null &&
                !query.getRequiredModelId().equals(metadata.get("model-id"))) {
                return false;
            }

            // 2. 硬件要求检查
            if (query.isGpuRequired() &&
                !Boolean.parseBoolean(metadata.getOrDefault("gpu-available", "false"))) {
                return false;
            }

            // 3. 性能要求检查
            double avgLatency = Double.parseDouble(
                metadata.getOrDefault("average-latency", "1000"));
            if (query.getMaxAcceptableLatency() > 0 &&
                avgLatency > query.getMaxAcceptableLatency()) {
                return false;
            }

            // 4. 容量要求检查
            int maxConcurrent = Integer.parseInt(
                metadata.getOrDefault("max-concurrent-requests", "10"));
            if (query.getMinConcurrentCapacity() > maxConcurrent) {
                return false;
            }

            return true;
        }

        private List<String> buildServiceTags(AIServiceConfig config) {
            List<String> tags = new ArrayList<>();
            tags.add("ai-service");
            tags.add("model-" + config.getModelId());
            tags.add("version-" + config.getModelVersion());

            if (config.isGpuAvailable()) {
                tags.add("gpu-enabled");
            }

            if (config.isProductionReady()) {
                tags.add("production");
            } else {
                tags.add("development");
            }

            return tags;
        }
    }

    /**
     * AI服务健康检查器
     */
    @Component
    public static class AIHealthChecker {

        private final HealthCheckExecutor healthCheckExecutor;
        private final CircuitBreakerRegistry circuitBreakerRegistry;

        /**
         * 综合健康检查
         */
        public HealthStatus performAIHealthCheck(String serviceId) {
            try {
                HealthStatus status = new HealthStatus();

                // 1. 基础连接检查
                ConnectivityStatus connectivity = checkConnectivity(serviceId);
                status.setConnectivity(connectivity);

                // 2. 模型加载状态检查
                ModelStatus modelStatus = checkModelStatus(serviceId);
                status.setModelStatus(modelStatus);

                // 3. GPU状态检查
                GPUStatus gpuStatus = checkGPUStatus(serviceId);
                status.setGpuStatus(gpuStatus);

                // 4. 性能指标检查
                PerformanceMetrics performance = checkPerformanceMetrics(serviceId);
                status.setPerformanceMetrics(performance);

                // 5. 内存使用检查
                MemoryStatus memoryStatus = checkMemoryUsage(serviceId);
                status.setMemoryStatus(memoryStatus);

                // 6. 综合健康评估
                boolean isHealthy = evaluateOverallHealth(status);
                status.setHealthy(isHealth);
                status.setLastChecked(Instant.now());

                return status;

            } catch (Exception e) {
                log.error("Health check failed for service: {}", serviceId, e);
                return HealthStatus.unhealthy(e.getMessage());
            }
        }

        /**
         * 模型推理性能检查
         */
        private PerformanceMetrics checkPerformanceMetrics(String serviceId) {
            PerformanceMetrics metrics = new PerformanceMetrics();

            try {
                // 1. 发送测试推理请求
                TestInferenceRequest testRequest = createTestInferenceRequest();
                long startTime = System.nanoTime();

                TestInferenceResponse response = sendTestInference(serviceId, testRequest);

                long latency = (System.nanoTime() - startTime) / 1_000_000;
                metrics.setTestLatency(latency);

                // 2. 吞吐量测试
                ThroughputTestResult throughputTest = performThroughputTest(serviceId);
                metrics.setThroughput(throughputTest.getRequestsPerSecond());

                // 3. 准确性验证
                AccuracyTestResult accuracyTest = performAccuracyTest(serviceId);
                metrics.setAccuracy(accuracyTest.getAccuracyScore());

                // 4. 并发能力测试
                ConcurrencyTestResult concurrencyTest = performConcurrencyTest(serviceId);
                metrics.setMaxConcurrentRequests(concurrencyTest.getMaxSuccessfulRequests());

            } catch (Exception e) {
                metrics.setError(e.getMessage());
            }

            return metrics;
        }

        /**
         * 预测性健康检查
         */
        @Scheduled(fixedRate = 60000) // 每分钟执行
        public void predictiveHealthMonitoring() {
            List<String> allServices = getAllRegisteredAIServices();

            for (String serviceId : allServices) {
                try {
                    // 1. 获取历史健康数据
                    List<HealthStatus> historicalData = getHealthHistory(serviceId);

                    if (historicalData.size() >= 10) {
                        // 2. 趋势分析
                        HealthTrend trend = analyzeHealthTrend(historicalData);

                        // 3. 预测性分析
                        PredictionResult prediction = predictFutureHealth(trend);

                        // 4. 预防性措施
                        if (prediction.getFailureProbability() > 0.7) {
                            takePreventiveMeasures(serviceId, prediction);
                        }

                        // 5. 更新服务权重
                        updateServiceWeight(serviceId, prediction);
                    }

                } catch (Exception e) {
                    log.error("Predictive health monitoring failed for service: {}", serviceId, e);
                }
            }
        }
    }

    /**
     * 版本管理器
     */
    @Component
    public static class AIModelVersionManager {

        private final VersionRegistry versionRegistry;
        private final DeploymentManager deploymentManager;

        /**
         * 模型版本策略
         */
        public VersionStrategy determineVersionStrategy(ModelVersion version,
                                                      List<ServiceInstance> instances) {
            VersionStrategy strategy = new VersionStrategy();

            // 1. 分析版本分布
            Map<String, Integer> versionDistribution = analyzeVersionDistribution(instances);

            // 2. 蓝绿部署策略
            if (version.isStable() && versionDistribution.size() <= 2) {
                strategy.setDeploymentType(DeploymentType.BLUE_GREEN);
                strategy.setTrafficSplit(versionDistribution);
            }
            // 3. 金丝雀部署策略
            else if (version.isCanary()) {
                strategy.setDeploymentType(DeploymentType.CANARY);
                strategy.setCanaryTrafficPercentage(10); // 10%流量到新版本
            }
            // 4. A/B测试策略
            else if (version.isABTest()) {
                strategy.setDeploymentType(DeploymentType.AB_TEST);
                strategy.setTrafficSplit(calculateABTestSplit(instances));
            }
            // 5. 渐进式部署策略
            else {
                strategy.setDeploymentType(DeploymentType.GRADUAL);
                strategy.setGradualDeploymentPlan(createGradualPlan(version));
            }

            return strategy;
        }

        /**
         * 智能版本回滚
         */
        public RollbackDecision evaluateRollbackNeed(String serviceId, ModelVersion currentVersion) {
            RollbackDecision decision = new RollbackDecision();

            try {
                // 1. 性能指标对比
                PerformanceComparison perfComparison = comparePerformanceWithPrevious(
                    serviceId, currentVersion);

                // 2. 错误率分析
                ErrorRateAnalysis errorAnalysis = analyzeErrorRate(serviceId, currentVersion);

                // 3. 用户反馈分析
                UserFeedbackAnalysis feedbackAnalysis = analyzeUserFeedback(currentVersion);

                // 4. 综合评估
                double rollbackScore = calculateRollbackScore(
                    perfComparison, errorAnalysis, feedbackAnalysis);

                decision.setShouldRollback(rollbackScore > 0.7);
                decision.setConfidence(rollbackScore);
                decision.setReasons(buildRollbackReasons(perfComparison, errorAnalysis, feedbackAnalysis));

                // 5. 如果需要回滚，确定目标版本
                if (decision.isShouldRollback()) {
                    ModelVersion targetVersion = selectStableVersion(serviceId);
                    decision.setTargetVersion(targetVersion);
                }

            } catch (Exception e) {
                log.error("Rollback evaluation failed for service: {}", serviceId, e);
                decision.setShouldRollback(true); // 安全起见，回滚
                decision.setReason("Evaluation failed due to error: " + e.getMessage());
            }

            return decision;
        }
    }
}
```

**技术要点**：
- AI服务元数据管理
- 多维度健康检查
- 预测性维护
- 版本管理策略

---

### 4. 流量管理和监控

#### 面试题4：如何实现AI服务的智能流量管理和监控？

**考察要点**：
- 流量分配策略
- 实时监控系统
- 性能优化和自动扩缩容

**参考答案**：

```java
@Service
public class AITrafficManager {

    private final TrafficAnalyzer trafficAnalyzer;
    private final AutoScaler autoScaler;
    private final MetricsCollector metricsCollector;

    /**
     * 智能流量分配器
     */
    @Component
    public static class IntelligentTrafficDistributor {

        private final TrafficPredictor trafficPredictor;
        private final LoadBalancingStrategy loadBalancingStrategy;

        /**
         * 基于AI预测的流量分配
         */
        public TrafficDistributionPlan createTrafficDistributionPlan(
                List<ServiceInstance> instances,
                TrafficPattern pattern) {

            TrafficDistributionPlan plan = new TrafficDistributionPlan();

            // 1. 流量预测
            TrafficPrediction prediction = trafficPredictor.predictTraffic(pattern);

            // 2. 容力分析
            List<ServiceCapacity> capacities = analyzeServiceCapacity(instances);

            // 3. 流量分配算法
            Map<String, Double> trafficWeights = calculateTrafficWeights(
                prediction, capacities, pattern.getRequirements());

            // 4. 动态调整策略
            if (prediction.isExpectedToExceedCapacity()) {
                // 触发扩容
                triggerScalingEvent(prediction, capacities);

                // 重新分配流量
                trafficWeights = redistributeTrafficAfterScaling(trafficWeights);
            }

            plan.setTrafficWeights(trafficWeights);
            plan.setPrediction(prediction);
            plan.setCapacities(capacities);
            plan.setExecutionTime(Instant.now());

            return plan;
        }

        /**
         * 基于模型复杂度的流量路由
         */
        public ServiceInstance routeByComplexity(List<ServiceInstance> instances,
                                               ModelComplexity complexity) {
            return instances.stream()
                .filter(instance -> canHandleComplexity(instance, complexity))
                .min(Comparator.comparingDouble(instance -> {
                    // 综合考虑负载、延迟和GPU可用性
                    double loadFactor = instance.getCurrentLoad() / instance.getMaxCapacity();
                    double latencyFactor = instance.getAverageLatency() / 1000.0;
                    double gpuFactor = instance.isGpuAvailable() ? 0.1 : 1.0;

                    return loadFactor * 0.4 + latencyFactor * 0.4 + gpuFactor * 0.2;
                }))
                .orElse(instances.get(0));
        }

        private Map<String, Double> calculateTrafficWeights(
                TrafficPrediction prediction,
                List<ServiceCapacity> capacities,
                TrafficRequirements requirements) {

            Map<String, Double> weights = new HashMap<>();
            double totalCapacity = capacities.stream()
                .mapToDouble(ServiceCapacity::getEffectiveCapacity)
                .sum();

            // 基于容量比例分配基础权重
            for (ServiceCapacity capacity : capacities) {
                String instanceId = capacity.getInstanceId();
                double baseWeight = capacity.getEffectiveCapacity() / totalCapacity;

                // 考虑服务质量调整
                double qualityFactor = calculateQualityFactor(capacity);

                // 考虑成本因素
                double costFactor = calculateCostFactor(capacity);

                double finalWeight = baseWeight * qualityFactor * costFactor;
                weights.put(instanceId, finalWeight);
            }

            // 归一化权重
            double weightSum = weights.values().stream().mapToDouble(Double::doubleValue).sum();
            weights.replaceAll((k, v) -> v / weightSum);

            return weights;
        }
    }

    /**
     * AI服务监控系统
     */
    @Component
    public static class AIMetricsCollector {

        private final MeterRegistry meterRegistry;
        private final InfluxDBClient influxDBClient;

        /**
         * 收集AI服务指标
         */
        @EventListener
        public void collectAIServiceMetrics(AIServiceEvent event) {
            try {
                // 1. 基础性能指标
                recordBasicMetrics(event);

                // 2. AI特定指标
                recordAIMetrics(event);

                // 3. 业务指标
                recordBusinessMetrics(event);

                // 4. 发送到时序数据库
                sendToTimeSeriesDB(event);

                // 5. 实时告警检查
                checkAlerts(event);

            } catch (Exception e) {
                log.error("Failed to collect AI service metrics", e);
            }
        }

        private void recordAIMetrics(AIServiceEvent event) {
            // 1. 推理延迟分布
            Timer.Sample sample = Timer.start(meterRegistry);
            sample.stop(Timer.builder("ai.inference.latency")
                .tag("model", event.getModelId())
                .tag("version", event.getModelVersion())
                .register(meterRegistry));

            // 2. 模型精度指标
            Gauge.builder("ai.model.accuracy")
                .tag("model", event.getModelId())
                .register(meterRegistry, event, e -> e.getAccuracy());

            // 3. GPU利用率
            if (event.isGpuUsed()) {
                Gauge.builder("ai.gpu.utilization")
                    .tag("device", event.getGpuDeviceId())
                    .register(meterRegistry, event, e -> e.getGpuUtilization());

                Gauge.builder("ai.gpu.memory.usage")
                    .tag("device", event.getGpuDeviceId())
                    .register(meterRegistry, event, e -> e.getGpuMemoryUsage());
            }

            // 4. 数据吞吐量
            Counter.builder("ai.data.processed")
                .tag("model", event.getModelId())
                .register(meterRegistry)
                .increment(event.getDataProcessed());

            // 5. 错误类型统计
            if (event.hasError()) {
                Counter.builder("ai.errors")
                    .tag("model", event.getModelId())
                    .tag("error_type", event.getErrorType())
                    .register(meterRegistry)
                    .increment();
            }
        }

        /**
         * 实时仪表板数据
         */
        @GetMapping("/api/monitoring/dashboard")
        public DashboardData getDashboardData() {
            DashboardData data = new DashboardData();

            // 1. 实时请求量
            data.setRequestRate(getCurrentRequestRate());

            // 2. 平均延迟
            data.setAverageLatency(getAverageLatency());

            // 3. 错误率
            data.setErrorRate(getCurrentErrorRate());

            // 4. 活跃模型统计
            data.setActiveModels(getActiveModelsCount());

            // 5. GPU使用情况
            data.setGpuUtilization(getGpuUtilizationStats());

            // 6. 热点模型排行
            data.setTopModels(getTopModelsByUsage());

            // 7. 性能趋势
            data.setPerformanceTrends(getPerformanceTrends());

            return data;
        }
    }

    /**
     * 自动扩缩容管理器
     */
    @Component
    public static class AIAutoScaler {

        private final ScalingPolicyManager policyManager;
        private final ResourceManager resourceManager;

        /**
         * 智能扩缩容决策
         */
        @Scheduled(fixedRate = 30000) // 每30秒检查一次
        public void evaluateScalingNeeds() {
            List<ServiceGroup> serviceGroups = getAllServiceGroups();

            for (ServiceGroup group : serviceGroups) {
                try {
                    // 1. 收集指标
                    ScalingMetrics metrics = collectScalingMetrics(group);

                    // 2. 负载预测
                    LoadForecast forecast = predictLoad(group, metrics);

                    // 3. 扩缩容决策
                    ScalingDecision decision = makeScalingDecision(group, metrics, forecast);

                    // 4. 执行扩缩容
                    if (decision.needsAction()) {
                        executeScalingAction(decision);
                    }

                    // 5. 记录决策
                    logScalingDecision(decision);

                } catch (Exception e) {
                    log.error("Auto-scaling evaluation failed for group: {}", group.getId(), e);
                }
            }
        }

        private ScalingDecision makeScalingDecision(ServiceGroup group,
                                                 ScalingMetrics metrics,
                                                 LoadForecast forecast) {
            ScalingDecision decision = new ScalingDecision();

            ScalingPolicy policy = policyManager.getPolicy(group.getId());

            // 1. 基于当前负载的决策
            double currentCpuUsage = metrics.getCpuUsage();
            double currentMemoryUsage = metrics.getMemoryUsage();
            int currentInstances = group.getCurrentInstanceCount();

            if (currentCpuUsage > policy.getCpuScaleUpThreshold() ||
                currentMemoryUsage > policy.getMemoryScaleUpThreshold()) {
                // 需要扩容
                int scaleUpCount = calculateScaleUpCount(metrics, policy);
                decision.setAction(ScalingAction.SCALE_UP);
                decision.setTargetInstanceCount(currentInstances + scaleUpCount);
                decision.setReason("High resource usage");
            } else if (currentCpuUsage < policy.getCpuScaleDownThreshold() &&
                       currentMemoryUsage < policy.getMemoryScaleDownThreshold() &&
                       currentInstances > policy.getMinInstances()) {
                // 可以缩容
                int scaleDownCount = calculateScaleDownCount(metrics, policy);
                decision.setAction(ScalingAction.SCALE_DOWN);
                decision.setTargetInstanceCount(currentInstances - scaleDownCount);
                decision.setReason("Low resource usage");
            }

            // 2. 基于预测负载的调整
            if (forecast.isExpectedSpike()) {
                // 预期流量高峰，提前扩容
                decision.setAction(ScalingAction.PREEMPTIVE_SCALE_UP);
                decision.setTargetInstanceCount(calculatePreemptiveScaleUp(forecast, policy));
                decision.setReason("Expected traffic spike");
            }

            // 3. 基于成本效益的优化
            if (policy.isCostOptimizationEnabled()) {
                CostOptimizationResult costOpt = optimizeForCost(group, metrics);
                if (costOpt.getRecommendedInstanceCount() != decision.getTargetInstanceCount()) {
                    decision.setTargetInstanceCount(costOpt.getRecommendedInstanceCount());
                    decision.addReason("Cost optimization");
                }
            }

            return decision;
        }

        private int calculateScaleUpCount(ScalingMetrics metrics, ScalingPolicy policy) {
            double cpuRatio = metrics.getCpuUsage() / policy.getCpuScaleUpThreshold();
            double memoryRatio = metrics.getMemoryUsage() / policy.getMemoryScaleUpThreshold();
            double maxRatio = Math.max(cpuRatio, memoryRatio);

            // 根据超载比例计算扩容数量
            int scaleUpCount = (int) Math.ceil(maxRatio * policy.getScaleUpStep());

            // 限制单次扩容数量
            return Math.min(scaleUpCount, policy.getMaxScaleUpStep());
        }
    }
}
```

**技术要点**：
- 智能流量预测和分配
- 全面的AI服务监控
- 自动扩缩容决策
- 实时仪表板展示

---

## 🔧 实战案例

### 案例：智能推荐系统微服务架构

#### 架构组件
```java
// 1. 推荐服务API
@RestController
@RequestMapping("/api/recommendations")
public class RecommendationService {
    @PostMapping("/personalized")
    public List<Product> getPersonalizedRecommendations(@RequestBody UserRequest request);
}

// 2. 模型管理服务
@RestController
@RequestMapping("/api/models")
public class ModelManagementService {
    @PostMapping("/deploy")
    public DeploymentResult deployModel(@RequestBody ModelDeploymentRequest request);
}

// 3. 特征工程服务
@RestController
@RequestMapping("/api/features")
public class FeatureEngineeringService {
    @PostMapping("/extract")
    public FeatureVector extractFeatures(@RequestBody UserData userData);
}
```

#### 性能指标
- **响应时间**: P99 < 100ms
- **吞吐量**: 10,000 QPS
- **可用性**: 99.9%
- **扩缩容**: 30秒内完成

---

## 📊 架构模式对比

| 架构模式 | 优势 | 劣势 | 适用场景 |
|----------|------|------|----------|
| 单体架构 | 开发简单，部署容易 | 扩展性差，故障影响大 | 小型应用，团队规模小 |
| 微服务架构 | 独立部署，技术栈灵活 | 复杂度高，网络延迟 | 大型系统，团队规模大 |
| 事件驱动 | 松耦合，高扩展性 | 调试复杂，最终一致性 | 异步处理，高并发场景 |
| CQRS | 读写分离，性能优化 | 复杂度高，数据一致性问题 | 读多写少场景 |

---

## 🎯 部署建议

### 1. 微服务拆分原则
- 按业务领域拆分
- 遵循单一职责原则
- 考虑数据依赖关系
- 平衡粒度和复杂度

### 2. 服务治理最佳实践
- 实施服务网格
- 建立监控体系
- 设计容错机制
- 实现自动化运维

**掌握AI微服务架构，构建可扩展的高性能AI系统！** 🚀

通过这些技术，您将能够设计出企业级的AI微服务架构！