# CompletableFuture在异步AI管道中的应用 (140题)

## ⭐ 基础题 (1-42)

### 问题1: 使用CompletableFuture构建AI数据处理管道

**面试题**: 如何使用CompletableFuture设计高效的异步AI数据处理管道？

**口语化答案**:
"CompletableFuture非常适合构建AI数据管道。我会设计分阶段的异步处理流水线：

```java
public class AsyncAIDataPipeline {

    // 异步AI数据处理管道
    public static class AIPipeline {
        private final ExecutorService cpuExecutor;
        private final ExecutorService ioExecutor;
        private final ExecutorService aiInferenceExecutor;

        public AIPipeline() {
            int cpuCores = Runtime.getRuntime().availableProcessors();
            this.cpuExecutor = Executors.newFixedThreadPool(cpuCores / 2);
            this.ioExecutor = Executors.newFixedThreadPool(2);
            this.aiInferenceExecutor = Executors.newFixedThreadPool(cpuCores);
        }

        // 完整的AI处理管道
        public CompletableFuture<AIResult> processAsync(RawInputData input) {
            return CompletableFuture
                // 阶段1: 数据加载和预处理 (IO密集型)
                .supplyAsync(() -> loadData(input), ioExecutor)
                .thenApplyAsync(this::validateData, cpuExecutor)
                .thenComposeAsync(this::preprocessData, ioExecutor)

                // 阶段2: 特征提取 (CPU密集型)
                .thenApplyAsync(this::extractFeatures, cpuExecutor)
                .thenApplyAsync(this::normalizeFeatures, cpuExecutor)

                // 阶段3: AI模型推理 (AI专用线程池)
                .thenComposeAsync(this::runInference, aiInferenceExecutor)

                // 阶段4: 后处理和结果格式化
                .thenApplyAsync(this::postprocessResults, cpuExecutor)
                .thenApplyAsync(this::formatOutput, ioExecutor)

                // 异常处理
                .exceptionally(this::handlePipelineError)

                // 超时控制
                .orTimeout(30, TimeUnit.SECONDS);
        }

        // 并行批量处理
        public CompletableFuture<List<AIResult>> processBatch(List<RawInputData> inputs) {
            List<CompletableFuture<AIResult>> futures = inputs.stream()
                .map(this::processAsync)
                .collect(Collectors.toList());

            return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
                .thenApply(v -> futures.stream()
                    .map(CompletableFuture::join)
                    .collect(Collectors.toList()));
        }

        // 流式处理
        public CompletableFuture<Stream<AIResult>> processStream(Stream<RawInputData> inputStream) {
            return CompletableFuture.supplyAsync(() -> {
                return inputStream.parallel()
                    .map(input -> processAsync(input).join())
                    .filter(Objects::nonNull);
            }, cpuExecutor);
        }

        // 私有处理方法
        private PreprocessedData loadData(RawInputData input) {
            System.out.println("加载数据: " + input.getId());
            try {
                Thread.sleep(100); // 模拟IO延迟
                return new PreprocessedData(input.getId(), input.getContent());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("数据加载失败", e);
            }
        }

        private ValidatedData validateData(PreprocessedData data) {
            System.out.println("验证数据: " + data.getId());
            // 数据验证逻辑
            if (data.getContent() == null || data.getContent().isEmpty()) {
                throw new IllegalArgumentException("数据内容为空");
            }
            return new ValidatedData(data.getId(), data.getContent());
        }

        private CompletableFuture<FeatureData> preprocessData(ValidatedData data) {
            return CompletableFuture.supplyAsync(() -> {
                System.out.println("预处理数据: " + data.getId());
                try {
                    Thread.sleep(50); // 模拟预处理时间
                    return new FeatureData(data.getId(), data.getContent());
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("预处理失败", e);
                }
            }, ioExecutor);
        }

        private FeatureVector extractFeatures(FeatureData data) {
            System.out.println("提取特征: " + data.getId());
            // 特征提取逻辑
            double[] features = new double[512];
            Random random = new Random(data.getId().hashCode());
            for (int i = 0; i < features.length; i++) {
                features[i] = random.nextGaussian();
            }
            return new FeatureVector(data.getId(), features);
        }

        private NormalizedVector normalizeFeatures(FeatureVector vector) {
            System.out.println("标准化特征: " + vector.getId());
            double[] features = vector.getFeatures();
            double mean = Arrays.stream(features).average().orElse(0);
            double std = Math.sqrt(Arrays.stream(features)
                .map(x -> Math.pow(x - mean, 2))
                .average().orElse(0));

            double[] normalized = Arrays.stream(features)
                .map(x -> std > 0 ? (x - mean) / std : 0)
                .toArray();

            return new NormalizedVector(vector.getId(), normalized);
        }

        private CompletableFuture<InferenceResult> runInference(NormalizedVector vector) {
            return CompletableFuture.supplyAsync(() -> {
                System.out.println("AI推理: " + vector.getId());
                try {
                    Thread.sleep(200); // 模拟推理时间
                    return new InferenceResult(vector.getId(), 0.95, "classification_result");
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("推理失败", e);
                }
            }, aiInferenceExecutor);
        }

        private ProcessedResult postprocessResults(InferenceResult result) {
            System.out.println("后处理结果: " + result.getId());
            return new ProcessedResult(result.getId(), result.getConfidence(), result.getResult());
        }

        private AIResult formatOutput(ProcessedResult result) {
            System.out.println("格式化输出: " + result.getId());
            return new AIResult(result.getId(), result.getResult(), result.getConfidence(),
                System.currentTimeMillis());
        }

        private AIResult handlePipelineError(Throwable ex) {
            System.err.println("管道处理出错: " + ex.getMessage());
            return new AIResult("error", "处理失败", 0.0, System.currentTimeMillis());
        }

        public void shutdown() {
            cpuExecutor.shutdown();
            ioExecutor.shutdown();
            aiInferenceExecutor.shutdown();
        }
    }

    // 数据类定义
    public static class RawInputData {
        private final String id;
        private final String content;

        public RawInputData(String id, String content) {
            this.id = id;
            this.content = content;
        }

        public String getId() { return id; }
        public String getContent() { return content; }
    }

    public static class PreprocessedData {
        private final String id;
        private final String content;

        public PreprocessedData(String id, String content) {
            this.id = id;
            this.content = content;
        }

        public String getId() { return id; }
        public String getContent() { return content; }
    }

    public static class ValidatedData {
        private final String id;
        private final String content;

        public ValidatedData(String id, String content) {
            this.id = id;
            this.content = content;
        }

        public String getId() { return id; }
        public String getContent() { return content; }
    }

    public static class FeatureData {
        private final String id;
        private final String content;

        public FeatureData(String id, String content) {
            this.id = id;
            this.content = content;
        }

        public String getId() { return id; }
        public String getContent() { return content; }
    }

    public static class FeatureVector {
        private final String id;
        private final double[] features;

        public FeatureVector(String id, double[] features) {
            this.id = id;
            this.features = features;
        }

        public String getId() { return id; }
        public double[] getFeatures() { return features; }
    }

    public static class NormalizedVector {
        private final String id;
        private final double[] normalizedFeatures;

        public NormalizedVector(String id, double[] normalizedFeatures) {
            this.id = id;
            this.normalizedFeatures = normalizedFeatures;
        }

        public String getId() { return id; }
        public double[] getNormalizedFeatures() { return normalizedFeatures; }
    }

    public static class InferenceResult {
        private final String id;
        private final double confidence;
        private final String result;

        public InferenceResult(String id, double confidence, String result) {
            this.id = id;
            this.confidence = confidence;
            this.result = result;
        }

        public String getId() { return id; }
        public double getConfidence() { return confidence; }
        public String getResult() { return result; }
    }

    public static class ProcessedResult {
        private final String id;
        private final double confidence;
        private final String result;

        public ProcessedResult(String id, double confidence, String result) {
            this.id = id;
            this.confidence = confidence;
            this.result = result;
        }

        public String getId() { return id; }
        public double getConfidence() { return confidence; }
        public String getResult() { return result; }
    }

    public static class AIResult {
        private final String id;
        private final String result;
        private final double confidence;
        private final long timestamp;

        public AIResult(String id, String result, double confidence, long timestamp) {
            this.id = id;
            this.result = result;
            this.confidence = confidence;
            this.timestamp = timestamp;
        }

        // getters...
        public String getId() { return id; }
        public String getResult() { return result; }
        public double getConfidence() { return confidence; }
        public long getTimestamp() { return timestamp; }
    }
}
```

## ⭐⭐ 进阶题 (43-98)

### 问题43: 复杂的AI服务编排与依赖管理

**面试题**: 如何使用CompletableFuture编排多个相互依赖的AI服务？

**口语化答案**:
"复杂AI服务编排需要处理依赖关系和错误恢复。我会设计一个服务编排器：

```java
public class AIServiceOrchestrator {

    // AI服务编排器
    public static class ServiceOrchestrator {
        private final Map<String, AIService> services;
        private final ExecutorService executor;

        public ServiceOrchestrator() {
            this.services = new HashMap<>();
            this.executor = Executors.newFixedThreadPool(20);
            initializeServices();
        }

        private void initializeServices() {
            services.put("text_preprocessor", new TextPreprocessingService());
            services.put("image_preprocessor", new ImagePreprocessingService());
            services.put("feature_extractor", new FeatureExtractionService());
            services.put("text_classifier", new TextClassificationService());
            services.put("image_classifier", new ImageClassificationService());
            services.put("sentiment_analyzer", new SentimentAnalysisService());
            services.put("object_detector", new ObjectDetectionService());
            services.put("result_aggregator", new ResultAggregationService());
        }

        // 编排复杂的AI工作流
        public CompletableFuture<AggregatedResult> orchestrateWorkflow(WorkflowRequest request) {
            switch (request.getType()) {
                case MULTIMODAL_ANALYSIS:
                    return orchestrateMultimodalAnalysis(request);
                case PIPELINE_CHAINING:
                    return orchestratePipelineChaining(request);
                case CONDITIONAL_PROCESSING:
                    return orchestrateConditionalProcessing(request);
                default:
                    return CompletableFuture.completedFuture(
                        new AggregatedResult("error", "不支持的工作流类型"));
            }
        }

        // 多模态分析工作流
        private CompletableFuture<AggregatedResult> orchestrateMultimodalAnalysis(WorkflowRequest request) {
            // 并行预处理文本和图像
            CompletableFuture<PreprocessedText> textFuture = services.get("text_preprocessor")
                .processAsync(request.getTextData())
                .thenApplyAsync(result -> (PreprocessedText) result, executor);

            CompletableFuture<PreprocessedImage> imageFuture = services.get("image_preprocessor")
                .processAsync(request.getImageData())
                .thenApplyAsync(result -> (PreprocessedImage) result, executor);

            // 等待预处理完成，然后并行特征提取
            CompletableFuture<TextFeatures> textFeaturesFuture = textFuture
                .thenComposeAsync(text -> services.get("feature_extractor").processAsync(text), executor);

            CompletableFuture<ImageFeatures> imageFeaturesFuture = imageFuture
                .thenComposeAsync(image -> services.get("feature_extractor").processAsync(image), executor);

            // 并行执行分类任务
            CompletableFuture<TextClassificationResult> textClassFuture = textFeaturesFuture
                .thenComposeAsync(features -> services.get("text_classifier").processAsync(features), executor);

            CompletableFuture<ImageClassificationResult> imageClassFuture = imageFeaturesFuture
                .thenComposeAsync(features -> services.get("image_classifier").processAsync(features), executor);

            CompletableFuture<SentimentResult> sentimentFuture = textFeaturesFuture
                .thenComposeAsync(features -> services.get("sentiment_analyzer").processAsync(features), executor);

            CompletableFuture<ObjectDetectionResult> objectFuture = imageFeaturesFuture
                .thenComposeAsync(features -> services.get("object_detector").processAsync(features), executor);

            // 聚合所有结果
            return CompletableFuture.allOf(
                    textClassFuture, imageClassFuture, sentimentFuture, objectFuture)
                .thenApplyAsync(v -> {
                    TextClassificationResult textResult = textClassFuture.join();
                    ImageClassificationResult imageResult = imageClassFuture.join();
                    SentimentResult sentimentResult = sentimentFuture.join();
                    ObjectDetectionResult objectResult = objectFuture.join();

                    return services.get("result_aggregator").process(
                        textResult, imageResult, sentimentResult, objectResult);
                }, executor)
                .exceptionally(this::handleWorkflowError);
        }

        // 管道链式工作流
        private CompletableFuture<AggregatedResult> orchestratePipelineChaining(WorkflowRequest request) {
            return services.get("text_preprocessor")
                .processAsync(request.getTextData())
                .thenComposeAsync(preprocessed -> {
                    // 预处理完成后决定下一步
                    if (preprocessed.getComplexity() > Complexity.HIGH) {
                        return handleComplexText(preprocessed);
                    } else {
                        return handleSimpleText(preprocessed);
                    }
                }, executor)
                .thenApplyAsync(result -> new AggregatedResult("pipeline", result.toString()), executor)
                .exceptionally(this::handleWorkflowError);
        }

        // 条件处理工作流
        private CompletableFuture<AggregatedResult> orchestrateConditionalProcessing(WorkflowRequest request) {
            // 首先进行快速分类
            return services.get("text_classifier")
                .processAsync(request.getTextData())
                .thenComposeAsync(classification -> {
                    // 根据分类结果选择处理路径
                    switch (classification.getCategory()) {
                        case NEWS:
                            return processNewsArticle(request, classification);
                        case REVIEW:
                            return processReview(request, classification);
                        case SOCIAL_MEDIA:
                            return processSocialMedia(request, classification);
                        default:
                            return processGenericText(request, classification);
                    }
                }, executor)
                .thenApplyAsync(result -> new AggregatedResult("conditional", result.toString()), executor);
        }

        private CompletableFuture<ProcessingResult> processComplexText(PreprocessedText text) {
            return services.get("sentiment_analyzer")
                .processAsync(text)
                .thenComposeAsync(sentiment -> {
                    // 基于情感分析结果决定是否需要进一步处理
                    if (sentiment.getSentiment() == Sentiment.NEGATIVE) {
                        return services.get("text_classifier").processAsync(text);
                    } else {
                        return CompletableFuture.completedFuture(new ProcessingResult("positive_text", text.getContent()));
                    }
                }, executor);
        }

        private CompletableFuture<ProcessingResult> processSimpleText(PreprocessedText text) {
            return services.get("text_classifier")
                .processAsync(text)
                .thenApplyAsync(result -> new ProcessingResult("classification", result.toString()), executor);
        }

        private CompletableFuture<ProcessingResult> processNewsArticle(WorkflowRequest request,
                                                                   TextClassificationResult classification) {
            return services.get("text_preprocessor")
                .processAsync(request.getTextData())
                .thenComposeAsync(preprocessed -> {
                    // 新闻文章的专门处理逻辑
                    return services.get("sentiment_analyzer").processAsync(preprocessed);
                }, executor)
                .thenApplyAsync(result -> new ProcessingResult("news_processing", result.toString()), executor);
        }

        private CompletableFuture<ProcessingResult> processReview(WorkflowRequest request,
                                                               TextClassificationResult classification) {
            // 评价处理的特殊逻辑
            return services.get("sentiment_analyzer")
                .processAsync(request.getTextData())
                .thenComposeAsync(sentiment -> {
                    if (sentiment.getRating() < 3) {
                        // 低评分评价需要进一步分析
                        return analyzeNegativeReview(request.getTextData());
                    } else {
                        return CompletableFuture.completedFuture(new ProcessingResult("positive_review", sentiment.toString()));
                    }
                }, executor);
        }

        private CompletableFuture<ProcessingResult> processSocialMedia(WorkflowRequest request,
                                                                    TextClassificationResult classification) {
            // 社交媒体内容的快速处理
            return services.get("text_classifier")
                .processAsync(request.getTextData())
                .thenApplyAsync(result -> new ProcessingResult("social_media", result.toString()), executor);
        }

        private CompletableFuture<ProcessingResult> processGenericText(WorkflowRequest request,
                                                                     TextClassificationResult classification) {
            // 通用文本处理
            return CompletableFuture.supplyAsync(() ->
                new ProcessingResult("generic", classification.toString()), executor);
        }

        private CompletableFuture<ProcessingResult> analyzeNegativeReview(RawInputData text) {
            // 负面评价的深度分析
            return services.get("text_preprocessor")
                .processAsync(text)
                .thenComposeAsync(preprocessed -> {
                    return services.get("feature_extractor").processAsync(preprocessed);
                }, executor)
                .thenApplyAsync(features -> new ProcessingResult("negative_analysis", features.toString()), executor);
        }

        private AggregatedResult handleWorkflowError(Throwable ex) {
            System.err.println("工作流执行出错: " + ex.getMessage());
            return new AggregatedResult("error", "工作流执行失败: " + ex.getMessage());
        }

        // 服务健康检查
        public CompletableFuture<Map<String, Boolean>> healthCheck() {
            List<CompletableFuture<Map.Entry<String, Boolean>>> healthChecks = services.entrySet().stream()
                .map(entry -> entry.getValue().healthCheck()
                    .thenApply(healthy -> Map.entry(entry.getKey(), healthy)))
                .collect(Collectors.toList());

            return CompletableFuture.allOf(healthChecks.toArray(new CompletableFuture[0]))
                .thenApply(v -> healthChecks.stream()
                    .map(CompletableFuture::join)
                    .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue)));
        }

        public void shutdown() {
            executor.shutdown();
        }
    }

    // AI服务接口
    public interface AIService {
        CompletableFuture<ProcessingResult> processAsync(RawInputData input);
        CompletableFuture<Boolean> healthCheck();
    }

    // 具体服务实现（简化）
    public static class TextPreprocessingService implements AIService {
        @Override
        public CompletableFuture<ProcessingResult> processAsync(RawInputData input) {
            return CompletableFuture.supplyAsync(() -> {
                try {
                    Thread.sleep(50); // 模拟处理时间
                    return new PreprocessedText(input.getId(), input.getContent(), Complexity.MEDIUM);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("预处理失败", e);
                }
            });
        }

        @Override
        public CompletableFuture<Boolean> healthCheck() {
            return CompletableFuture.completedFuture(true);
        }
    }

    public static class ImagePreprocessingService implements AIService {
        @Override
        public CompletableFuture<ProcessingResult> processAsync(RawInputData input) {
            return CompletableFuture.supplyAsync(() -> {
                try {
                    Thread.sleep(100); // 图像预处理更耗时
                    return new PreprocessedImage(input.getId(), input.getContent());
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("图像预处理失败", e);
                }
            });
        }

        @Override
        public CompletableFuture<Boolean> healthCheck() {
            return CompletableFuture.completedFuture(true);
        }
    }

    public static class FeatureExtractionService implements AIService {
        @Override
        public CompletableFuture<ProcessingResult> processAsync(RawInputData input) {
            return CompletableFuture.supplyAsync(() -> {
                try {
                    Thread.sleep(80);
                    if (input instanceof PreprocessedText) {
                        return new TextFeatures(input.getId(), new double[512]);
                    } else if (input instanceof PreprocessedImage) {
                        return new ImageFeatures(input.getId(), new double[2048]);
                    }
                    return new ProcessingResult("unknown", "未知输入类型");
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("特征提取失败", e);
                }
            });
        }

        @Override
        public CompletableFuture<Boolean> healthCheck() {
            return CompletableFuture.completedFuture(true);
        }
    }

    // 其他服务类似实现...
    public static class TextClassificationService implements AIService {
        @Override
        public CompletableFuture<ProcessingResult> processAsync(RawInputData input) {
            return CompletableFuture.supplyAsync(() -> {
                try {
                    Thread.sleep(150);
                    return new TextClassificationResult(input.getId(), "NEWS", 0.95);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("分类失败", e);
                }
            });
        }

        @Override
        public CompletableFuture<Boolean> healthCheck() {
            return CompletableFuture.completedFuture(true);
        }
    }

    // 数据类定义
    public static class WorkflowRequest {
        private final WorkflowType type;
        private final RawInputData textData;
        private final RawInputData imageData;

        public WorkflowRequest(WorkflowType type, RawInputData textData, RawInputData imageData) {
            this.type = type;
            this.textData = textData;
            this.imageData = imageData;
        }

        // getters...
        public WorkflowType getType() { return type; }
        public RawInputData getTextData() { return textData; }
        public RawInputData getImageData() { return imageData; }
    }

    public enum WorkflowType {
        MULTIMODAL_ANALYSIS, PIPELINE_CHAINING, CONDITIONAL_PROCESSING
    }

    public enum Complexity {
        LOW, MEDIUM, HIGH
    }

    public static class PreprocessedText extends RawInputData {
        private final Complexity complexity;

        public PreprocessedText(String id, String content, Complexity complexity) {
            super(id, content);
            this.complexity = complexity;
        }

        public Complexity getComplexity() { return complexity; }
    }

    public static class PreprocessedImage extends RawInputData {
        public PreprocessedImage(String id, String content) {
            super(id, content);
        }
    }

    public static class ProcessingResult {
        private final String type;
        private final String content;

        public ProcessingResult(String type, String content) {
            this.type = type;
            this.content = content;
        }

        public String getType() { return type; }
        public String getContent() { return content; }
    }

    public static class AggregatedResult extends ProcessingResult {
        public AggregatedResult(String type, String content) {
            super(type, content);
        }
    }

    // 其他结果类...
    public static class TextFeatures extends ProcessingResult {
        public TextFeatures(String id, double[] features) {
            super("text_features", "features_length_" + features.length);
        }
    }

    public static class ImageFeatures extends ProcessingResult {
        public ImageFeatures(String id, double[] features) {
            super("image_features", "features_length_" + features.length);
        }
    }

    public static class TextClassificationResult extends ProcessingResult {
        private final String category;
        private final double confidence;

        public TextClassificationResult(String id, String category, double confidence) {
            super("text_classification", category);
            this.category = category;
            this.confidence = confidence;
        }

        public String getCategory() { return category; }
        public double getConfidence() { return confidence; }
    }
}
```

## ⭐⭐⭐ 专家题 (99-140)

### 问题99: 基于反应式编程的实时AI推理系统

**面试题**: 如何设计基于CompletableFuture的实时AI推理系统，支持高并发和低延迟？

**口语化答案**:
"实时AI系统需要精细的流控制和背压管理。我会设计一个反应式的推理架构：

```java
public class ReactiveAIInferenceSystem {

    // 实时AI推理引擎
    public static class RealTimeInferenceEngine {
        private final DisruptorQueue<InferenceRequest> requestQueue;
        private final Map<String, AIModel> modelCache;
        private final ExecutorService[] processingPools;
        private final RateLimiter rateLimiter;
        private final CircuitBreaker circuitBreaker;
        private final MetricsCollector metrics;

        public RealTimeInferenceEngine(int concurrency, int queueSize) {
            this.requestQueue = new DisruptorQueue<>(queueSize);
            this.modelCache = new ConcurrentHashMap<>();
            this.processingPools = new ExecutorService[concurrency];
            this.rateLimiter = RateLimiter.create(1000); // 1000 QPS
            this.circuitBreaker = CircuitBreaker.ofDefaults("ai-inference");
            this.metrics = new MetricsCollector();

            initializeProcessingPools(concurrency);
            startProcessingLoop();
        }

        private void initializeProcessingPools(int concurrency) {
            for (int i = 0; i < concurrency; i++) {
                processingPools[i] = Executors.newSingleThreadExecutor(
                    r -> new Thread(r, "AI-Inference-" + i));
            }
        }

        // 提交推理请求
        public CompletableFuture<InferenceResult> submitInference(InferenceRequest request) {
            long startTime = System.nanoTime();

            return CompletableFuture
                // 1. 速率限制
                .supplyAsync(() -> {
                    if (!rateLimiter.tryAcquire()) {
                        throw new RateLimitException("请求速率超限");
                    }
                    return request;
                })

                // 2. 请求入队
                .thenComposeAsync(req -> {
                    CompletableFuture<InferenceRequest> queueFuture = new CompletableFuture<>();
                    requestQueue.offer(req, queueFuture);
                    return queueFuture;
                })

                // 3. 模型加载和预热
                .thenComposeAsync(this::loadAndWarmupModel)

                // 4. 执行推理
                .thenComposeAsync(this::executeInference)

                // 5. 结果后处理
                .thenApplyAsync(this::postprocessResult)

                // 6. 熔断器包装
                .thenApplyAsync(result -> {
                    circuitBreaker.onSuccess(0, TimeUnit.NANOSECONDS);
                    return result;
                })

                // 异常处理
                .exceptionally(ex -> handleInferenceError(request, ex))

                // 性能监控
                .whenComplete((result, ex) -> {
                    long duration = System.nanoTime() - startTime;
                    metrics.recordInference(duration / 1_000_000.0, ex == null);
                })

                // 超时控制
                .orTimeout(5, TimeUnit.SECONDS);
        }

        private CompletableFuture<InferenceRequest> loadAndWarmupModel(InferenceRequest request) {
            return CompletableFuture.supplyAsync(() -> {
                AIModel model = modelCache.computeIfAbsent(request.getModelId(),
                    this::loadModelFromDisk);

                if (!model.isWarmedUp()) {
                    model.warmup();
                }

                request.setModel(model);
                return request;
            });
        }

        private AIModel loadModelFromDisk(String modelId) {
            System.out.println("加载模型: " + modelId);
            try {
                Thread.sleep(1000); // 模拟模型加载时间
                return new AIModel(modelId);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("模型加载失败", e);
            }
        }

        private CompletableFuture<InferenceResult> executeInference(InferenceRequest request) {
            return CompletableFuture.supplyAsync(() -> {
                try {
                    // 选择可用的处理池
                    int poolIndex = selectProcessingPool();
                    return executeInInferencePool(request, poolIndex);
                } catch (Exception e) {
                    throw new RuntimeException("推理执行失败", e);
                }
            });
        }

        private InferenceResult executeInInferencePool(InferenceRequest request, int poolIndex) {
            CompletableFuture<InferenceResult> future = new CompletableFuture<>();
            processingPools[poolIndex].submit(() -> {
                try {
                    AIModel model = request.getModel();
                    InferenceResult result = model.predict(request.getInput());
                    future.complete(result);
                } catch (Exception e) {
                    future.completeExceptionally(e);
                }
            });

            try {
                return future.get(4, TimeUnit.SECONDS);
            } catch (Exception e) {
                throw new RuntimeException("推理超时或失败", e);
            }
        }

        private int selectProcessingPool() {
            // 使用轮询或负载均衡选择处理池
            return (int) (System.currentTimeMillis() % processingPools.length);
        }

        private InferenceResult postprocessResult(InferenceResult result) {
            // 结果后处理
            if (result.getConfidence() < 0.5) {
                result.setStatus("LOW_CONFIDENCE");
            } else {
                result.setStatus("SUCCESS");
            }
            return result;
        }

        private InferenceResult handleInferenceError(InferenceRequest request, Throwable ex) {
            circuitBreaker.onError(0, TimeUnit.NANOSECONDS, ex);

            if (ex.getCause() instanceof RateLimitException) {
                return new InferenceResult(request.getId(), "RATE_LIMITED", 0.0);
            } else if (ex instanceof TimeoutException) {
                return new InferenceResult(request.getId(), "TIMEOUT", 0.0);
            } else if (ex instanceof CallNotPermittedException) {
                return new InferenceResult(request.getId(), "CIRCUIT_OPEN", 0.0);
            } else {
                return new InferenceResult(request.getId(), "ERROR", 0.0);
            }
        }

        private void startProcessingLoop() {
            for (ExecutorService pool : processingPools) {
                pool.submit(() -> {
                    while (!Thread.currentThread().isInterrupted()) {
                        try {
                            InferenceRequest request = requestQueue.take();
                            if (request.getFuture() != null) {
                                request.getFuture().complete(request);
                            }
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                    }
                });
            }
        }

        // 批量推理优化
        public CompletableFuture<List<InferenceResult>> submitBatchInference(
                List<InferenceRequest> requests) {

            // 按模型分组进行批量处理
            Map<String, List<InferenceRequest>> modelGroups = requests.stream()
                .collect(Collectors.groupingBy(InferenceRequest::getModelId));

            List<CompletableFuture<List<InferenceResult>>> batchFutures = new ArrayList<>();

            for (Map.Entry<String, List<InferenceRequest>> entry : modelGroups.entrySet()) {
                String modelId = entry.getKey();
                List<InferenceRequest> modelRequests = entry.getValue();

                CompletableFuture<List<InferenceResult>> batchFuture = processBatchForModel(
                    modelId, modelRequests);
                batchFutures.add(batchFuture);
            }

            return CompletableFuture.allOf(batchFutures.toArray(new CompletableFuture[0]))
                .thenApply(v -> batchFutures.stream()
                    .flatMap(future -> future.join().stream())
                    .collect(Collectors.toList()));
        }

        private CompletableFuture<List<InferenceResult>> processBatchForModel(
                String modelId, List<InferenceRequest> requests) {

            return CompletableFuture.supplyAsync(() -> {
                AIModel model = modelCache.get(modelId);
                if (model == null) {
                    return requests.stream()
                        .map(req -> new InferenceResult(req.getId(), "MODEL_NOT_FOUND", 0.0))
                        .collect(Collectors.toList());
                }

                // 批量推理
                List<InferenceInput> batchInputs = requests.stream()
                    .map(InferenceRequest::getInput)
                    .collect(Collectors.toList());

                List<InferenceResult> batchResults = model.predictBatch(batchInputs);

                // 匹配结果
                for (int i = 0; i < requests.size(); i++) {
                    batchResults.get(i).setId(requests.get(i).getId());
                }

                return batchResults;
            });
        }

        // 获取性能指标
        public InferenceMetrics getMetrics() {
            return metrics.getSnapshot();
        }

        public void shutdown() {
            for (ExecutorService pool : processingPools) {
                pool.shutdown();
            }
        }
    }

    // 高性能队列实现
    public static class DisruptorQueue<T> {
        private final T[] buffer;
        private final AtomicInteger tail = new AtomicInteger(0);
        private final AtomicInteger head = new AtomicInteger(0);
        private final AtomicInteger size = new AtomicInteger(0);
        private final int capacity;

        @SuppressWarnings("unchecked")
        public DisruptorQueue(int capacity) {
            this.capacity = capacity;
            this.buffer = (T[]) new Object[capacity];
        }

        public boolean offer(T item, CompletableFuture<T> future) {
            int currentSize = size.get();
            if (currentSize >= capacity) {
                if (future != null) {
                    future.completeExceptionally(new QueueFullException("队列已满"));
                }
                return false;
            }

            int currentTail = tail.get();
            int nextTail = (currentTail + 1) % capacity;

            if (tail.compareAndSet(currentTail, nextTail)) {
                buffer[currentTail] = item;
                size.incrementAndGet();
                if (future != null) {
                    // 对于Disruptor，future应该在其他地方完成
                }
                return true;
            }

            return offer(item, future); // 重试
        }

        public T take() throws InterruptedException {
            while (size.get() == 0) {
                Thread.sleep(1);
            }

            int currentHead = head.get();
            int nextHead = (currentHead + 1) % capacity;

            if (head.compareAndSet(currentHead, nextHead)) {
                T item = buffer[currentHead];
                buffer[currentHead] = null;
                size.decrementAndGet();
                return item;
            }

            return take(); // 重试
        }

        public int size() {
            return size.get();
        }
    }

    // AI模型类
    public static class AIModel {
        private final String modelId;
        private volatile boolean warmedUp = false;
        private final Random random = new Random(modelId.hashCode());

        public AIModel(String modelId) {
            this.modelId = modelId;
        }

        public InferenceResult predict(InferenceInput input) {
            try {
                Thread.sleep(50 + random.nextInt(100)); // 模拟推理时间
                double confidence = 0.5 + random.nextDouble() * 0.5;
                return new InferenceResult("", "prediction_" + modelId, confidence);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("推理被中断", e);
            }
        }

        public List<InferenceResult> predictBatch(List<InferenceInput> inputs) {
            return inputs.stream()
                .map(this::predict)
                .collect(Collectors.toList());
        }

        public void warmup() {
            if (warmedUp) return;

            try {
                // 模型预热
                for (int i = 0; i < 10; i++) {
                    predict(new InferenceInput("warmup_" + i));
                }
                warmedUp = true;
                System.out.println("模型预热完成: " + modelId);
            } catch (Exception e) {
                System.err.println("模型预热失败: " + modelId);
            }
        }

        public boolean isWarmedUp() { return warmedUp; }
        public String getModelId() { return modelId; }
    }

    // 推理请求
    public static class InferenceRequest {
        private final String id;
        private final String modelId;
        private final InferenceInput input;
        private volatile AIModel model;
        private CompletableFuture<InferenceRequest> future;

        public InferenceRequest(String id, String modelId, InferenceInput input) {
            this.id = id;
            this.modelId = modelId;
            this.input = input;
        }

        // getters and setters...
        public String getId() { return id; }
        public String getModelId() { return modelId; }
        public InferenceInput getInput() { return input; }
        public AIModel getModel() { return model; }
        public void setModel(AIModel model) { this.model = model; }
        public CompletableFuture<InferenceRequest> getFuture() { return future; }
        public void setFuture(CompletableFuture<InferenceRequest> future) { this.future = future; }
    }

    // 推理输入
    public static class InferenceInput {
        private final String data;

        public InferenceInput(String data) {
            this.data = data;
        }

        public String getData() { return data; }
    }

    // 推理结果
    public static class InferenceResult {
        private String id;
        private String result;
        private double confidence;
        private String status = "PROCESSING";

        public InferenceResult(String id, String result, double confidence) {
            this.id = id;
            this.result = result;
            this.confidence = confidence;
        }

        // getters and setters...
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getResult() { return result; }
        public double getConfidence() { return confidence; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    // 指标收集器
    public static class MetricsCollector {
        private final AtomicLong totalInferences = new AtomicLong(0);
        private final AtomicLong failedInferences = new AtomicLong(0);
        private final AtomicLong totalLatency = new AtomicLong(0);
        private final ConcurrentSkipListSet<Long> latencies = new ConcurrentSkipListSet<>();

        public void recordInference(double latencyMs, boolean success) {
            totalInferences.incrementAndGet();
            totalLatency.addAndGet((long) (latencyMs * 1000)); // 微秒
            latencies.add((long) (latencyMs * 1000));

            if (!success) {
                failedInferences.incrementAndGet();
            }

            // 保持最近10000个样本
            while (latencies.size() > 10000) {
                latencies.pollFirst();
            }
        }

        public InferenceMetrics getSnapshot() {
            long total = totalInferences.get();
            long failed = failedInferences.get();
            long latencySum = totalLatency.get();

            double avgLatency = total > 0 ? latencySum / (double) total / 1000.0 : 0;
            double successRate = total > 0 ? (total - failed) / (double) total : 0;

            // 计算P99延迟
            double p99Latency = calculatePercentile(0.99);

            return new InferenceMetrics(total, avgLatency, p99Latency, successRate);
        }

        private double calculatePercentile(double percentile) {
            if (latencies.isEmpty()) return 0;

            int index = (int) Math.ceil(percentile * latencies.size()) - 1;
            long[] latencyArray = latencies.stream().mapToLong(Long::longValue).toArray();
            Arrays.sort(latencyArray);

            return latencyArray[index] / 1000.0; // 转换为毫秒
        }
    }

    // 推理指标
    public static class InferenceMetrics {
        private final long totalInferences;
        private final double avgLatencyMs;
        private final double p99LatencyMs;
        private final double successRate;

        public InferenceMetrics(long totalInferences, double avgLatencyMs,
                              double p99LatencyMs, double successRate) {
            this.totalInferences = totalInferences;
            this.avgLatencyMs = avgLatencyMs;
            this.p99LatencyMs = p99LatencyMs;
            this.successRate = successRate;
        }

        @Override
        public String toString() {
            return String.format(
                "推理指标 - 总数: %d, 平均延迟: %.2fms, P99延迟: %.2fms, 成功率: %.2f%%",
                totalInferences, avgLatencyMs, p99LatencyMs, successRate * 100
            );
        }
    }

    // 自定义异常类
    public static class RateLimitException extends RuntimeException {
        public RateLimitException(String message) {
            super(message);
        }
    }

    public static class QueueFullException extends RuntimeException {
        public QueueFullException(String message) {
            super(message);
        }
    }

    // 使用示例
    public static void main(String[] args) throws InterruptedException {
        System.out.println("=== 实时AI推理系统测试 ===");

        RealTimeInferenceEngine engine = new RealTimeInferenceEngine(8, 1000);

        // 单个推理测试
        List<CompletableFuture<InferenceResult>> singleInferences = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            InferenceRequest request = new InferenceRequest(
                "req_" + i,
                "model_" + (i % 3),
                new InferenceInput("input_data_" + i)
            );

            singleInferences.add(engine.submitInference(request));
        }

        // 批量推理测试
        List<InferenceRequest> batchRequests = new ArrayList<>();
        for (int i = 100; i < 200; i++) {
            batchRequests.add(new InferenceRequest(
                "batch_" + i,
                "model_1",
                new InferenceInput("batch_input_" + i)
            ));
        }

        CompletableFuture<List<InferenceResult>> batchInference = engine.submitBatchInference(batchRequests);

        // 等待结果
        CompletableFuture<Void> allInferences = CompletableFuture.allOf(
            singleInferences.toArray(new CompletableFuture[0]));

        try {
            allInference.get(30, TimeUnit.SECONDS);
            System.out.println("单个推理完成: " + singleInferences.size() + " 个请求");

            List<InferenceResult> batchResults = batchInference.get(30, TimeUnit.SECONDS);
            System.out.println("批量推理完成: " + batchResults.size() + " 个请求");

            // 打印性能指标
            Thread.sleep(2000); // 等待指标更新
            InferenceMetrics metrics = engine.getMetrics();
            System.out.println("性能指标: " + metrics);

        } catch (Exception e) {
            System.err.println("推理测试出错: " + e.getMessage());
        } finally {
            engine.shutdown();
        }
    }
}
```

## 💡 面试技巧提示

### CompletableFuture面试要点：

1. **异步管道设计**: 分阶段处理和异常处理
2. **服务编排**: 复杂依赖关系的管理
3. **性能优化**: 背压、速率限制、批量处理
4. **反应式编程**: 实时系统和低延迟处理
5. **错误恢复**: 熔断器、重试机制

### 常见错误：
- 不了解CompletableFuture的最佳实践
- 忽略异步编程中的异常处理
- 没有考虑背压和流控制
- 缺乏性能监控和指标收集
- 不了解反应式编程的核心概念

通过这些题目，面试官能全面考察候选人对异步编程和现代Java并发特性的掌握程度。