# Spring Boot与AI微服务架构 (100题)

## ⭐ 基础题 (1-30)

### 问题1: 设计基于Spring Boot的AI推理微服务架构

**面试题**: 如何使用Spring Boot设计高可用的AI推理微服务？

**口语化答案**:
"我会设计一个分层的Spring Boot AI微服务架构，包含服务注册、负载均衡、熔断器等组件：

```java
// 主应用入口
@SpringBootApplication
@EnableEurekaClient
@EnableCircuitBreaker
@EnableDiscoveryClient
public class AIInferenceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AIInferenceApplication.class, args);
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public TaskExecutor inferenceTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(8);
        executor.setMaxPoolSize(16);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("ai-inference-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}

// AI推理服务
@RestController
@RequestMapping("/api/v1/inference")
@Slf4j
public class InferenceController {

    private final AIInferenceService inferenceService;
    private final ModelService modelService;
    private final MetricsCollector metrics;

    public InferenceController(AIInferenceService inferenceService,
                              ModelService modelService,
                              MetricsCollector metrics) {
        this.inferenceService = inferenceService;
        this.modelService = modelService;
        this.metrics = metrics;
    }

    @PostMapping("/predict")
    @Timed(name = "inference.predict", description = "Time taken to perform prediction")
    public CompletableFuture<ResponseEntity<InferenceResponse>> predict(
            @RequestBody @Valid InferenceRequest request,
            @RequestHeader("X-Model-Version") String modelVersion) {

        long startTime = System.currentTimeMillis();

        return CompletableFuture.supplyAsync(() -> {
            try {
                // 模型版本检查
                ModelMetadata model = modelService.getModel(request.getModelId(), modelVersion);
                if (model == null) {
                    throw new ModelNotFoundException("模型未找到: " + request.getModelId());
                }

                // 执行推理
                InferenceResult result = inferenceService.predict(request, model);

                // 记录指标
                long duration = System.currentTimeMillis() - startTime;
                metrics.recordInference(request.getModelId(), duration, result.getConfidence());

                return ResponseEntity.ok(new InferenceResponse(
                    result.getPrediction(),
                    result.getConfidence(),
                    result.getProcessingTime(),
                    model.getVersion()
                ));

            } catch (Exception e) {
                log.error("推理失败", e);
                throw new InferenceException("推理处理失败: " + e.getMessage());
            }
        }, inferenceTaskExecutor());
    }

    @PostMapping("/batch")
    public ResponseEntity<List<InferenceResponse>> batchPredict(
            @RequestBody @Valid BatchInferenceRequest request) {

        if (request.getRequests().size() > 100) {
            throw new InvalidBatchSizeException("批次大小不能超过100");
        }

        List<CompletableFuture<InferenceResponse>> futures = request.getRequests().stream()
            .map(req -> predict(req, "latest"))
            .map(future -> future.thenApply(ResponseEntity::getBody))
            .collect(Collectors.toList());

        try {
            List<InferenceResponse> results = futures.stream()
                .map(CompletableFuture::join)
                .collect(Collectors.toList());

            return ResponseEntity.ok(results);
        } catch (Exception e) {
            log.error("批量推理失败", e);
            throw new InferenceException("批量推理失败: " + e.getMessage());
        }
    }

    @GetMapping("/models")
    public ResponseEntity<List<ModelInfo>> getAvailableModels() {
        List<ModelInfo> models = modelService.getAvailableModels();
        return ResponseEntity.ok(models);
    }

    @GetMapping("/health")
    public ResponseEntity<HealthStatus> healthCheck() {
        return ResponseEntity.ok(new HealthStatus(
            inferenceService.isHealthy(),
            modelService.isHealthy(),
            System.currentTimeMillis()
        ));
    }
}

// AI推理服务接口和实现
@Service
@Slf4j
public class AIInferenceService {

    private final ModelCache modelCache;
    private final InferenceEngine inferenceEngine;
    private final AsyncInferenceQueue inferenceQueue;

    public AIInferenceService(ModelCache modelCache,
                              InferenceEngine inferenceEngine,
                              AsyncInferenceQueue inferenceQueue) {
        this.modelCache = modelCache;
        this.inferenceEngine = inferenceEngine;
        this.inferenceQueue = inferenceQueue;
    }

    @HystrixCommand(
        fallbackMethod = "fallbackPredict",
        commandProperties = {
            @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "5000"),
            @HystrixProperty(name = "circuitBreaker.requestVolumeThreshold", value = "20"),
            @HystrixProperty(name = "circuitBreaker.sleepWindowInMilliseconds", value = "10000"),
            @HystrixProperty(name = "circuitBreaker.errorThresholdPercentage", value = "50")
        }
    )
    public InferenceResult predict(InferenceRequest request, ModelMetadata model) {
        try {
            // 获取或加载模型
            AIModel aiModel = modelCache.getOrLoad(model);

            // 数据预处理
            PreprocessedData preprocessedData = preprocessInput(request.getInput());

            // 执行推理
            Object prediction = inferenceEngine.infer(aiModel, preprocessedData);

            // 后处理
            InferenceResult result = postprocessResult(prediction);

            log.info("推理完成: 模型={}, 耗时={}ms", model.getModelId(), result.getProcessingTime());
            return result;

        } catch (Exception e) {
            log.error("推理执行失败: 模型={}", model.getModelId(), e);
            throw new InferenceException("推理执行失败", e);
        }
    }

    public InferenceResult fallbackPredict(InferenceRequest request, ModelMetadata model, Throwable t) {
        log.warn("推理服务降级，使用默认模型: 模型={}, 原因={}", model.getModelId(), t.getMessage());

        try {
            // 使用默认轻量级模型
            ModelMetadata defaultModel = modelService.getDefaultModel();
            return predict(request, defaultModel);
        } catch (Exception e) {
            log.error("降级推理也失败", e);
            return new InferenceResult("降级失败", 0.0, 0);
        }
    }

    private PreprocessedData preprocessInput(Object input) {
        // 实现数据预处理逻辑
        return new PreprocessedData(input);
    }

    private InferenceResult postprocessResult(Object prediction) {
        // 实现结果后处理逻辑
        return new InferenceResult(prediction.toString(), 0.95, 100);
    }

    public boolean isHealthy() {
        return inferenceEngine.isHealthy() && modelCache.isHealthy();
    }
}

// 模型服务
@Service
@Slf4j
public class ModelService {

    private final ModelRepository modelRepository;
    private final ModelLoader modelLoader;
    private final ModelRegistry modelRegistry;

    @Cacheable(value = "models", key = "#modelId + ':' + #version")
    public ModelMetadata getModel(String modelId, String version) {
        log.info("获取模型元数据: modelId={}, version={}", modelId, version);

        return modelRepository.findByModelIdAndVersion(modelId, version)
            .orElseThrow(() -> new ModelNotFoundException("模型未找到: " + modelId));
    }

    @CacheEvict(value = "models", key = "#modelId + ':' + #version")
    public void evictModelCache(String modelId, String version) {
        log.info("清除模型缓存: modelId={}, version={}", modelId, version);
    }

    public List<ModelInfo> getAvailableModels() {
        return modelRepository.findAll().stream()
            .filter(ModelMetadata::isActive)
            .map(this::convertToModelInfo)
            .collect(Collectors.toList());
    }

    public ModelMetadata getDefaultModel() {
        return modelRepository.findByIsDefaultTrue()
            .orElseThrow(() -> new ModelNotFoundException("默认模型未配置"));
    }

    public boolean isHealthy() {
        try {
            // 检查模型数据库连接
            modelRepository.count();
            return true;
        } catch (Exception e) {
            log.error("模型服务健康检查失败", e);
            return false;
        }
    }

    private ModelInfo convertToModelInfo(ModelMetadata metadata) {
        return new ModelInfo(
            metadata.getModelId(),
            metadata.getName(),
            metadata.getVersion(),
            metadata.getDescription(),
            metadata.getModelType(),
            metadata.getCreatedAt()
        );
    }
}

// 模型缓存管理
@Component
@Slf4j
public class ModelCache {

    private final Cache<String, AIModel> modelCache;
    private final ModelLoader modelLoader;
    private final MetricsCollector metrics;

    public ModelCache(ModelLoader modelLoader, MetricsCollector metrics) {
        this.modelLoader = modelLoader;
        this.metrics = metrics;
        this.modelCache = Caffeine.newBuilder()
            .maximumSize(10)
            .expireAfterAccess(30, TimeUnit.MINUTES)
            .recordStats()
            .removalListener((key, value, cause) -> {
                log.info("模型被移出缓存: key={}, cause={}", key, cause);
                metrics.recordModelEviction(cause.name());
            })
            .build();
    }

    public AIModel getOrLoad(ModelMetadata metadata) {
        String cacheKey = metadata.getModelId() + ":" + metadata.getVersion();

        return modelCache.get(cacheKey, key -> {
            log.info("加载模型到缓存: {}", key);
            long startTime = System.currentTimeMillis();

            try {
                AIModel model = modelLoader.loadModel(metadata);
                long loadTime = System.currentTimeMillis() - startTime;
                metrics.recordModelLoad(metadata.getModelId(), loadTime);
                return model;
            } catch (Exception e) {
                log.error("模型加载失败: {}", key, e);
                throw new ModelLoadException("模型加载失败: " + key, e);
            }
        });
    }

    public void preloadModels(List<ModelMetadata> models) {
        log.info("预加载模型: {}", models.size());
        models.parallelStream().forEach(this::getOrLoad);
    }

    public void clear() {
        modelCache.invalidateAll();
    }

    public CacheStats getStats() {
        return modelCache.stats();
    }

    public boolean isHealthy() {
        return getStats().missRate() < 0.1; // 缓存未命中率低于10%
    }
}

// 异步推理队列
@Component
@Slf4j
public class AsyncInferenceQueue {

    private final DisruptorQueue<InferenceTask> taskQueue;
    private final ExecutorService processorPool;

    public AsyncInferenceQueue(@Value("${ai.inference.queue.size:1000}") int queueSize,
                              @Value("${ai.inference.processors:8}") int processors) {
        this.taskQueue = new DisruptorQueue<>(queueSize);
        this.processorPool = Executors.newFixedThreadPool(processors,
            r -> new Thread(r, "inference-processor-"));

        startProcessors();
    }

    private void startProcessors() {
        for (int i = 0; i < processorPool.getThreadPoolExecutor().getCorePoolSize(); i++) {
            processorPool.submit(this::processLoop);
        }
    }

    private void processLoop() {
        while (!Thread.currentThread().isInterrupted()) {
            try {
                InferenceTask task = taskQueue.take(1, TimeUnit.SECONDS);
                if (task != null) {
                    processTask(task);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.error("推理任务处理失败", e);
            }
        }
    }

    public CompletableFuture<InferenceResult> submit(InferenceRequest request, ModelMetadata model) {
        CompletableFuture<InferenceResult> future = new CompletableFuture<>();
        InferenceTask task = new InferenceTask(request, model, future);

        if (!taskQueue.offer(task)) {
            future.completeExceptionally(new QueueFullException("推理队列已满"));
        }

        return future;
    }

    private void processTask(InferenceTask task) {
        try {
            // 执行推理任务
            InferenceResult result = executeInference(task.getRequest(), task.getModel());
            task.getFuture().complete(result);
        } catch (Exception e) {
            log.error("推理任务执行失败", e);
            task.getFuture().completeExceptionally(e);
        }
    }

    private InferenceResult executeInference(InferenceRequest request, ModelMetadata model) {
        // 实际推理执行逻辑
        return new InferenceResult("async_result", 0.92, 80);
    }
}

// 配置类
@Configuration
@EnableConfigurationProperties({AIProperties.class, CacheProperties.class})
public class AIConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public ModelRepository modelRepository(ModelProperties modelProperties) {
        // 根据配置创建不同的存储实现
        if (modelProperties.getStorage().equals("database")) {
            return new DatabaseModelRepository();
        } else if (modelProperties.getStorage().equals("file")) {
            return new FileModelRepository();
        } else {
            return new InMemoryModelRepository();
        }
    }

    @Bean
    public MetricsCollector metricsCollector() {
        return new MetricsCollector();
    }

    @Bean
    public CustomHealthIndicator customHealthIndicator(
            AIInferenceService inferenceService,
            ModelService modelService) {
        return new CustomHealthIndicator(inferenceService, modelService);
    }
}

// 配置属性
@ConfigurationProperties(prefix = "ai")
@Data
public class AIProperties {
    private String modelPath = "/models";
    private int maxConcurrentInferences = 100;
    private long inferenceTimeout = 5000;
    private boolean enableCaching = true;
    private ModelProperties model = new ModelProperties();

    @Data
    public static class ModelProperties {
        private String storage = "database";
        private String defaultModel = "default";
        private int maxCacheSize = 10;
    }
}

@ConfigurationProperties(prefix = "cache")
@Data
public class CacheProperties {
    private int maxSize = 100;
    private Duration expireAfterAccess = Duration.ofMinutes(30);
    private Duration expireAfterWrite = Duration.ofHours(2);
}

// 健康检查
@Component
public class CustomHealthIndicator implements HealthIndicator {

    private final AIInferenceService inferenceService;
    private final ModelService modelService;

    public CustomHealthIndicator(AIInferenceService inferenceService, ModelService modelService) {
        this.inferenceService = inferenceService;
        this.modelService = modelService;
    }

    @Override
    public Health health() {
        boolean inferenceHealthy = inferenceService.isHealthy();
        boolean modelHealthy = modelService.isHealthy();

        Health.Builder builder = inferenceHealthy && modelHealthy ?
            Health.up() : Health.down();

        return builder
            .withDetail("inference", inferenceHealthy ? "UP" : "DOWN")
            .withDetail("models", modelHealthy ? "UP" : "DOWN")
            .withDetail("timestamp", System.currentTimeMillis())
            .build();
    }
}
```

## ⭐⭐ 进阶题 (31-70)

### 问题31: Spring Cloud在AI微服务治理中的应用

**面试题**: 如何使用Spring Cloud实现AI微服务的服务发现、负载均衡和熔断保护？

**口语化答案**:
"Spring Cloud提供了完整的微服务治理生态。我会这样设计AI微服务治理：

```java
// 配置服务器
@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }
}

// 服务注册中心
@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}

// API网关
@SpringBootApplication
@EnableZuulProxy
@EnableCircuitBreaker
public class APIGatewayApplication {

    @Bean
    public PreFilter preFilter() {
        return new APIKeyFilter();
    }

    @Bean
    public PostFilter postFilter() {
        return new ResponseTimeFilter();
    }
}

// API密钥过滤器
public class APIKeyFilter extends ZuulFilter {

    @Override
    public String filterType() {
        return "pre";
    }

    @Override
    public int filterOrder() {
        return 1;
    }

    @Override
    public boolean shouldFilter() {
        return true;
    }

    @Override
    public Object run() throws ZuulException {
        RequestContext ctx = RequestContext.getCurrentContext();
        HttpServletRequest request = ctx.getRequest();

        String apiKey = request.getHeader("X-API-Key");
        if (!isValidApiKey(apiKey)) {
            ctx.setSendZuulResponse(false);
            ctx.setResponseStatusCode(401);
            ctx.setResponseBody("{\"error\":\"Invalid API Key\"}");
        }

        return null;
    }

    private boolean isValidApiKey(String apiKey) {
        // 实现API密钥验证逻辑
        return apiKey != null && apiKey.startsWith("ai-");
    }
}

// AI服务发现客户端
@Component
@Slf4j
public class AIServiceDiscovery {

    private final DiscoveryClient discoveryClient;
    private final LoadBalancerClient loadBalancerClient;
    private final RestTemplate restTemplate;

    public AIServiceDiscovery(DiscoveryClient discoveryClient,
                              LoadBalancerClient loadBalancerClient,
                              RestTemplate restTemplate) {
        this.discoveryClient = discoveryClient;
        this.loadBalancerClient = loadBalancerClient;
        this.restTemplate = restTemplate;
    }

    public List<ServiceInstance> getInferenceServices() {
        return discoveryClient.getInstances("ai-inference-service");
    }

    public ServiceInstance getBestInferenceService() {
        return loadBalancerClient.choose("ai-inference-service");
    }

    @HystrixCommand(
        fallbackMethod = "fallbackInference",
        commandProperties = {
            @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "3000")
        }
    )
    public InferenceResult callInferenceService(InferenceRequest request) {
        ServiceInstance instance = getBestInferenceService();
        if (instance == null) {
            throw new ServiceUnavailableException("没有可用的AI推理服务");
        }

        String url = "http://" + instance.getHost() + ":" + instance.getPort() + "/api/v1/inference/predict";

        try {
            ResponseEntity<InferenceResponse> response = restTemplate.postForEntity(url, request, InferenceResponse.class);
            return convertToResult(response.getBody());
        } catch (Exception e) {
            log.error("调用AI推理服务失败", e);
            throw new ServiceCallException("AI推理服务调用失败", e);
        }
    }

    public InferenceResult fallbackInference(InferenceRequest request, Throwable t) {
        log.warn("AI推理服务降级，使用缓存或默认结果");
        return new InferenceResult("降级结果", 0.8, 0);
    }

    private InferenceResult convertToResult(InferenceResponse response) {
        return new InferenceResult(
            response.getPrediction(),
            response.getConfidence(),
            response.getProcessingTime()
        );
    }

    // 健康检查所有AI服务实例
    public Map<String, Boolean> healthCheckAllServices() {
        Map<String, Boolean> healthStatus = new HashMap<>();

        List<ServiceInstance> instances = getInferenceServices();
        for (ServiceInstance instance : instances) {
            String healthUrl = "http://" + instance.getHost() + ":" + instance.getPort() + "/health";
            try {
                ResponseEntity<HealthStatus> response = restTemplate.getForEntity(healthUrl, HealthStatus.class);
                healthStatus.put(instance.getInstanceId(), response.getStatusCode().is2xxSuccessful());
            } catch (Exception e) {
                healthStatus.put(instance.getInstanceId(), false);
            }
        }

        return healthStatus;
    }
}

// 负载均衡策略配置
@Configuration
public class LoadBalancerConfiguration {

    @Bean
    public IRule aiServiceRule() {
        // 基于响应时间的负载均衡策略
        return new WeightedResponseTimeRule();
    }

    @Bean
    public IPing aiServicePing() {
        // 自定义健康检查
        return new AIPing();
    }

    private static class AIPing implements IPing {
        private final RestTemplate restTemplate = new RestTemplate();

        @Override
        public boolean isAlive(Server server) {
            try {
                String url = "http://" + server.getHost() + ":" + server.getPort() + "/health";
                ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
                return response.getStatusCode().is2xxSuccessful();
            } catch (Exception e) {
                return false;
            }
        }
    }
}

// 配置管理
@RestController
@RefreshScope
@RequestMapping("/api/v1/config")
public class ConfigurationController {

    @Value("${ai.inference.timeout:5000}")
    private long inferenceTimeout;

    @Value("${ai.inference.retries:3}")
    private int maxRetries;

    @Value("${ai.models.default:default}")
    private String defaultModel;

    @GetMapping("/inference")
    public InferenceConfig getInferenceConfig() {
        return new InferenceConfig(inferenceTimeout, maxRetries);
    }

    @PostMapping("/inference")
    public ResponseEntity<String> updateInferenceConfig(@RequestBody InferenceConfig config) {
        // 更新配置的逻辑
        return ResponseEntity.ok("配置更新成功");
    }

    @GetMapping("/models/default")
    public String getDefaultModel() {
        return defaultModel;
    }
}

// 链路追踪
@Component
@Slf4j
public class AITracingInterceptor implements HandlerInterceptor {

    private final Tracer tracer;

    public AITracingInterceptor(Tracer tracer) {
        this.tracer = tracer;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        Span span = tracer.nextSpan().name("ai-inference");
        span.tag("service.name", "ai-inference");
        span.tag("http.method", request.getMethod());
        span.tag("http.url", request.getRequestURI());

        span.start();
        tracer.withSpan(span);

        // 将trace信息添加到响应头
        response.addHeader("X-Trace-Id", span.context().traceId());
        response.addHeader("X-Span-Id", span.context().spanId());

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                               Object handler, Exception ex) {
        Span span = tracer.currentSpan();
        if (span != null) {
            if (ex != null) {
                span.tag("error", ex.getMessage());
            }
            span.end();
        }
    }
}

// 指标收集
@Component
@Slf4j
public class AIMetricsCollector {

    private final MeterRegistry meterRegistry;
    private final Counter inferenceRequests;
    private final Timer inferenceTimer;
    private final Gauge activeInferences;

    private final AtomicInteger activeInferenceCount = new AtomicInteger(0);

    public AIMetricsCollector(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.inferenceRequests = Counter.builder("ai.inference.requests")
            .description("AI推理请求数量")
            .register(meterRegistry);

        this.inferenceTimer = Timer.builder("ai.inference.duration")
            .description("AI推理耗时")
            .register(meterRegistry);

        this.activeInferences = Gauge.builder("ai.inference.active")
            .description("活跃推理数量")
            .register(meterRegistry, activeInferenceCount, AtomicInteger::get);
    }

    public void recordInferenceStart() {
        activeInferenceCount.incrementAndGet();
        inferenceRequests.increment();
    }

    public void recordInferenceEnd(long durationMs) {
        activeInferenceCount.decrementAndGet();
        inferenceTimer.record(durationMs, TimeUnit.MILLISECONDS);
    }

    public void recordModelLoad(String modelId, long loadTimeMs) {
        Timer.Sample sample = Timer.start(meterRegistry);
        sample.stop(Timer.builder("ai.model.load.duration")
            .tag("model.id", modelId)
            .register(meterRegistry));
    }

    public void recordModelEviction(String cause) {
        Counter.builder("ai.model.evictions")
            .tag("cause", cause)
            .register(meterRegistry)
            .increment();
    }
}
```

## ⭐⭐⭐ 专家题 (71-100)

### 问题71: 基于Spring Cloud Stream的实时AI事件处理架构

**面试题**: 如何设计基于Spring Cloud Stream的实时AI事件处理系统，支持流式推理和事件溯源？

**口语化答案**:
"我会设计一个基于事件驱动的实时AI处理架构，支持流式推理和事件溯源：

```java
// 事件驱动的AI处理应用
@SpringBootApplication
@EnableBinding(AIProcessingChannels.class)
public class AIEventProcessingApplication {

    public static void main(String[] args) {
        SpringApplication.run(AIEventProcessingApplication.class, args);
    }

    @Bean
    public AIEventProcessor eventProcessor() {
        return new AIEventProcessor();
    }

    @Bean
    public StreamListener streamListener() {
        return new StreamListener();
    }
}

// AI处理通道定义
public interface AIProcessingChannels {

    String INFERENCE_INPUT = "ai.inference.input";
    String INFERENCE_OUTPUT = "ai.inference.output";
    String MODEL_EVENTS = "ai.model.events";
    String METRICS = "ai.metrics";
    String DEAD_LETTER = "ai.deadletter";

    @Input(INFERENCE_INPUT)
    SubscribableChannel inferenceInput();

    @Output(INFERENCE_OUTPUT)
    MessageChannel inferenceOutput();

    @Input(MODEL_EVENTS)
    SubscribableChannel modelEvents();

    @Output(MODEL_EVENTS)
    MessageChannel modelEventOutput();

    @Input(METRICS)
    SubscribableChannel metrics();

    @Output(METRICS)
    MessageChannel metricsOutput();

    @Input(DEAD_LETTER)
    SubscribableChannel deadLetter();

    @Output(DEAD_LETTER)
    MessageChannel deadLetterOutput();
}

// AI事件处理器
@Component
@Slf4j
public class AIEventProcessor {

    private final StreamInferenceService inferenceService;
    private final ModelEventStore modelEventStore;
    private final EventSourcingService eventSourcingService;
    private final MetricsCollector metricsCollector;

    public AIEventProcessor(StreamInferenceService inferenceService,
                           ModelEventStore modelEventStore,
                           EventSourcingService eventSourcingService,
                           MetricsCollector metricsCollector) {
        this.inferenceService = inferenceService;
        this.modelEventStore = modelEventStore;
        this.eventSourcingService = eventSourcingService;
        this.metricsCollector = metricsCollector;
    }

    @StreamListener(target = AIProcessingChannels.INFERENCE_INPUT)
    public void handleInferenceRequest(Message<InferenceEvent> message) {
        try {
            InferenceEvent event = message.getPayload();
            log.info("处理推理事件: eventId={}, modelId={}", event.getEventId(), event.getModelId());

            // 事件溯源：存储推理事件
            eventSourcingService.saveEvent(event);

            // 获取当前模型状态
            ModelState currentModelState = modelEventStore.getCurrentModelState(event.getModelId());
            if (currentModelState == null) {
                throw new ModelStateException("模型状态未找到: " + event.getModelId());
            }

            // 执行流式推理
            CompletableFuture<InferenceResult> resultFuture = inferenceService.streamInference(
                event.getInputData(), currentModelState);

            // 处理推理结果
            resultFuture.thenAccept(result -> {
                // 发布推理完成事件
                publishInferenceCompletedEvent(event, result);

                // 发送指标事件
                publishMetricsEvent(event, result);

            }).exceptionally(throwable -> {
                // 处理推理失败
                log.error("推理失败: eventId={}", event.getEventId(), throwable);
                publishInferenceFailedEvent(event, throwable);
                return null;
            });

        } catch (Exception e) {
            log.error("处理推理事件失败", e);
            // 发送到死信队列
            sendToDeadLetter(message, e);
        }
    }

    @StreamListener(target = AIProcessingChannels.MODEL_EVENTS)
    public void handleModelEvent(Message<ModelEvent> message) {
        ModelEvent event = message.getPayload();
        log.info("处理模型事件: eventId={}, eventType={}", event.getEventId(), event.getEventType());

        try {
            // 事件溯源：存储模型事件
            eventSourcingService.saveEvent(event);

            // 更新模型状态
            updateModelState(event);

            // 触发模型重载
            if (event.getEventType() == ModelEventType.MODEL_UPDATED ||
                event.getEventType() == ModelEventType.MODEL_VERSION_CHANGED) {
                triggerModelReload(event);
            }

        } catch (Exception e) {
            log.error("处理模型事件失败", e);
            sendToDeadLetter(message, e);
        }
    }

    private void updateModelState(ModelEvent event) {
        ModelState currentState = modelEventStore.getCurrentModelState(event.getModelId());
        ModelState newState = currentState.applyEvent(event);
        modelEventStore.saveModelState(newState);
    }

    private void triggerModelReload(ModelEvent event) {
        CompletableFuture.runAsync(() -> {
            try {
                inferenceService.reloadModel(event.getModelId());
                log.info("模型重载完成: modelId={}", event.getModelId());
            } catch (Exception e) {
                log.error("模型重载失败: modelId={}", event.getModelId(), e);
            }
        });
    }

    private void publishInferenceCompletedEvent(InferenceEvent requestEvent, InferenceResult result) {
        InferenceCompletedEvent completedEvent = new InferenceCompletedEvent(
            UUID.randomUUID().toString(),
            requestEvent.getEventId(),
            requestEvent.getModelId(),
            result,
            System.currentTimeMillis()
        );

        Message<InferenceCompletedEvent> message = MessageBuilder
            .withPayload(completedEvent)
            .setHeader("event-type", "inference.completed")
            .setHeader("correlation-id", requestEvent.getEventId())
            .build();

        inferenceOutput().send(message);
    }

    private void publishInferenceFailedEvent(InferenceEvent requestEvent, Throwable throwable) {
        InferenceFailedEvent failedEvent = new InferenceFailedEvent(
            UUID.randomUUID().toString(),
            requestEvent.getEventId(),
            requestEvent.getModelId(),
            throwable.getMessage(),
            System.currentTimeMillis()
        );

        Message<InferenceFailedEvent> message = MessageBuilder
            .withPayload(failedEvent)
            .setHeader("event-type", "inference.failed")
            .setHeader("correlation-id", requestEvent.getEventId())
            .build();

        inferenceOutput().send(message);
    }

    private void publishMetricsEvent(InferenceEvent requestEvent, InferenceResult result) {
        MetricsEvent metricsEvent = new MetricsEvent(
            UUID.randomUUID().toString(),
            requestEvent.getModelId(),
            result.getProcessingTime(),
            result.getConfidence(),
            System.currentTimeMillis()
        );

        Message<MetricsEvent> message = MessageBuilder
            .withPayload(metricsEvent)
            .setHeader("event-type", "metrics.collected")
            .build();

        metricsOutput().send(message);
    }

    private void sendToDeadLetter(Message<?> originalMessage, Exception error) {
        DeadLetterEvent deadLetterEvent = new DeadLetterEvent(
            originalMessage.getPayload(),
            error.getMessage(),
            System.currentTimeMillis()
        );

        Message<DeadLetterEvent> message = MessageBuilder
            .withPayload(deadLetterEvent)
            .copyHeaders(originalMessage.getHeaders())
            .setHeader("error-reason", error.getMessage())
            .build();

        deadLetterOutput().send(message);
    }

    @Autowired
    private MessageChannel inferenceOutput();

    @Autowired
    private MessageChannel metricsOutput();

    @Autowired
    private MessageChannel deadLetterOutput();
}

// 流式推理服务
@Service
@Slf4j
public class StreamInferenceService {

    private final Map<String, AIModel> modelCache;
    private final StreamProcessor streamProcessor;
    private final ReactiveRedisTemplate<String, String> redisTemplate;

    public StreamInferenceService(StreamProcessor streamProcessor,
                                 ReactiveRedisTemplate<String, String> redisTemplate) {
        this.modelCache = new ConcurrentHashMap<>();
        this.streamProcessor = streamProcessor;
        this.redisTemplate = redisTemplate;
    }

    public CompletableFuture<InferenceResult> streamInference(Object inputData, ModelState modelState) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // 获取模型实例
                AIModel model = getOrLoadModel(modelState);

                // 流式处理输入数据
                Flux<Object> inputStream = convertToStream(inputData);

                // 执行流式推理
                Flux<Object> inferenceStream = streamProcessor.processStream(model, inputStream);

                // 收集结果
                return collectInferenceResult(inferenceStream);

            } catch (Exception e) {
                log.error("流式推理失败", e);
                throw new InferenceException("流式推理失败", e);
            }
        });
    }

    private AIModel getOrLoadModel(ModelState modelState) {
        return modelCache.computeIfAbsent(modelState.getModelId(), id -> {
            try {
                return loadModel(modelState);
            } catch (Exception e) {
                log.error("加载模型失败: modelId={}", id, e);
                throw new ModelLoadException("模型加载失败", e);
            }
        });
    }

    private AIModel loadModel(ModelState modelState) {
        // 从模型状态加载模型
        return new AIModel(modelState.getModelPath(), modelState.getVersion());
    }

    private Flux<Object> convertToStream(Object inputData) {
        if (inputData instanceof Flux) {
            return (Flux<Object>) inputData;
        } else if (inputData instanceof List) {
            return Flux.fromIterable((List<Object>) inputData);
        } else {
            return Flux.just(inputData);
        }
    }

    private InferenceResult collectInferenceResult(Flux<Object> inferenceStream) {
        // 收集流式推理结果
        List<Object> results = inferenceStream.collectList().block();

        // 计算聚合结果
        Object finalResult = aggregateResults(results);

        return new InferenceResult(
            finalResult.toString(),
            calculateConfidence(results),
            System.currentTimeMillis()
        );
    }

    private Object aggregateResults(List<Object> results) {
        // 实现结果聚合逻辑
        return results.stream().findFirst().orElse("no_result");
    }

    private double calculateConfidence(List<Object> results) {
        // 计算置信度
        return 0.95;
    }

    public void reloadModel(String modelId) {
        modelCache.remove(modelId);
        // 通知其他节点重载模型
        publishModelReloadEvent(modelId);
    }

    private void publishModelReloadEvent(String modelId) {
        ModelReloadEvent event = new ModelReloadEvent(
            UUID.randomUUID().toString(),
            modelId,
            System.currentTimeMillis()
        );

        // 发送模型重载事件
        redisTemplate.convertAndSend("ai:model:reload", event)
            .subscribe(
                success -> log.info("模型重载事件发布成功: modelId={}", modelId),
                error -> log.error("模型重载事件发布失败: modelId={}", modelId, error)
            );
    }

    public boolean isHealthy() {
        return !modelCache.isEmpty();
    }
}

// 流处理器
@Component
public class StreamProcessor {

    private final ReactiveKafkaProducerTemplate<String, Object> kafkaProducer;

    public StreamProcessor(ReactiveKafkaProducerTemplate<String, Object> kafkaProducer) {
        this.kafkaProducer = kafkaProducer;
    }

    public Flux<Object> processStream(AIModel model, Flux<Object> inputStream) {
        return inputStream
            .flatMap(input -> processSingleInput(model, input))
            .doOnNext(result -> log.debug("流处理结果: {}", result))
            .doOnError(error -> log.error("流处理出错", error));
    }

    private Mono<Object> processSingleInput(AIModel model, Object input) {
        return Mono.fromCallable(() -> {
            // 执行单个输入的推理
            return model.predict(input);
        })
        .subscribeOn(Schedulers.parallel())
        .doOnSuccess(result -> {
            // 发送中间结果到Kafka（可选）
            publishIntermediateResult(model.getModelId(), input, result);
        });
    }

    private void publishIntermediateResult(String modelId, Object input, Object result) {
        IntermediateResultEvent event = new IntermediateResultEvent(
            modelId,
            input,
            result,
            System.currentTimeMillis()
        );

        kafkaProducer.send("ai.intermediate.results", event)
            .subscribe(
                success -> log.debug("中间结果发布成功"),
                error -> log.error("中间结果发布失败", error)
            );
    }
}

// 事件溯源服务
@Service
@Slf4j
public class EventSourcingService {

    private final EventStore eventStore;
    private final AggregateStore aggregateStore;

    public EventSourcingService(EventStore eventStore, AggregateStore aggregateStore) {
        this.eventStore = eventStore;
        this.aggregateStore = aggregateStore;
    }

    public void saveEvent(DomainEvent event) {
        try {
            // 保存事件到事件存储
            eventStore.saveEvent(event);
            log.debug("事件保存成功: eventId={}, eventType={}", event.getEventId(), event.getClass().getSimpleName());
        } catch (Exception e) {
            log.error("事件保存失败: eventId={}", event.getEventId(), e);
            throw new EventPersistenceException("事件保存失败", e);
        }
    }

    public <T extends AggregateRoot> T getAggregate(String aggregateId, Class<T> aggregateClass) {
        try {
            // 聚合根重构
            List<DomainEvent> events = eventStore.getEvents(aggregateId);
            T aggregate = aggregateClass.getDeclaredConstructor().newInstance();
            aggregate.loadFromHistory(events);
            return aggregate;
        } catch (Exception e) {
            log.error("聚合根重构失败: aggregateId={}", aggregateId, e);
            throw new AggregateReconstructionException("聚合根重构失败", e);
        }
    }

    public <T extends AggregateRoot> void saveAggregate(T aggregate) {
        try {
            // 获取未提交的事件
            List<DomainEvent> uncommittedEvents = aggregate.getUncommittedEvents();

            // 保存事件
            for (DomainEvent event : uncommittedEvents) {
                eventStore.saveEvent(event);
            }

            // 标记事件为已提交
            aggregate.markEventsAsCommitted();

            log.debug("聚合根保存成功: aggregateId={}, events={}",
                aggregate.getId(), uncommittedEvents.size());

        } catch (Exception e) {
            log.error("聚合根保存失败: aggregateId={}", aggregate.getId(), e);
            throw new AggregatePersistenceException("聚合根保存失败", e);
        }
    }
}

// 配置类
@Configuration
@EnableIntegration
public class StreamProcessingConfiguration {

    @Bean
    public MessageChannel inferenceInput() {
        return new DirectChannel();
    }

    @Bean
    public MessageChannel inferenceOutput() {
        return new DirectChannel();
    }

    @Bean
    public IntegrationFlow inferenceFlow() {
        return IntegrationFlows.from(inferenceInput())
            .transform(this::transformInferenceRequest)
            .handle(this::processInference)
            .channel(inferenceOutput())
            .get();
    }

    private Object transformInferenceRequest(Message<?> message) {
        // 转换推理请求
        return message.getPayload();
    }

    private Object processInference(Message<?> message) {
        // 处理推理逻辑
        return "processed_" + message.getPayload();
    }
}
```

## 💡 面试技巧提示

### Spring Boot AI微服务面试要点：

1. **架构设计**: 分层架构、服务拆分、API设计
2. **服务治理**: 服务发现、负载均衡、熔断器
3. **配置管理**: 集中配置、动态刷新、环境隔离
4. **事件驱动**: 流处理、事件溯源、CQRS模式
5. **监控运维**: 健康检查、指标收集、链路追踪

### 常见错误：
- 不了解Spring Cloud生态的完整组件
- 缺乏微服务架构设计经验
- 忽略容错和降级策略
- 没有考虑数据一致性和事务管理
- 不了解事件驱动架构的实现细节

通过这些题目，面试官能全面考察候选人对Spring Boot微服务架构和AI系统集成的深度理解。