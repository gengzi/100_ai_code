# MLflow模型生命周期管理实战

## 🎯 面试题目

### 题目1：完整的MLOps CI/CD流水线实现 ⭐⭐⭐⭐⭐
**问题**：设计和实现一个完整的MLOps CI/CD流水线，包括数据版本控制、模型训练、评估、部署和监控。

**核心原理**：
MLOps CI/CD流水线包含以下关键组件：
- **持续集成**：代码和数据变更的自动测试
- **持续训练**：自动模型训练和验证
- **持续部署**：模型部署和版本管理
- **持续监控**：模型性能和数据漂移监控

**核心代码示例**：

```java
import java.util.*;
import java.time.LocalDateTime;

/**
 * MLOps CI/CD流水线管理系统
 */
public class MLOpsPipeline {

    // 模型版本管理器
    public static class ModelVersionManager {
        private final Map<String, List<ModelVersion>> modelRegistry;
        private final String storagePath;

        public ModelVersionManager(String storagePath) {
            this.storagePath = storagePath;
            this.modelRegistry = new HashMap<>();
        }

        public ModelVersion registerModel(String modelName, String modelPath,
                                         Map<String, Object> metadata,
                                         ModelMetrics metrics) {
            // 生成版本号
            String version = generateVersionNumber(modelName);

            // 创建模型版本记录
            ModelVersion modelVersion = new ModelVersion(
                modelName, version, modelPath, metadata, metrics,
                LocalDateTime.now(), "production"
            );

            // 存储到注册表
            modelRegistry.computeIfAbsent(modelName, k -> new ArrayList<>())
                       .add(modelVersion);

            // 保存模型文件
            saveModelFiles(modelVersion);

            System.out.printf("模型已注册: %s v%s%n", modelName, version);

            return modelVersion;
        }

        private String generateVersionNumber(String modelName) {
            List<ModelVersion> versions = modelRegistry.getOrDefault(modelName, Collections.emptyList());
            int nextVersion = versions.size() + 1;
            return String.format("%d", nextVersion);
        }

        private void saveModelFiles(ModelVersion modelVersion) {
            // 模拟保存模型文件到存储系统
            System.out.printf("保存模型文件到: %s/%s/v%s%n",
                             storagePath, modelVersion.getModelName(), modelVersion.getVersion());
        }

        public ModelVersion getLatestModel(String modelName, String stage) {
            List<ModelVersion> versions = modelRegistry.getOrDefault(modelName, Collections.emptyList());

            return versions.stream()
                .filter(v -> v.getStage().equals(stage))
                .max(Comparator.comparing(ModelVersion::getCreatedTime))
                .orElse(null);
        }

        public List<ModelVersion> getModelHistory(String modelName) {
            return new ArrayList<>(modelRegistry.getOrDefault(modelName, Collections.emptyList()));
        }
    }

    // 模型版本类
    public static class ModelVersion {
        private final String modelName;
        private final String version;
        private final String modelPath;
        private final Map<String, Object> metadata;
        private final ModelMetrics metrics;
        private final LocalDateTime createdTime;
        private String stage; // staging, production, archived

        public ModelVersion(String modelName, String version, String modelPath,
                          Map<String, Object> metadata, ModelMetrics metrics,
                          LocalDateTime createdTime, String stage) {
            this.modelName = modelName;
            this.version = version;
            this.modelPath = modelPath;
            this.metadata = new HashMap<>(metadata);
            this.metrics = metrics;
            this.createdTime = createdTime;
            this.stage = stage;
        }

        // Getters
        public String getModelName() { return modelName; }
        public String getVersion() { return version; }
        public String getModelPath() { return modelPath; }
        public Map<String, Object> getMetadata() { return Collections.unmodifiableMap(metadata); }
        public ModelMetrics getMetrics() { return metrics; }
        public LocalDateTime getCreatedTime() { return createdTime; }
        public String getStage() { return stage; }

        public void setStage(String stage) { this.stage = stage; }
    }

    // 模型指标类
    public static class ModelMetrics {
        private final double accuracy;
        private final double precision;
        private final double recall;
        private final double f1Score;
        private final double auc;
        private final Map<String, Double> customMetrics;

        public ModelMetrics(double accuracy, double precision, double recall,
                          double f1Score, double auc, Map<String, Double> customMetrics) {
            this.accuracy = accuracy;
            this.precision = precision;
            this.recall = recall;
            this.f1Score = f1Score;
            this.auc = auc;
            this.customMetrics = new HashMap<>(customMetrics);
        }

        // Getters
        public double getAccuracy() { return accuracy; }
        public double getPrecision() { return precision; }
        public double getRecall() { return recall; }
        public double getF1Score() { return f1Score; }
        public double getAuc() { return auc; }
        public Map<String, Double> getCustomMetrics() { return Collections.unmodifiableMap(customMetrics); }

        @Override
        public String toString() {
            return String.format(
                "ModelMetrics{accuracy=%.4f, precision=%.4f, recall=%.4f, f1Score=%.4f, auc=%.4f}",
                accuracy, precision, recall, f1Score, auc
            );
        }
    }

    // CI/CD流水线管理器
    public static class CICDPipelineManager {
        private final ModelVersionManager versionManager;
        private final DataVersionManager dataVersionManager;
        private final ModelTrainer modelTrainer;
        private final ModelEvaluator modelEvaluator;
        private final ModelDeployer modelDeployer;
        private final ModelMonitor modelMonitor;

        public CICDPipelineManager(String storagePath) {
            this.versionManager = new ModelVersionManager(storagePath + "/models");
            this.dataVersionManager = new DataVersionManager(storagePath + "/data");
            this.modelTrainer = new ModelTrainer();
            this.modelEvaluator = new ModelEvaluator();
            this.modelDeployer = new ModelDeployer();
            this.modelMonitor = new ModelMonitor();
        }

        public PipelineExecutionResult executePipeline(PipelineConfig config) {
            System.out.println("开始执行MLOps CI/CD流水线...");
            long startTime = System.currentTimeMillis();

            try {
                // 1. 数据准备和版本控制
                String dataVersion = dataVersionManager.registerDataset(
                    config.getTrainingDataPath(),
                    config.getValidationDataPath(),
                    config.getDataConfig()
                );

                // 2. 模型训练
                String trainedModelPath = modelTrainer.train(
                    config.getModelConfig(),
                    dataVersionManager.getDatasetPath(dataVersion)
                );

                // 3. 模型评估
                ModelMetrics metrics = modelEvaluator.evaluate(
                    trainedModelPath,
                    dataVersionManager.getValidationDataPath(dataVersion),
                    config.getEvaluationConfig()
                );

                // 4. 模型注册
                ModelVersion modelVersion = versionManager.registerModel(
                    config.getModelName(),
                    trainedModelPath,
                    Map.of(
                        "data_version", dataVersion,
                        "config_hash", config.getConfigHash(),
                        "git_commit", config.getGitCommit()
                    ),
                    metrics
                );

                // 5. 模型部署（如果满足条件）
                boolean deployed = false;
                if (shouldDeploy(metrics, config)) {
                    deployed = modelDeployer.deploy(modelVersion, config.getDeploymentConfig());
                    if (deployed) {
                        modelVersion.setStage("production");
                    }
                }

                // 6. 启动监控
                if (deployed) {
                    modelMonitor.startMonitoring(modelVersion, config.getMonitoringConfig());
                }

                long endTime = System.currentTimeMillis();
                System.out.printf("流水线执行完成，耗时: %.2f秒%n", (endTime - startTime) / 1000.0);

                return new PipelineExecutionResult(
                    true,
                    modelVersion,
                    metrics,
                    deployed,
                    (endTime - startTime) / 1000.0
                );

            } catch (Exception e) {
                System.err.printf("流水线执行失败: %s%n", e.getMessage());
                return new PipelineExecutionResult(false, null, null, false, 0);
            }
        }

        private boolean shouldDeploy(ModelMetrics metrics, PipelineConfig config) {
            // 检查模型是否满足部署条件
            return metrics.getAccuracy() >= config.getMinAccuracy() &&
                   metrics.getF1Score() >= config.getMinF1Score() &&
                   metrics.getAuc() >= config.getMinAuc();
        }
    }

    // 流水线配置类
    public static class PipelineConfig {
        private final String modelName;
        private final String trainingDataPath;
        private final String validationDataPath;
        private final Map<String, Object> modelConfig;
        private final Map<String, Object> dataConfig;
        private final Map<String, Object> evaluationConfig;
        private final Map<String, Object> deploymentConfig;
        private final Map<String, Object> monitoringConfig;
        private final double minAccuracy;
        private final double minF1Score;
        private final double minAuc;
        private final String gitCommit;

        public PipelineConfig(String modelName, String trainingDataPath, String validationDataPath,
                             Map<String, Object> modelConfig, Map<String, Object> dataConfig,
                             Map<String, Object> evaluationConfig, Map<String, Object> deploymentConfig,
                             Map<String, Object> monitoringConfig, double minAccuracy,
                             double minF1Score, double minAuc, String gitCommit) {
            this.modelName = modelName;
            this.trainingDataPath = trainingDataPath;
            this.validationDataPath = validationDataPath;
            this.modelConfig = new HashMap<>(modelConfig);
            this.dataConfig = new HashMap<>(dataConfig);
            this.evaluationConfig = new HashMap<>(evaluationConfig);
            this.deploymentConfig = new HashMap<>(deploymentConfig);
            this.monitoringConfig = new HashMap<>(monitoringConfig);
            this.minAccuracy = minAccuracy;
            this.minF1Score = minF1Score;
            this.minAuc = minAuc;
            this.gitCommit = gitCommit;
        }

        // Getters
        public String getModelName() { return modelName; }
        public String getTrainingDataPath() { return trainingDataPath; }
        public String getValidationDataPath() { return validationDataPath; }
        public Map<String, Object> getModelConfig() { return Collections.unmodifiableMap(modelConfig); }
        public Map<String, Object> getDataConfig() { return Collections.unmodifiableMap(dataConfig); }
        public Map<String, Object> getEvaluationConfig() { return Collections.unmodifiableMap(evaluationConfig); }
        public Map<String, Object> getDeploymentConfig() { return Collections.unmodifiableMap(deploymentConfig); }
        public Map<String, Object> getMonitoringConfig() { return Collections.unmodifiableMap(monitoringConfig); }
        public double getMinAccuracy() { return minAccuracy; }
        public double getMinF1Score() { return minF1Score; }
        public double getMinAuc() { return minAuc; }
        public String getGitCommit() { return gitCommit; }

        public String getConfigHash() {
            return Integer.toHexString(Objects.hash(modelConfig, dataConfig, evaluationConfig));
        }
    }

    // 流水线执行结果类
    public static class PipelineExecutionResult {
        private final boolean success;
        private final ModelVersion modelVersion;
        private final ModelMetrics metrics;
        private final boolean deployed;
        private final double executionTime;

        public PipelineExecutionResult(boolean success, ModelVersion modelVersion,
                                     ModelMetrics metrics, boolean deployed, double executionTime) {
            this.success = success;
            this.modelVersion = modelVersion;
            this.metrics = metrics;
            this.deployed = deployed;
            this.executionTime = executionTime;
        }

        // Getters
        public boolean isSuccess() { return success; }
        public ModelVersion getModelVersion() { return modelVersion; }
        public ModelMetrics getMetrics() { return metrics; }
        public boolean isDeployed() { return deployed; }
        public double getExecutionTime() { return executionTime; }

        @Override
        public String toString() {
            if (!success) {
                return "PipelineExecutionResult{success=false}";
            }
            return String.format(
                "PipelineExecutionResult{success=true, model=%s v%s, metrics=%s, deployed=%s, time=%.2fs}",
                modelVersion.getModelName(), modelVersion.getVersion(),
                metrics, deployed, executionTime
            );
        }
    }

    // 辅助类（简化实现）
    public static class DataVersionManager {
        private final String storagePath;
        private final Map<String, String> datasetRegistry;

        public DataVersionManager(String storagePath) {
            this.storagePath = storagePath;
            this.datasetRegistry = new HashMap<>();
        }

        public String registerDataset(String trainingPath, String validationPath, Map<String, Object> config) {
            String version = UUID.randomUUID().toString().substring(0, 8);
            datasetRegistry.put(version, trainingPath + "|" + validationPath);
            System.out.printf("数据集已注册: v%s%n", version);
            return version;
        }

        public String getDatasetPath(String version) {
            return datasetRegistry.get(version);
        }

        public String getValidationDataPath(String version) {
            String paths = datasetRegistry.get(version);
            return paths != null ? paths.split("\\|")[1] : null;
        }
    }

    public static class ModelTrainer {
        public String train(Map<String, Object> config, String dataPath) {
            System.out.printf("开始训练模型，数据: %s%n", dataPath);
            // 模拟训练过程
            try {
                Thread.sleep(2000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            String modelPath = "/tmp/models/" + UUID.randomUUID().toString() + ".pkl";
            System.out.printf("模型训练完成: %s%n", modelPath);
            return modelPath;
        }
    }

    public static class ModelEvaluator {
        public ModelMetrics evaluate(String modelPath, String validationPath, Map<String, Object> config) {
            System.out.printf("开始评估模型: %s%n", modelPath);
            // 模拟评估过程
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }

            // 返回模拟的评估结果
            Random random = new Random();
            return new ModelMetrics(
                0.85 + random.nextDouble() * 0.1,  // accuracy
                0.83 + random.nextDouble() * 0.1,  // precision
                0.87 + random.nextDouble() * 0.1,  // recall
                0.85 + random.nextDouble() * 0.1,  // f1Score
                0.88 + random.nextDouble() * 0.1,  // auc
                Map.of("latency_ms", 50.0 + random.nextDouble() * 20)
            );
        }
    }

    public static class ModelDeployer {
        public boolean deploy(ModelVersion modelVersion, Map<String, Object> config) {
            System.out.printf("开始部署模型: %s v%s%n",
                             modelVersion.getModelName(), modelVersion.getVersion());
            // 模拟部署过程
            try {
                Thread.sleep(3000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            System.out.println("模型部署成功");
            return true;
        }
    }

    public static class ModelMonitor {
        public void startMonitoring(ModelVersion modelVersion, Map<String, Object> config) {
            System.out.printf("开始监控模型: %s v%s%n",
                             modelVersion.getModelName(), modelVersion.getVersion());
            // 启动监控任务
        }
    }

    // 测试示例
    public static void main(String[] args) {
        // 创建流水线管理器
        CICDPipelineManager pipelineManager = new CICDPipelineManager("/tmp/mlops");

        // 配置流水线
        PipelineConfig config = new PipelineConfig(
            "credit-scoring-model",
            "/data/training.csv",
            "/data/validation.csv",
            Map.of("algorithm", "xgboost", "max_depth", 6, "learning_rate", 0.1),
            Map.of("preprocessing", "standard", "feature_selection", true),
            Map.of("metrics", Arrays.asList("accuracy", "precision", "recall", "f1", "auc")),
            Map.of("environment", "production", "replicas", 3, "memory_limit", "2Gi"),
            Map.of("drift_detection", true, "performance_threshold", 0.05),
            0.8,  // minAccuracy
            0.75, // minF1Score
            0.85, // minAuc
            "abc123def456" // git commit
        );

        // 执行流水线
        PipelineExecutionResult result = pipelineManager.executePipeline(config);

        // 输出结果
        System.out.println("\n=== 流水线执行结果 ===");
        System.out.println(result);

        if (result.isSuccess()) {
            System.out.println("\n=== 模型版本信息 ===");
            ModelVersion version = result.getModelVersion();
            System.out.printf("模型名称: %s%n", version.getModelName());
            System.out.printf("版本号: %s%n", version.getVersion());
            System.out.printf("阶段: %s%n", version.getStage());
            System.out.printf("创建时间: %s%n", version.getCreatedTime());
            System.out.printf("模型指标: %s%n", version.getMetrics());
        }
    }
}
```

## 🎓 面试要点总结

### 关键概念
1. **MLOps核心**：CI/CD、自动化、版本控制、监控
2. **模型生命周期**：开发、训练、评估、部署、监控、退役
3. **工具链**：MLflow、Kubeflow、Airflow、Jenkins
4. **最佳实践**：实验跟踪、模型注册、A/B测试、渐进式部署

### 技术深度
1. **架构设计**：微服务架构、容器化、编排
2. **数据管理**：数据版本控制、特征存储、数据血缘
3. **部署策略**：蓝绿部署、金丝雀发布、影子部署
4. **监控告警**：性能监控、数据漂移检测、模型退化预警

### 实际应用场景
1. **金融风控**：实时风控模型、反欺诈系统
2. **推荐系统**：个性化推荐、冷启动问题
3. **计算机视觉**：图像识别、目标检测、人脸识别
4. **自然语言处理**：文本分类、情感分析、机器翻译

通过这个完整的MLOps实现，为Java AI架构师提供了工业级的模型生命周期管理实践。