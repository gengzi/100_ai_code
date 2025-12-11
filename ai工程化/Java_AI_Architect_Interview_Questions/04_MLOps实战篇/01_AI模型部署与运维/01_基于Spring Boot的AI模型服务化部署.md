# 基于Spring Boot的AI模型服务化部署

## 题目1: ⭐⭐ Spring Boot集成ONNX模型推理服务

**问题描述**:
ONNX(Open Neural Network Exchange)是一种通用的深度学习模型格式。请设计一个Spring Boot应用，集成ONNX运行时，提供模型推理服务，并实现性能优化和监控。

**答案要点**:
- **ONNX Runtime**: Java SDK集成和配置
- **模型管理**: 动态加载和版本控制
- **推理优化**: 批处理和并行处理
- **性能监控**: 延迟、吞吐量、资源使用监控

**代码示例**:
```java
@RestController
@RequestMapping("/api/inference")
@RequiredArgsConstructor
@Slf4j
public class ModelInferenceController {

    private final ModelManager modelManager;
    private final InferenceService inferenceService;
    private final MetricsCollector metricsCollector;

    @PostMapping("/{model}/predict")
    @Timed(name = "inference.request.duration")
    public ResponseEntity<PredictionResponse> predict(
            @PathVariable String model,
            @RequestBody PredictionRequest request) {

        try {
            // 1. 验证模型存在
            if (!modelManager.isModelLoaded(model)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new PredictionResponse(null, "模型不存在: " + model));
            }

            // 2. 预处理输入数据
            Object preprocessedInput = preprocessInput(request, model);

            // 3. 执行推理
            long startTime = System.currentTimeMillis();
            Object result = inferenceService.predict(model, preprocessedInput);
            long inferenceTime = System.currentTimeMillis() - startTime;

            // 4. 后处理结果
            PredictionResponse response = postprocessResult(result, model);

            // 5. 记录指标
            metricsCollector.recordInference(model, inferenceTime, request.getInput().length);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("推理失败: model={}, error={}", model, e.getMessage(), e);
            metricsCollector.recordInferenceError(model, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new PredictionResponse(null, "推理失败: " + e.getMessage()));
        }
    }

    @PostMapping("/{model}/batch")
    public ResponseEntity<List<PredictionResponse>> batchPredict(
            @PathVariable String model,
            @RequestBody BatchPredictionRequest request) {

        try {
            List<PredictionResponse> responses = new ArrayList<>();
            long startTime = System.currentTimeMillis();

            // 批量推理
            List<Object> results = inferenceService.batchPredict(model, request.getInputs());

            long totalInferenceTime = System.currentTimeMillis() - startTime;
            double avgTimePerRequest = (double) totalInferenceTime / request.getInputs().size();

            // 处理结果
            for (Object result : results) {
                responses.add(postprocessResult(result, model));
            }

            // 记录批量指标
            metricsCollector.recordBatchInference(model, totalInferenceTime, request.getInputs().size());

            return ResponseEntity.ok(responses);

        } catch (Exception e) {
            log.error("批量推理失败: model={}, error={}", model, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonList(
                    new PredictionResponse(null, "批量推理失败: " + e.getMessage())));
        }
    }

    @GetMapping("/{model}/info")
    public ResponseEntity<ModelInfo> getModelInfo(@PathVariable String model) {
        try {
            ModelInfo info = modelManager.getModelInfo(model);
            return ResponseEntity.ok(info);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    private Object preprocessInput(PredictionRequest request, String model) {
        ModelInfo modelInfo = modelManager.getModelInfo(model);

        // 根据模型类型进行不同的预处理
        switch (modelInfo.getType()) {
            case IMAGE_CLASSIFICATION:
                return preprocessImageInput(request.getInput());
            case TEXT_CLASSIFICATION:
                return preprocessTextInput(request.getInput());
            case TABULAR:
                return preprocessTabularInput(request.getInput());
            default:
                return request.getInput();
        }
    }

    private Object preprocessImageInput(Object input) {
        // 图像预处理：归一化、调整大小等
        if (input instanceof String) {
            // Base64图像解码
            byte[] imageBytes = Base64.getDecoder().decode((String) input);
            return imageBytes;
        }
        return input;
    }

    private Object preprocessTextInput(Object input) {
        // 文本预处理：分词、编码等
        if (input instanceof String) {
            return tokenizeText((String) input);
        }
        return input;
    }

    private Object preprocessTabularInput(Object input) {
        // 表格数据预处理：特征缩放、编码等
        if (input instanceof List) {
            return normalizeFeatures((List<?>) input);
        }
        return input;
    }

    private PredictionResponse postprocessResult(Object result, String model) {
        ModelInfo modelInfo = modelManager.getModelInfo(model);

        if (result instanceof float[]) {
            float[] probabilities = (float[]) result;
            int predictedClass = argmax(probabilities);
            double confidence = probabilities[predictedClass];

            return new PredictionResponse(
                Map.of(
                    "predictedClass", predictedClass,
                    "confidence", confidence,
                    "probabilities", probabilities
                ),
                null
            );
        } else if (result instanceof String) {
            return new PredictionResponse(
                Map.of("text", result),
                null
            );
        }

        return new PredictionResponse(result, null);
    }

    private int argmax(float[] array) {
        int maxIndex = 0;
        float maxValue = array[0];

        for (int i = 1; i < array.length; i++) {
            if (array[i] > maxValue) {
                maxValue = array[i];
                maxIndex = i;
            }
        }

        return maxIndex;
    }

    private Object tokenizeText(String text) {
        // 简化的分词实现
        return text.toLowerCase().split("\\s+");
    }

    private Object normalizeFeatures(List<?> features) {
        // 简化的特征标准化实现
        List<Double> normalized = new ArrayList<>();
        for (Object feature : features) {
            if (feature instanceof Number) {
                normalized.add(((Number) feature).doubleValue());
            }
        }
        return normalized;
    }
}

@Service
@RequiredArgsConstructor
@Slf4j
public class ModelManager {

    private final Map<String, ModelInstance> loadedModels = new ConcurrentHashMap<>();
    private final ModelStorageService storageService;
    private final ApplicationEventPublisher eventPublisher;

    @PostConstruct
    public void initialize() {
        // 启动时加载默认模型
        loadDefaultModels();
    }

    public void loadModel(String modelName, String version) {
        try {
            // 1. 从存储加载模型文件
            Path modelPath = storageService.getModelPath(modelName, version);

            // 2. 创建ONNX Runtime会话
            OrtEnvironment env = OrtEnvironment.getEnvironment();
            OrtSession.SessionOptions options = new OrtSession.SessionOptions();

            // 优化选项
            options.setOptimizationLevel(OrtSession.SessionOptions.OptLevel.BASIC_OPT);
            options.setExecutionMode(OrtSession.SessionOptions.ExecutionMode.PARALLEL);

            // GPU支持（如果可用）
            if (isCUDAAvailable()) {
                options.addCUDA();
            }

            OrtSession session = env.createSession(modelPath.toString(), options);

            // 3. 获取模型信息
            ModelInfo modelInfo = extractModelInfo(session);

            // 4. 创建模型实例
            ModelInstance modelInstance = new ModelInstance(
                modelName, version, session, modelInfo, Instant.now()
            );

            // 5. 加载到内存
            loadedModels.put(modelName, modelInstance);

            // 6. 发布事件
            eventPublisher.publishEvent(new ModelLoadedEvent(modelName, version));

            log.info("模型加载成功: {}@{}", modelName, version);

        } catch (Exception e) {
            log.error("模型加载失败: {}@{}", modelName, version, e);
            throw new ModelLoadException("模型加载失败: " + e.getMessage(), e);
        }
    }

    public void unloadModel(String modelName) {
        ModelInstance model = loadedModels.remove(modelName);
        if (model != null) {
            try {
                model.close();
                eventPublisher.publishEvent(new ModelUnloadedEvent(modelName));
                log.info("模型卸载成功: {}", modelName);
            } catch (Exception e) {
                log.error("模型卸载失败: {}", modelName, e);
            }
        }
    }

    public boolean isModelLoaded(String modelName) {
        return loadedModels.containsKey(modelName);
    }

    public ModelInstance getModel(String modelName) {
        ModelInstance model = loadedModels.get(modelName);
        if (model == null) {
            throw new ModelNotLoadedException("模型未加载: " + modelName);
        }
        return model;
    }

    public ModelInfo getModelInfo(String modelName) {
        return getModel(modelName).getModelInfo();
    }

    public List<String> getLoadedModels() {
        return new ArrayList<>(loadedModels.keySet());
    }

    public ModelMetrics getModelMetrics(String modelName) {
        ModelInstance model = loadedModels.get(modelName);
        if (model != null) {
            return model.getMetrics();
        }
        return null;
    }

    private void loadDefaultModels() {
        // 加载配置文件中指定的默认模型
        List<String> defaultModels = Arrays.asList(
            "resnet50", "bert-base", "random-forest"
        );

        for (String modelName : defaultModels) {
            try {
                loadModel(modelName, "latest");
            } catch (Exception e) {
                log.warn("默认模型加载失败: {}", modelName);
            }
        }
    }

    private ModelInfo extractModelInfo(OrtSession session) {
        try {
            // 获取输入信息
            List<TensorInfo> inputInfos = session.getInputInfo().values().stream()
                .map(OrtUtil::tensorInfoFromNative)
                .collect(Collectors.toList());

            // 获取输出信息
            List<TensorInfo> outputInfos = session.getOutputInfo().values().stream()
                .map(OrtUtil::tensorInfoFromNative)
                .collect(Collectors.toList());

            return ModelInfo.builder()
                .inputInfos(inputInfos)
                .outputInfos(outputInfos)
                .type(determineModelType(inputInfos, outputInfos))
                .memoryUsage(estimateMemoryUsage(inputInfos))
                .build();

        } catch (Exception e) {
            throw new RuntimeException("提取模型信息失败", e);
        }
    }

    private ModelType determineModelType(List<TensorInfo> inputInfos, List<TensorInfo> outputInfos) {
        // 基于输入输出形状确定模型类型
        if (inputInfos.stream().anyMatch(info -> info.getShape().length == 4)) {
            return ModelType.IMAGE_CLASSIFICATION;
        } else if (inputInfos.stream().anyMatch(info -> info.getType() == TensorInfo.Type.STRING)) {
            return ModelType.TEXT_CLASSIFICATION;
        } else {
            return ModelType.TABULAR;
        }
    }

    private long estimateMemoryUsage(List<TensorInfo> inputInfos) {
        // 估算模型内存使用量
        return inputInfos.stream()
            .mapToLong(info -> {
                long elements = Arrays.stream(info.getShape()).reduce(1L, (a, b) -> a * b);
                return elements * getTypeSize(info.getType());
            })
            .sum();
    }

    private long getTypeSize(TensorInfo.Type type) {
        switch (type) {
            case FLOAT32: return 4;
            case FLOAT64: return 8;
            case INT32: return 4;
            case INT64: return 8;
            default: return 4;
        }
    }

    private boolean isCUDAAvailable() {
        try {
            // 检查CUDA是否可用
            return OrtEnvironment.getEnvironment().getAvailableProviders()
                .stream()
                .anyMatch(provider -> provider.getName().equals("CUDA"));
        } catch (Exception e) {
            return false;
        }
    }
}

@Service
@RequiredArgsConstructor
public class InferenceService {

    private final ModelManager modelManager;
    private final ThreadPoolExecutor inferenceExecutor;
    private final MetricsCollector metricsCollector;

    public Object predict(String modelName, Object input) {
        ModelInstance model = modelManager.getModel(modelName);
        OrtSession session = model.getSession();

        try {
            // 1. 准备输入张量
            OrtTensor inputTensor = prepareInputTensor(input, model.getModelInfo());

            // 2. 执行推理
            OrtSession.Result result = session.run(
                Map.of(model.getModelInfo().getInputInfos().get(0).getName(), inputTensor)
            );

            // 3. 提取输出
            Object output = extractOutput(result, model.getModelInfo());

            // 4. 更新模型指标
            model.getMetrics().incrementRequestCount();

            return output;

        } catch (Exception e) {
            model.getMetrics().incrementErrorCount();
            throw new InferenceException("推理执行失败", e);
        }
    }

    public List<Object> batchPredict(String modelName, List<Object> inputs) {
        ModelInstance model = modelManager.getModel(modelName);

        // 确定最佳批量大小
        int optimalBatchSize = determineOptimalBatchSize(inputs.size());

        List<Object> results = new ArrayList<>();

        // 分批处理
        for (int i = 0; i < inputs.size(); i += optimalBatchSize) {
            int endIndex = Math.min(i + optimalBatchSize, inputs.size());
            List<Object> batch = inputs.subList(i, endIndex);

            List<Object> batchResults = processBatch(model, batch);
            results.addAll(batchResults);
        }

        return results;
    }

    private OrtTensor prepareInputTensor(Object input, ModelInfo modelInfo) {
        OrtEnvironment env = OrtEnvironment.getEnvironment();
        TensorInfo inputInfo = modelInfo.getInputInfos().get(0);

        if (input instanceof float[]) {
            float[] array = (float[]) input;
            return env.createTensor(inputInfo.getType(), new long[]{array.length}, array);
        } else if (input instanceof byte[]) {
            byte[] array = (byte[]) input;
            return env.createTensor(inputInfo.getType(), new long[]{array.length}, array);
        } else if (input instanceof List) {
            List<?> list = (List<?>) input;
            float[] array = list.stream()
                .mapToDouble(obj -> ((Number) obj).doubleValue())
                .mapToFloat(d -> (float) d)
                .toArray();
            return env.createTensor(inputInfo.getType(), new long[]{array.length}, array);
        }

        throw new IllegalArgumentException("不支持的输入类型: " + input.getClass());
    }

    private Object extractOutput(OrtSession.Result result, ModelInfo modelInfo) {
        try (OrtTensor outputTensor = (OrtTensor) result.get(0)) {
            if (outputTensor.getInfo().getType() == TensorInfo.Type.FLOAT32) {
                return (float[]) outputTensor.getValue();
            } else if (outputTensor.getInfo().getType() == TensorInfo.Type.STRING) {
                return (String[]) outputTensor.getValue();
            } else {
                return outputTensor.getValue();
            }
        }
    }

    private List<Object> processBatch(ModelInstance model, List<Object> batch) {
        CompletableFuture<List<Object>> future = CompletableFuture.supplyAsync(() -> {
            List<Object> batchResults = new ArrayList<>();
            for (Object input : batch) {
                try {
                    Object result = predict(model.getModelName(), input);
                    batchResults.add(result);
                } catch (Exception e) {
                    log.error("批量推理中的单个请求失败", e);
                    batchResults.add(null);
                }
            }
            return batchResults;
        }, inferenceExecutor);

        try {
            return future.get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            throw new InferenceException("批量推理超时或失败", e);
        }
    }

    private int determineOptimalBatchSize(int inputCount) {
        // 根据输入数量和系统资源确定最佳批量大小
        int maxBatchSize = 32;
        int availableProcessors = Runtime.getRuntime().availableProcessors();

        return Math.min(inputCount, Math.min(maxBatchSize, availableProcessors * 2));
    }
}

// 模型实例类
public class ModelInstance implements AutoCloseable {

    private final String modelName;
    private final String version;
    private final OrtSession session;
    private final ModelInfo modelInfo;
    private final Instant loadedAt;
    private final ModelMetrics metrics;

    public ModelInstance(String modelName, String version, OrtSession session,
                        ModelInfo modelInfo, Instant loadedAt) {
        this.modelName = modelName;
        this.version = version;
        this.session = session;
        this.modelInfo = modelInfo;
        this.loadedAt = loadedAt;
        this.metrics = new ModelMetrics();
    }

    @Override
    public void close() throws Exception {
        if (session != null) {
            session.close();
        }
    }

    // Getters
    public String getModelName() { return modelName; }
    public String getVersion() { return version; }
    public OrtSession getSession() { return session; }
    public ModelInfo getModelInfo() { return modelInfo; }
    public Instant getLoadedAt() { return loadedAt; }
    public ModelMetrics getMetrics() { return metrics; }
}

// 配置类
@Configuration
@EnableConfigurationProperties(InferenceProperties.class)
public class InferenceConfig {

    @Bean
    public ThreadPoolExecutor inferenceExecutor(InferenceProperties properties) {
        return new ThreadPoolExecutor(
            properties.getCorePoolSize(),
            properties.getMaxPoolSize(),
            properties.getKeepAliveTime().toMillis(),
            TimeUnit.MILLISECONDS,
            new LinkedBlockingQueue<>(properties.getQueueCapacity()),
            new ThreadFactoryBuilder()
                .nameFormat("inference-worker-%d")
                .setDaemon(true)
                .build(),
            new ThreadPoolExecutor.CallerRunsPolicy()
        );
    }

    @Bean
    public MetricsCollector metricsCollector(MeterRegistry meterRegistry) {
        return new MetricsCollector(meterRegistry);
    }
}

// 属性配置类
@ConfigurationProperties(prefix = "inference")
@Data
public class InferenceProperties {
    private int corePoolSize = Runtime.getRuntime().availableProcessors();
    private int maxPoolSize = Runtime.getRuntime().availableProcessors() * 2;
    private Duration keepAliveTime = Duration.ofMinutes(1);
    private int queueCapacity = 1000;
    private String modelStoragePath = "./models";
    private boolean enableGpuAcceleration = false;
}

// 请求和响应对象
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PredictionRequest {
    private Object input;
    private Map<String, Object> metadata;
}

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BatchPredictionRequest {
    private List<Object> inputs;
    private Map<String, Object> metadata;
}

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PredictionResponse {
    private Object prediction;
    private String error;
}

@Data
@Builder
public class ModelInfo {
    private List<TensorInfo> inputInfos;
    private List<TensorInfo> outputInfos;
    private ModelType type;
    private long memoryUsage;
}

public enum ModelType {
    IMAGE_CLASSIFICATION,
    TEXT_CLASSIFICATION,
    TABULAR,
    OBJECT_DETECTION,
    SEMANTIC_SEGMENTATION
}

// 指标收集器
@Component
public class MetricsCollector {

    private final MeterRegistry meterRegistry;
    private final Counter inferenceRequests;
    private final Counter inferenceErrors;
    private final Timer inferenceDuration;
    private final Gauge modelMemoryUsage;

    public MetricsCollector(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.inferenceRequests = Counter.builder("inference.requests.total")
            .description("Total inference requests")
            .register(meterRegistry);
        this.inferenceErrors = Counter.builder("inference.errors.total")
            .description("Total inference errors")
            .register(meterRegistry);
        this.inferenceDuration = Timer.builder("inference.duration")
            .description("Inference duration")
            .register(meterRegistry);
        this.modelMemoryUsage = Gauge.builder("model.memory.usage")
            .description("Model memory usage")
            .register(meterRegistry);
    }

    public void recordInference(String modelName, long duration, int inputSize) {
        inferenceRequests.increment(Tags.of("model", modelName));
        inferenceDuration.record(duration, TimeUnit.MILLISECONDS);
    }

    public void recordInferenceError(String modelName, Exception e) {
        inferenceErrors.increment(Tags.of(
            "model", modelName,
            "error", e.getClass().getSimpleName()
        ));
    }

    public void recordBatchInference(String modelName, long totalDuration, int batchSize) {
        inferenceRequests.increment(batchSize, Tags.of("model", modelName));
        inferenceDuration.record(totalDuration, TimeUnit.MILLISECONDS);
    }
}
```

---

## 题目2: ⭐⭐⭐ 容器化部署与Kubernetes编排

**问题描述**:
在现代DevOps环境中，容器化和容器编排是AI模型部署的标准实践。请设计一个完整的容器化部署方案，包括Docker镜像构建、Kubernetes部署配置和CI/CD流水线。

**答案要点**:
- **多阶段构建**: 优化镜像大小和安全性
- **资源配置**: CPU、内存、GPU资源配置
- **健康检查**: Liveness和Readiness探针
- **自动扩缩容**: HPA基于CPU和内存使用率

**代码示例**:
```dockerfile
# Dockerfile - 多阶段构建
# 构建阶段
FROM maven:3.9-openjdk-17 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# 运行时阶段
FROM openjdk:17-jre-slim

# 安装ONNX Runtime依赖
RUN apt-get update && \
    apt-get install -y \
    libgomp1 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 创建应用用户
RUN groupadd -r appuser && useradd -r -g appuser appuser

# 设置工作目录
WORKDIR /app

# 复制应用文件
COPY --from=builder /app/target/*.jar app.jar
COPY src/main/resources/models ./models

# 设置权限
RUN chown -R appuser:appuser /app
USER appuser

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# JVM参数优化
ENV JAVA_OPTS="-Xms512m -Xmx2g -XX:+UseG1GC -XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=75.0 -XX:+UseStringDeduplication"

# 启动应用
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ai-inference
  labels:
    name: ai-inference
    environment: production

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ai-inference-config
  namespace: ai-inference
data:
  application.yml: |
    server:
      port: 8080
    spring:
      application:
        name: ai-inference-service
    management:
      endpoints:
        web:
          exposure:
            include: health,metrics,prometheus
      endpoint:
        health:
          show-details: always
      metrics:
        export:
          prometheus:
            enabled: true
    inference:
      core-pool-size: 4
      max-pool-size: 8
      queue-capacity: 1000
      model-storage-path: /app/models
      enable-gpu-acceleration: "false"
    logging:
      level:
        com.example.ai: INFO
        org.springframework.web: DEBUG

---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: ai-inference-secrets
  namespace: ai-inference
type: Opaque
data:
  # Base64编码的API密钥
  OPENAI_API_KEY: <base64-encoded-key>
  MODEL_STORAGE_ACCESS_KEY: <base64-encoded-key>

---
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-inference-deployment
  namespace: ai-inference
  labels:
    app: ai-inference
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ai-inference
  template:
    metadata:
      labels:
        app: ai-inference
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/actuator/prometheus"
    spec:
      containers:
      - name: ai-inference
        image: your-registry/ai-inference-service:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
          name: http
          protocol: TCP
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "kubernetes"
        - name: JAVA_OPTS
          value: "-Xms1g -Xmx4g -XX:+UseG1GC"
        envFrom:
        - configMapRef:
            name: ai-inference-config
        - secretRef:
            name: ai-inference-secrets
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 30
          timeoutSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        volumeMounts:
        - name: model-storage
          mountPath: /app/models
          readOnly: false
      volumes:
      - name: model-storage
        persistentVolumeClaim:
          claimName: model-storage-pvc
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - ai-inference
              topologyKey: kubernetes.io/hostname

---
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ai-inference-service
  namespace: ai-inference
  labels:
    app: ai-inference
spec:
  type: ClusterIP
  ports:
  - port: 8080
    targetPort: 8080
    protocol: TCP
    name: http
  selector:
    app: ai-inference

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-inference-ingress
  namespace: ai-inference
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - ai-inference.example.com
    secretName: ai-inference-tls
  rules:
  - host: ai-inference.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ai-inference-service
            port:
              number: 8080

---
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-inference-hpa
  namespace: ai-inference
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-inference-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60

---
# k8s/pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: model-storage-pvc
  namespace: ai-inference
spec:
  accessModes:
  - ReadWriteMany
  storageClassName: fast-ssd
  resources:
    requests:
      storage: 10Gi
```

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ai-inference-service

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'

    - name: Cache Maven dependencies
      uses: actions/cache@v3
      with:
        path: ~/.m2
        key: ${{ runner.os }}-m2-${{ hashFiles('**/pom.xml') }}
        restore-keys: ${{ runner.os }}-m2

    - name: Run tests
      run: mvn clean test

    - name: Generate test report
      uses: dorny/test-reporter@v1
      if: success() || failure()
      with:
        name: Maven Tests
        path: target/surefire-reports/*.xml
        reporter: java-junit

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-

    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
    - uses: actions/checkout@v3

    - name: Configure kubectl
      uses: azure/k8s-set-context@v1
      with:
        method: kubeconfig
        kubeconfig: ${{ secrets.KUBE_CONFIG }}

    - name: Deploy to Kubernetes
      run: |
        # 更新镜像标签
        sed -i "s|your-registry/ai-inference-service:latest|${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}|g" k8s/deployment.yaml

        # 应用配置
        kubectl apply -f k8s/namespace.yaml
        kubectl apply -f k8s/configmap.yaml
        kubectl apply -f k8s/secret.yaml
        kubectl apply -f k8s/pvc.yaml
        kubectl apply -f k8s/deployment.yaml
        kubectl apply -f k8s/service.yaml
        kubectl apply -f k8s/ingress.yaml
        kubectl apply -f k8s/hpa.yaml

        # 等待部署完成
        kubectl rollout status deployment/ai-inference-deployment -n ai-inference --timeout=300s

  security-scan:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
        format: 'sarif'
        output: 'trivy-results.sarif'

    - name: Upload Trivy scan results to GitHub Security tab
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

  performance-test:
    needs: deploy
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Set up k6
      run: |
        sudo gpg -k
        sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
        echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
        sudo apt-get update
        sudo apt-get install k6

    - name: Run performance tests
      run: |
        k6 run --out json=performance-results.json tests/performance/load-test.js

    - name: Upload performance results
      uses: actions/upload-artifact@v3
      with:
        name: performance-results
        path: performance-results.json
```

---

## 题目3: ⭐⭐⭐⭐ 模型版本管理与A/B测试

**问题描述**:
在生产环境中，需要进行模型的版本管理和A/B测试来验证新模型的效果。请设计一个完整的模型版本管理系统，支持灰度发布、A/B测试和自动回滚。

**答案要点**:
- **版本控制**: 模型版本的生命周期管理
- **灰度发布**: 渐进式流量分配
- **A/B测试**: 不同模型版本的对比实验
- **自动回滚**: 基于性能指标的自动回滚机制

**代码示例**:
```java
@RestController
@RequestMapping("/api/experiments")
@RequiredArgsConstructor
@Slf4j
public class ExperimentController {

    private final ExperimentService experimentService;
    private final TrafficSplitter trafficSplitter;
    private final MetricsCollector metricsCollector;

    @PostMapping("/ab-test")
    public ResponseEntity<ExperimentResponse> createABTest(@RequestBody ABTestRequest request) {
        try {
            // 1. 验证实验配置
            experimentService.validateABTestConfig(request);

            // 2. 创建A/B测试
            ABTestExperiment experiment = experimentService.createABTest(request);

            // 3. 配置流量分配
            trafficSplitter.configureTrafficSplit(experiment);

            // 4. 启动实验
            experimentService.startExperiment(experiment);

            return ResponseEntity.ok(ExperimentResponse.success(experiment));

        } catch (Exception e) {
            log.error("A/B测试创建失败", e);
            return ResponseEntity.badRequest()
                .body(ExperimentResponse.failure("A/B测试创建失败: " + e.getMessage()));
        }
    }

    @GetMapping("/{experimentId}/results")
    public ResponseEntity<ExperimentResults> getExperimentResults(@PathVariable String experimentId) {
        try {
            ExperimentResults results = experimentService.getExperimentResults(experimentId);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{experimentId}/conclude")
    public ResponseEntity<Void> concludeExperiment(@PathVariable String experimentId,
                                                  @RequestBody ConcludeExperimentRequest request) {
        try {
            experimentService.concludeExperiment(experimentId, request.getWinnerVersion());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{experimentId}/rollback")
    public ResponseEntity<Void> rollbackExperiment(@PathVariable String experimentId) {
        try {
            experimentService.rollbackExperiment(experimentId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}

@Service
@RequiredArgsConstructor
@Slf4j
public class ExperimentService {

    private final ExperimentRepository experimentRepository;
    private final ModelManager modelManager;
    private final MetricsCollector metricsCollector;
    private final NotificationService notificationService;
    private final TrafficSplitter trafficSplitter;

    private final Map<String, ABTestExperiment> activeExperiments = new ConcurrentHashMap<>();

    @Scheduled(fixedRate = 60000) // 每分钟检查一次
    public void monitorExperiments() {
        for (ABTestExperiment experiment : activeExperiments.values()) {
            try {
                checkExperimentHealth(experiment);
                checkExperimentCompletion(experiment);
            } catch (Exception e) {
                log.error("实验监控异常: {}", experiment.getId(), e);
            }
        }
    }

    public ABTestExperiment createABTest(ABTestRequest request) {
        // 1. 验证模型版本
        validateModelVersions(request.getControlVersion(), request.getTestVersions());

        // 2. 创建实验对象
        ABTestExperiment experiment = ABTestExperiment.builder()
            .id(UUID.randomUUID().toString())
            .name(request.getName())
            .description(request.getDescription())
            .controlVersion(request.getControlVersion())
            .testVersions(request.getTestVersions())
            .trafficSplit(request.getTrafficSplit())
            .successMetrics(request.getSuccessMetrics())
            .duration(request.getDuration())
            .startTime(LocalDateTime.now())
            .status(ExperimentStatus.CREATED)
            .build();

        // 3. 保存实验
        experimentRepository.save(experiment);
        activeExperiments.put(experiment.getId(), experiment);

        return experiment;
    }

    public void startExperiment(ABTestExperiment experiment) {
        try {
            // 1. 加载所需模型版本
            loadRequiredModels(experiment);

            // 2. 配置流量分配
            trafficSplitter.configureTrafficSplit(experiment);

            // 3. 启动监控
            startMonitoring(experiment);

            // 4. 更新状态
            experiment.setStatus(ExperimentStatus.RUNNING);
            experimentRepository.save(experiment);

            log.info("A/B测试启动成功: {}", experiment.getId());

        } catch (Exception e) {
            log.error("A/B测试启动失败: {}", experiment.getId(), e);
            experiment.setStatus(ExperimentStatus.FAILED);
            experimentRepository.save(experiment);
            throw new ExperimentException("A/B测试启动失败", e);
        }
    }

    public ExperimentResults getExperimentResults(String experimentId) {
        ABTestExperiment experiment = activeExperiments.get(experimentId);
        if (experiment == null) {
            throw new ExperimentNotFoundException("实验不存在: " + experimentId);
        }

        return calculateExperimentResults(experiment);
    }

    public void concludeExperiment(String experimentId, String winnerVersion) {
        ABTestExperiment experiment = activeExperiments.get(experimentId);
        if (experiment == null) {
            throw new ExperimentNotFoundException("实验不存在: " + experimentId);
        }

        try {
            // 1. 验证获胜版本
            if (!isValidWinnerVersion(experiment, winnerVersion)) {
                throw new InvalidWinnerVersionException("无效的获胜版本: " + winnerVersion);
            }

            // 2. 将所有流量切换到获胜版本
            trafficSplitter.switchAllTrafficTo(winnerVersion);

            // 3. 更新实验状态
            experiment.setStatus(ExperimentStatus.COMPLETED);
            experiment.setWinnerVersion(winnerVersion);
            experiment.setEndTime(LocalDateTime.now());
            experimentRepository.save(experiment);

            // 4. 清理其他版本
            cleanupOtherVersions(experiment, winnerVersion);

            // 5. 移除活跃实验
            activeExperiments.remove(experimentId);

            // 6. 发送通知
            notificationService.sendExperimentCompletedNotification(experiment);

            log.info("A/B测试完成: {}, 获胜版本: {}", experimentId, winnerVersion);

        } catch (Exception e) {
            log.error("A/B测试结论失败: {}", experimentId, e);
            throw new ExperimentException("A/B测试结论失败", e);
        }
    }

    public void rollbackExperiment(String experimentId) {
        ABTestExperiment experiment = activeExperiments.get(experimentId);
        if (experiment == null) {
            throw new ExperimentNotFoundException("实验不存在: " + experimentId);
        }

        try {
            // 1. 恢复到控制版本
            trafficSplitter.switchAllTrafficTo(experiment.getControlVersion());

            // 2. 更新实验状态
            experiment.setStatus(ExperimentStatus.ROLLED_BACK);
            experiment.setEndTime(LocalDateTime.now());
            experimentRepository.save(experiment);

            // 3. 移除活跃实验
            activeExperiments.remove(experimentId);

            // 4. 清理其他版本
            cleanupOtherVersions(experiment, experiment.getControlVersion());

            // 5. 发送通知
            notificationService.sendExperimentRollbackNotification(experiment);

            log.info("A/B测试回滚成功: {}", experimentId);

        } catch (Exception e) {
            log.error("A/B测试回滚失败: {}", experimentId, e);
            throw new ExperimentException("A/B测试回滚失败", e);
        }
    }

    private void validateModelVersions(String controlVersion, List<String> testVersions) {
        // 验证控制版本
        if (!modelManager.isModelLoaded(controlVersion)) {
            throw new ModelNotLoadedException("控制模型未加载: " + controlVersion);
        }

        // 验证测试版本
        for (String testVersion : testVersions) {
            if (!modelManager.isModelLoaded(testVersion)) {
                throw new ModelNotLoadedException("测试模型未加载: " + testVersion);
            }
        }
    }

    private void loadRequiredModels(ABTestExperiment experiment) {
        // 确保所有需要的模型都已加载
        List<String> requiredVersions = new ArrayList<>();
        requiredVersions.add(experiment.getControlVersion());
        requiredVersions.addAll(experiment.getTestVersions());

        for (String version : requiredVersions) {
            if (!modelManager.isModelLoaded(version)) {
                try {
                    modelManager.loadModel(version, "production");
                } catch (Exception e) {
                    throw new ModelLoadException("无法加载模型: " + version, e);
                }
            }
        }
    }

    private void startMonitoring(ABTestExperiment experiment) {
        // 启动性能监控
        for (String version : experiment.getAllVersions()) {
            metricsCollector.startExperimentMonitoring(experiment.getId(), version);
        }
    }

    private void checkExperimentHealth(ABTestExperiment experiment) {
        // 检查各版本的健康状态
        for (String version : experiment.getAllVersions()) {
            if (!isVersionHealthy(version)) {
                log.warn("模型版本健康检查失败: {}", version);

                // 自动降低问题版本的流量
                trafficSplitter.reduceTrafficForVersion(experiment.getId(), version, 0.5);
            }
        }
    }

    private void checkExperimentCompletion(ABTestExperiment experiment) {
        // 检查实验是否达到预设条件
        if (isExperimentComplete(experiment)) {
            log.info("A/B测试自动完成: {}", experiment.getId());

            // 自动选择获胜版本
            String winnerVersion = selectWinnerVersion(experiment);
            concludeExperiment(experiment.getId(), winnerVersion);
        }
    }

    private boolean isExperimentComplete(ABTestExperiment experiment) {
        // 检查时间条件
        if (experiment.getDuration() != null) {
            Duration elapsed = Duration.between(experiment.getStartTime(), LocalDateTime.now());
            if (elapsed.compareTo(experiment.getDuration()) >= 0) {
                return true;
            }
        }

        // 检查样本数量条件
        ExperimentResults results = calculateExperimentResults(experiment);
        long totalRequests = results.getTotalRequests();
        if (totalRequests >= 10000) { // 最小样本量
            return true;
        }

        // 检查统计显著性
        return results.isStatisticallySignificant();
    }

    private String selectWinnerVersion(ABTestExperiment experiment) {
        ExperimentResults results = calculateExperimentResults(experiment);

        // 根据成功指标选择最佳版本
        String bestVersion = experiment.getControlVersion();
        double bestScore = results.getVersionMetrics(bestVersion).getSuccessRate();

        for (String testVersion : experiment.getTestVersions()) {
            double score = results.getVersionMetrics(testVersion).getSuccessRate();
            if (score > bestScore) {
                bestScore = score;
                bestVersion = testVersion;
            }
        }

        return bestVersion;
    }

    private boolean isVersionHealthy(String version) {
        try {
            ModelMetrics metrics = modelManager.getModelMetrics(version);

            // 检查错误率
            double errorRate = metrics.getErrorRate();
            if (errorRate > 0.05) { // 错误率超过5%
                return false;
            }

            // 检查平均响应时间
            double avgResponseTime = metrics.getAverageResponseTime();
            if (avgResponseTime > 5000) { // 响应时间超过5秒
                return false;
            }

            // 检查内存使用率
            double memoryUsage = metrics.getMemoryUsagePercentage();
            if (memoryUsage > 0.90) { // 内存使用率超过90%
                return false;
            }

            return true;

        } catch (Exception e) {
            log.error("健康检查异常: {}", version, e);
            return false;
        }
    }

    private ExperimentResults calculateExperimentResults(ABTestExperiment experiment) {
        Map<String, VersionMetrics> versionMetrics = new HashMap<>();

        for (String version : experiment.getAllVersions()) {
            VersionMetrics metrics = calculateVersionMetrics(experiment.getId(), version);
            versionMetrics.put(version, metrics);
        }

        return ExperimentResults.builder()
            .experimentId(experiment.getId())
            .versionMetrics(versionMetrics)
            .startTime(experiment.getStartTime())
            .endTime(experiment.getEndTime())
            .totalRequests(versionMetrics.values().stream()
                .mapToLong(VersionMetrics::getTotalRequests)
                .sum())
            .statisticallySignificant(calculateStatisticalSignificance(versionMetrics))
            .build();
    }

    private VersionMetrics calculateVersionMetrics(String experimentId, String version) {
        // 从指标收集器获取数据
        List<MetricData> metricsData = metricsCollector.getExperimentMetrics(experimentId, version);

        long totalRequests = metricsData.stream()
            .mapToLong(data -> data.getRequestCount())
            .sum();

        long successRequests = metricsData.stream()
            .mapToLong(data -> data.getSuccessCount())
            .sum();

        double averageResponseTime = metricsData.stream()
            .mapToDouble(data -> data.getAverageResponseTime())
            .average()
            .orElse(0.0);

        double successRate = totalRequests > 0 ? (double) successRequests / totalRequests : 0.0;

        return VersionMetrics.builder()
            .version(version)
            .totalRequests(totalRequests)
            .successRequests(successRequests)
            .errorRequests(totalRequests - successRequests)
            .successRate(successRate)
            .averageResponseTime(averageResponseTime)
            .build();
    }

    private boolean calculateStatisticalSignificance(Map<String, VersionMetrics> versionMetrics) {
        // 简化的统计显著性检验
        // 实际应用中应该使用更严格的统计方法，如卡方检验、t检验等

        if (versionMetrics.size() < 2) {
            return false;
        }

        List<VersionMetrics> metrics = new ArrayList<>(versionMetrics.values());
        VersionMetrics control = metrics.get(0);
        VersionMetrics test = metrics.get(1);

        // 计算置信区间重叠
        double controlErrorMargin = calculateErrorMargin(control);
        double testErrorMargin = calculateErrorMargin(test);

        double controlLower = control.getSuccessRate() - controlErrorMargin;
        double controlUpper = control.getSuccessRate() + controlErrorMargin;
        double testLower = test.getSuccessRate() - testErrorMargin;
        double testUpper = test.getSuccessRate() + testErrorMargin;

        // 如果置信区间不重叠，则具有统计显著性
        return testLower > controlUpper || controlLower > testUpper;
    }

    private double calculateErrorMargin(VersionMetrics metrics) {
        // 计算95%置信区间的误差边界
        double p = metrics.getSuccessRate();
        double n = metrics.getTotalRequests();
        return 1.96 * Math.sqrt(p * (1 - p) / n);
    }

    private boolean isValidWinnerVersion(ABTestExperiment experiment, String winnerVersion) {
        return experiment.getAllVersions().contains(winnerVersion);
    }

    private void cleanupOtherVersions(ABTestExperiment experiment, String keepVersion) {
        for (String version : experiment.getAllVersions()) {
            if (!version.equals(keepVersion)) {
                try {
                    modelManager.unloadModel(version);
                } catch (Exception e) {
                    log.warn("清理模型版本失败: {}", version, e);
                }
            }
        }
    }
}

@Component
@RequiredArgsConstructor
public class TrafficSplitter {

    private final Map<String, TrafficConfig> trafficConfigs = new ConcurrentHashMap<>();
    private final LoadBalancer loadBalancer;

    public void configureTrafficSplit(ABTestExperiment experiment) {
        TrafficConfig config = TrafficConfig.builder()
            .experimentId(experiment.getId())
            .defaultVersion(experiment.getControlVersion())
            .trafficAllocation(experiment.getTrafficSplit())
            .build();

        trafficConfigs.put(experiment.getId(), config);

        // 配置负载均衡器
        updateLoadBalancerConfig(config);
    }

    public String selectVersion(String experimentId, RequestContext context) {
        TrafficConfig config = trafficConfigs.get(experimentId);
        if (config == null) {
            return null;
        }

        // 基于请求上下文进行流量分配
        double random = Math.random();
        double cumulative = 0.0;

        for (Map.Entry<String, Double> entry : config.getTrafficAllocation().entrySet()) {
            cumulative += entry.getValue();
            if (random < cumulative) {
                return entry.getKey();
            }
        }

        return config.getDefaultVersion();
    }

    public void switchAllTrafficTo(String version) {
        // 更新所有实验配置，将流量切换到指定版本
        for (TrafficConfig config : trafficConfigs.values()) {
            config.getTrafficAllocation().clear();
            config.getTrafficAllocation().put(version, 1.0);
            config.setDefaultVersion(version);
        }

        updateLoadBalancerConfigs();
    }

    public void reduceTrafficForVersion(String experimentId, String version, double reductionFactor) {
        TrafficConfig config = trafficConfigs.get(experimentId);
        if (config != null) {
            Double currentAllocation = config.getTrafficAllocation().get(version);
            if (currentAllocation != null) {
                double newAllocation = currentAllocation * reductionFactor;
                config.getTrafficAllocation().put(version, newAllocation);

                // 重新分配减少的流量
                redistributeTraffic(config, version, currentAllocation - newAllocation);
            }
        }

        updateLoadBalancerConfig(config);
    }

    private void redistributeTraffic(TrafficConfig config, String reducedVersion, double freedTraffic) {
        // 将减少的流量按比例分配给其他版本
        double totalOtherTraffic = config.getTrafficAllocation().entrySet().stream()
            .filter(entry -> !entry.getKey().equals(reducedVersion))
            .mapToDouble(Map.Entry::getValue)
            .sum();

        if (totalOtherTraffic > 0) {
            for (Map.Entry<String, Double> entry : config.getTrafficAllocation().entrySet()) {
                if (!entry.getKey().equals(reducedVersion)) {
                    double additionalTraffic = freedTraffic * (entry.getValue() / totalOtherTraffic);
                    entry.setValue(entry.getValue() + additionalTraffic);
                }
            }
        }
    }

    private void updateLoadBalancerConfig(TrafficConfig config) {
        // 更新负载均衡器配置
        Map<String, Integer> weights = config.getTrafficAllocation().entrySet().stream()
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                entry -> (int) (entry.getValue() * 100)
            ));

        loadBalancer.updateWeights(config.getExperimentId(), weights);
    }

    private void updateLoadBalancerConfigs() {
        for (TrafficConfig config : trafficConfigs.values()) {
            updateLoadBalancerConfig(config);
        }
    }
}
```

---

**总结**: 基于Spring Boot的AI模型服务化部署需要综合考虑容器化、编排、版本管理和流量管理等多个方面。通过合理的架构设计和实现，可以构建出可扩展、高可用、易于维护的AI服务系统。关键在于实现模型的动态加载、性能监控、自动扩缩容和A/B测试等企业级功能。