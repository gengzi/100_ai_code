# Spark MLlib大规模分布式机器学习实战

## 🎯 面试题目

### 题目1：基于Spark MLlib的亿级用户推荐系统 ⭐⭐⭐⭐⭐
**问题**：使用Apache Spark MLlib构建一个支持亿级用户的推荐系统，包括数据预处理、模型训练、离线推荐和实时推荐的完整实现。

**核心架构组件**：
1. **分布式数据处理** - Spark DataFrame、数据清洗、特征工程
2. **协同过滤算法** - ALS矩阵分解、用户物品评分矩阵
3. **推荐模型管理** - 模型训练、评估、版本控制
4. **推荐服务** - 离线批量推荐、实时推荐接口

**核心代码实现**：

```java
import org.apache.spark.api.java.*;
import org.apache.spark.SparkConf;
import org.apache.spark.sql.*;
import org.apache.spark.sql.types.*;
import org.apache.spark.ml.*;
import org.apache.spark.ml.recommendation.*;
import org.apache.spark.ml.evaluation.*;
import org.apache.spark.ml.feature.*;
import org.apache.spark.ml.tuning.*;
import org.apache.spark.sql.expressions.Window;
import org.apache.spark.sql.functions;

import java.util.*;
import java.util.concurrent.*;
import java.time.*;

/**
 * 基于Spark MLlib的大规模推荐系统
 */
public class SparkRecommendationSystem {

    private SparkSession spark;
    private RecommendationConfig config;
    private ModelManager modelManager;
    private RecommendationService recommendationService;

    public SparkRecommendationSystem(RecommendationConfig config) {
        this.config = config;
        initializeSpark();
        this.modelManager = new ModelManager(spark);
        this.recommendationService = new RecommendationService(spark, modelManager);
    }

    private void initializeSpark() {
        SparkConf sparkConf = new SparkConf()
            .setAppName("LargeScaleRecommendationSystem")
            .setMaster(config.getSparkMaster())
            .set("spark.sql.adaptive.enabled", "true")
            .set("spark.sql.adaptive.coalescePartitions.enabled", "true")
            .set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
            .set("spark.default.parallelism", String.valueOf(config.getDefaultParallelism()))
            .set("spark.sql.shuffle.partitions", String.valueOf(config.getShufflePartitions()));

        this.spark = SparkSession.builder()
            .config(sparkConf)
            .enableHiveSupport()
            .getOrCreate();

        System.out.println("Spark会话初始化完成");
    }

    // 完整的推荐系统流水线
    public RecommendationSystemResult buildRecommendationSystem() {
        try {
            long startTime = System.currentTimeMillis();

            // 1. 数据加载和预处理
            Dataset<Row> rawData = loadAndPreprocessData();

            // 2. 特征工程
            FeatureEngineeredData featureData = performFeatureEngineering(rawData);

            // 3. 数据分割
            TrainingTestData splitData = splitData(featureData);

            // 4. 模型训练
            TrainedModel trainedModel = trainModel(splitData);

            // 5. 模型评估
            ModelEvaluationResult evaluation = evaluateModel(trainedModel, splitData.getTestData());

            // 6. 模型保存
            String modelPath = modelManager.saveModel(trainedModel.getModel(), evaluation);

            // 7. 生成推荐结果
            RecommendationResults recommendations = generateRecommendations(trainedModel, featureData);

            long processingTime = System.currentTimeMillis() - startTime;

            return new RecommendationSystemResult(
                true,
                modelPath,
                evaluation,
                recommendations,
                processingTime,
                Instant.now()
            );

        } catch (Exception e) {
            System.err.printf("推荐系统构建失败: %s%n", e.getMessage());
            return createErrorResult(e);
        }
    }

    // 数据加载和预处理
    private Dataset<Row> loadAndPreprocessData() {
        System.out.println("开始加载和预处理数据...");

        // 加载用户行为数据
        Dataset<Row> interactions = loadInteractionData();

        // 数据清洗
        interactions = cleanInteractionData(interactions);

        // 加载用户特征数据
        Dataset<Row> userFeatures = loadUserFeatures();

        // 加载物品特征数据
        Dataset<Row> itemFeatures = loadItemFeatures();

        // 数据合并
        Dataset<Row> rawData = interactions
            .join(userFeatures, "user_id")
            .join(itemFeatures, "item_id");

        System.out.printf("预处理后数据量: %d%n", rawData.count());
        return rawData;
    }

    private Dataset<Row> loadInteractionData() {
        // 从数据源加载用户行为数据
        return spark.read()
            .format(config.getDataFormat())
            .option("header", "true")
            .load(config.getInteractionDataPath())
            .select(
                functions.col("user_id"),
                functions.col("item_id"),
                functions.col("rating").cast(DataTypes.DoubleType),
                functions.col("timestamp")
            );
    }

    private Dataset<Row> cleanInteractionData(Dataset<Row> interactions) {
        // 数据清洗：过滤无效数据
        return interactions
            .filter(functions.col("user_id").isNotNull())
            .filter(functions.col("item_id").isNotNull())
            .filter(functions.col("rating").isNotNull()
                     .and(functions.col("rating").gt(0))
                     .and(functions.col("rating").leq(config.getMaxRating())))
            .filter(functions.col("user_id").notEqual(""))
            .filter(functions.col("item_id").notEqual(""));
    }

    private Dataset<Row> loadUserFeatures() {
        return spark.read()
            .format(config.getDataFormat())
            .option("header", "true")
            .load(config.getUserFeaturesPath())
            .select("user_id", "age", "gender", "location", "registration_date");
    }

    private Dataset<Row> loadItemFeatures() {
        return spark.read()
            .format(config.getDataFormat())
            .option("header", "true")
            .load(config.getItemFeaturesPath())
            .select("item_id", "category", "brand", "price", "create_date");
    }

    // 特征工程
    private FeatureEngineeredData performFeatureEngineering(Dataset<Row> rawData) {
        System.out.println("开始特征工程...");

        // 用户统计特征
        Dataset<Row> userStats = calculateUserStatistics(rawData);

        // 物品统计特征
        Dataset<Row> itemStats = calculateItemStatistics(rawData);

        // 时间特征
        Dataset<Row> timeFeatures = extractTimeFeatures(rawData);

        // 组合所有特征
        Dataset<Row> featureData = rawData
            .join(userStats, "user_id", "left")
            .join(itemStats, "item_id", "left")
            .join(timeFeatures, "user_id", "left");

        // ID编码
        StringIndexerModel userIndexer = createIndexer("user_id", "user_index");
        StringIndexerModel itemIndexer = createIndexer("item_id", "item_index");

        Dataset<Row> indexedData = userIndexer.transform(featureData);
        indexedData = itemIndexer.transform(indexedData);

        // 添加列索引信息
        Map<String, StringIndexerModel> indexers = new HashMap<>();
        indexers.put("user_id", userIndexer);
        indexers.put("item_id", itemIndexer);

        return new FeatureEngineeredData(indexedData, indexers);
    }

    private Dataset<Row> calculateUserStatistics(Dataset<Row> data) {
        return data.groupBy("user_id")
            .agg(
                functions.count("*").alias("user_interaction_count"),
                functions.avg("rating").alias("user_avg_rating"),
                functions.stddev("rating").alias("user_rating_std"),
                functions.min("timestamp").alias("user_first_interaction"),
                functions.max("timestamp").alias("user_last_interaction")
            )
            .withColumn("user_active_days",
                functions.datediff(functions.col("user_last_interaction"),
                                   functions.col("user_first_interaction")));
    }

    private Dataset<Row> calculateItemStatistics(Dataset<Row> data) {
        return data.groupBy("item_id")
            .agg(
                functions.count("*").alias("item_interaction_count"),
                functions.avg("rating").alias("item_avg_rating"),
                functions.stddev("rating").alias("item_rating_std"),
                functions.approx_count_distinct("user_id").alias("item_unique_users")
            );
    }

    private Dataset<Row> extractTimeFeatures(Dataset<Row> data) {
        return data.withColumn("hour", functions.hour(functions.col("timestamp")))
            .withColumn("day_of_week", functions.dayofweek(functions.col("timestamp")))
            .withColumn("is_weekend",
                functions.when(functions.col("day_of_week").isin(1, 7), 1).otherwise(0));
    }

    private StringIndexerModel createIndexer(String inputCol, String outputCol) {
        StringIndexer indexer = new StringIndexer()
            .setInputCol(inputCol)
            .setOutputCol(outputCol)
            .setHandleInvalid("keep");

        return indexer.fit(spark.emptyDataset()
            .withColumn(inputCol, functions.lit("").cast(DataTypes.StringType)));
    }

    // 数据分割
    private TrainingTestData splitData(FeatureEngineeredData featureData) {
        Dataset<Row> data = featureData.getData();

        // 按时间分割数据（避免数据泄露）
        long splitTime = System.currentTimeMillis() - config.getTestPeriodDays() * 24 * 60 * 60 * 1000L;

        Dataset<Row> trainingData = data.filter(functions.col("timestamp").lt(splitTime));
        Dataset<Row> testData = data.filter(functions.col("timestamp").geq(splitTime));

        // 确保测试集中的用户和物品在训练集中出现过
        Set<Integer> trainUsers = getUniqueIds(trainingData, "user_index");
        Set<Integer> trainItems = getUniqueIds(trainingData, "item_index");

        testData = filterByUsersAndItems(testData, trainUsers, trainItems);

        System.out.printf("训练数据量: %d, 测试数据量: %d%n",
                         trainingData.count(), testData.count());

        return new TrainingTestData(trainingData, testData, trainUsers, trainItems);
    }

    private Set<Integer> getUniqueIds(Dataset<Row> data, String column) {
        List<Integer> ids = data.select(column)
            .distinct()
            .toJavaRDD()
            .map(row -> row.getInt(0))
            .collect();

        return new HashSet<>(ids);
    }

    private Dataset<Row> filterByUsersAndItems(Dataset<Row> data,
                                             Set<Integer> users, Set<Integer> items) {
        return data.filter(
            functions.col("user_index").isin(users.toArray()) &&
            functions.col("item_index").isin(items.toArray())
        );
    }

    // 模型训练
    private TrainedModel trainModel(TrainingTestData splitData) {
        System.out.println("开始训练推荐模型...");

        // ALS模型配置
        ALS als = new ALS()
            .setMaxIter(config.getMaxIter())
            .setRegParam(config.getRegParam())
            .setRank(config.getRank())
            .setUserCol("user_index")
            .setItemCol("item_index")
            .setRatingCol("rating")
            .setColdStartStrategy("drop");

        // 训练模型
        ALSModel model = als.fit(splitData.getTrainingData());

        return new TrainedModel(model, splitData);
    }

    // 模型评估
    private ModelEvaluationResult evaluateModel(TrainedModel trainedModel, Dataset<Row> testData) {
        System.out.println("开始评估模型性能...");

        ALSModel model = trainedModel.getModel();
        Dataset<Row> predictions = model.transform(testData);

        // 计算RMSE
        RegressionEvaluator evaluator = new RegressionEvaluator()
            .setMetricName("rmse")
            .setLabelCol("rating")
            .setPredictionCol("prediction");

        double rmse = evaluator.evaluate(predictions);

        // 计算MAE
        evaluator.setMetricName("mae");
        double mae = evaluator.evaluate(predictions);

        // 计算覆盖率和多样性
        double coverage = calculateCoverage(trainedModel);
        double diversity = calculateDiversity(trainedModel);

        // 计算精确率和召回率
        PrecisionRecallResult prResult = calculatePrecisionRecall(trainedModel, testData);

        ModelEvaluationResult evaluation = new ModelEvaluationResult(
            rmse, mae, coverage, diversity, prResult.getPrecision(), prResult.getRecall()
        );

        System.out.printf("模型评估结果 - RMSE: %.4f, MAE: %.4f, Coverage: %.4f, Diversity: %.4f%n",
                         rmse, mae, coverage, diversity);

        return evaluation;
    }

    private double calculateCoverage(TrainedModel trainedModel) {
        // 生成所有用户的推荐
        Dataset<Row> userRecs = trainedModel.getModel().recommendForAllUsers(10);
        long totalItems = trainedModel.getTrainUsers().size();

        // 计算推荐的唯一物品数量
        long recommendedItems = userRecs.select(functions.explode(functions.col("recommendations")))
            .select("col.item_index")
            .distinct()
            .count();

        return (double) recommendedItems / totalItems;
    }

    private double calculateDiversity(TrainedModel trainedModel) {
        // 计算推荐的多样性（平均物品距离）
        Dataset<Row> recommendations = trainedModel.getModel().recommendForAllUsers(10);

        // 计算每个用户推荐的物品间的平均距离
        Dataset<Row> diversityScores = recommendations
            .select(
                functions.col("user_index"),
                functions.udf(this::calculateIntraListDiversity, DataTypes.DoubleType)
                    .apply(functions.col("recommendations"))
                    .alias("diversity")
            );

        return diversityScores.agg(functions.avg("diversity")).first().getDouble(0);
    }

    private double calculateIntraListDiversity(Seq<Row> recommendations) {
        if (recommendations.size() < 2) return 0.0;

        double totalDistance = 0.0;
        int count = 0;

        List<Integer> items = new ArrayList<>();
        for (Row row : recommendations) {
            items.add(row.getInt(1)); // item_index
        }

        for (int i = 0; i < items.size(); i++) {
            for (int j = i + 1; j < items.size(); j++) {
                // 简化的距离计算
                totalDistance += Math.abs(items.get(i) - items.get(j));
                count++;
            }
        }

        return count > 0 ? totalDistance / count : 0.0;
    }

    private PrecisionRecallResult calculatePrecisionRecall(TrainedModel trainedModel, Dataset<Row> testData) {
        // 生成测试集用户的推荐
        Set<Integer> testUsers = getUniqueIds(testData, "user_index");
        Dataset<Row> testUserIds = spark.createDataset(
            testUsers.stream().collect(Collectors.toList()),
            Encoders.INT()
        ).toDF("user_index");

        Dataset<Row> recommendations = trainedModel.getModel()
            .recommendForUserSubset(testUserIds, 10);

        // 计算精确率和召回率
        Dataset<Row> joined = recommendations
            .join(testData, "user_index")
            .filter(
                functions.array_contains(
                    functions.col("recommendations.item_index"),
                    functions.col("item_index")
                )
            );

        long totalRecommendations = recommendations.count();
        long hits = joined.count();
        long totalRelevant = testData.count();

        double precision = totalRecommendations > 0 ? (double) hits / totalRecommendations : 0;
        double recall = totalRelevant > 0 ? (double) hits / totalRelevant : 0;

        return new PrecisionRecallResult(precision, recall);
    }

    // 生成推荐结果
    private RecommendationResults generateRecommendations(TrainedModel trainedModel, FeatureEngineeredData featureData) {
        System.out.println("生成推荐结果...");

        ALSModel model = trainedModel.getModel();

        // 离线推荐：为所有用户生成推荐
        Dataset<Row> allUserRecs = model.recommendForAllUsers(config.getRecommendationCount());

        // 实时推荐：准备实时推荐模型
        Map<Integer, Dataset<Row>> userItemCache = prepareRealtimeCache(model, trainedModel);

        return new RecommendationResults(allUserRecs, userItemCache);
    }

    private Map<Integer, Dataset<Row>> prepareRealtimeCache(ALSModel model, TrainedModel trainedModel) {
        Map<Integer, Dataset<Row> cache = new HashMap<>();

        // 为活跃用户预计算推荐
        Set<Integer> activeUsers = getActiveUsers(trainedModel);

        for (Integer userId : activeUsers) {
            Dataset<Row> userRecs = model.recommendForUserSubset(
                spark.createDataset(Arrays.asList(userId), Encoders.INT()).toDF("user_index"),
                50
            );
            cache.put(userId, userRecs);
        }

        return cache;
    }

    private Set<Integer> getActiveUsers(TrainedModel trainedModel) {
        // 获取最近活跃的用户（简化实现）
        return new HashSet<>(trainedModel.getTrainUsers()).stream()
            .limit(10000) // 限制缓存大小
            .collect(Collectors.toSet());
    }

    // 实时推荐服务
    public List<Recommendation> getRealtimeRecommendations(int userId, int count) {
        return recommendationService.getRecommendations(userId, count);
    }

    // 关闭系统
    public void shutdown() {
        if (spark != null) {
            spark.stop();
        }
        System.out.println("推荐系统已关闭");
    }

    private RecommendationSystemResult createErrorResult(Exception e) {
        return new RecommendationSystemResult(
            false,
            null,
            new ModelEvaluationResult(0, 0, 0, 0, 0, 0),
            null,
            0,
            Instant.now()
        );
    }

    // 配置类
    public static class RecommendationConfig {
        private final String sparkMaster;
        private final String dataFormat;
        private final String interactionDataPath;
        private final String userFeaturesPath;
        private final String itemFeaturesPath;
        private final int maxRating;
        private final int maxIter;
        private final double regParam;
        private final int rank;
        private final int defaultParallelism;
        private final int shufflePartitions;
        private final long testPeriodDays;
        private final int recommendationCount;

        public RecommendationConfig(String sparkMaster, String dataFormat, String interactionDataPath,
                                  String userFeaturesPath, String itemFeaturesPath, int maxRating,
                                  int maxIter, double regParam, int rank, int defaultParallelism,
                                  int shufflePartitions, long testPeriodDays, int recommendationCount) {
            this.sparkMaster = sparkMaster;
            this.dataFormat = dataFormat;
            this.interactionDataPath = interactionDataPath;
            this.userFeaturesPath = userFeaturesPath;
            this.itemFeaturesPath = itemFeaturesPath;
            this.maxRating = maxRating;
            this.maxIter = maxIter;
            this.regParam = regParam;
            this.rank = rank;
            this.defaultParallelism = defaultParallelism;
            this.shufflePartitions = shufflePartitions;
            this.testPeriodDays = testPeriodDays;
            this.recommendationCount = recommendationCount;
        }

        // Getters
        public String getSparkMaster() { return sparkMaster; }
        public String getDataFormat() { return dataFormat; }
        public String getInteractionDataPath() { return interactionDataPath; }
        public String getUserFeaturesPath() { return userFeaturesPath; }
        public String getItemFeaturesPath() { return itemFeaturesPath; }
        public int getMaxRating() { return maxRating; }
        public int getMaxIter() { return maxIter; }
        public double getRegParam() { return regParam; }
        public int getRank() { return rank; }
        public int getDefaultParallelism() { return defaultParallelism; }
        public int getShufflePartitions() { return shufflePartitions; }
        public long getTestPeriodDays() { return testPeriodDays; }
        public int getRecommendationCount() { return recommendationCount; }
    }

    // 数据结构定义
    public static class FeatureEngineeredData {
        private final Dataset<Row> data;
        private final Map<String, StringIndexerModel> indexers;

        public FeatureEngineeredData(Dataset<Row> data, Map<String, StringIndexerModel> indexers) {
            this.data = data;
            this.indexers = new HashMap<>(indexers);
        }

        public Dataset<Row> getData() { return data; }
        public Map<String, StringIndexerModel> getIndexers() { return Collections.unmodifiableMap(indexers); }
    }

    public static class TrainingTestData {
        private final Dataset<Row> trainingData;
        private final Dataset<Row> testData;
        private final Set<Integer> trainUsers;
        private final Set<Integer> trainItems;

        public TrainingTestData(Dataset<Row> trainingData, Dataset<Row> testData,
                               Set<Integer> trainUsers, Set<Integer> trainItems) {
            this.trainingData = trainingData;
            this.testData = testData;
            this.trainUsers = new HashSet<>(trainUsers);
            this.trainItems = new HashSet<>(trainItems);
        }

        public Dataset<Row> getTrainingData() { return trainingData; }
        public Dataset<Row> getTestData() { return testData; }
        public Set<Integer> getTrainUsers() { return Collections.unmodifiableSet(trainUsers); }
        public Set<Integer> getTrainItems() { return Collections.unmodifiableSet(trainItems); }
    }

    public static class TrainedModel {
        private final ALSModel model;
        private final TrainingTestData splitData;

        public TrainedModel(ALSModel model, TrainingTestData splitData) {
            this.model = model;
            this.splitData = splitData;
        }

        public ALSModel getModel() { return model; }
        public Set<Integer> getTrainUsers() { return splitData.getTrainUsers(); }
    }

    public static class ModelEvaluationResult {
        private final double rmse;
        private final double mae;
        private final double coverage;
        private final double diversity;
        private final double precision;
        private final double recall;

        public ModelEvaluationResult(double rmse, double mae, double coverage,
                                   double diversity, double precision, double recall) {
            this.rmse = rmse;
            this.mae = mae;
            this.coverage = coverage;
            this.diversity = diversity;
            this.precision = precision;
            this.recall = recall;
        }

        // Getters
        public double getRmse() { return rmse; }
        public double getMae() { return mae; }
        public double getCoverage() { return coverage; }
        public double getDiversity() { return diversity; }
        public double getPrecision() { return precision; }
        public double getRecall() { return recall; }
    }

    public static class RecommendationResults {
        private final Dataset<Row> offlineRecommendations;
        private final Map<Integer, Dataset<Row>> realtimeCache;

        public RecommendationResults(Dataset<Row> offlineRecommendations,
                                   Map<Integer, Dataset<Row>> realtimeCache) {
            this.offlineRecommendations = offlineRecommendations;
            this.realtimeCache = new HashMap<>(realtimeCache);
        }

        public Dataset<Row> getOfflineRecommendations() { return offlineRecommendations; }
        public Map<Integer, Dataset<Row>> getRealtimeCache() { return Collections.unmodifiableMap(realtimeCache); }
    }

    public static class RecommendationSystemResult {
        private final boolean success;
        private final String modelPath;
        private final ModelEvaluationResult evaluation;
        private final RecommendationResults recommendations;
        private final long processingTime;
        private final Instant timestamp;

        public RecommendationSystemResult(boolean success, String modelPath,
                                        ModelEvaluationResult evaluation, RecommendationResults recommendations,
                                        long processingTime, Instant timestamp) {
            this.success = success;
            this.modelPath = modelPath;
            this.evaluation = evaluation;
            this.recommendations = recommendations;
            this.processingTime = processingTime;
            this.timestamp = timestamp;
        }

        // Getters
        public boolean isSuccess() { return success; }
        public String getModelPath() { return modelPath; }
        public ModelEvaluationResult getEvaluation() { return evaluation; }
        public RecommendationResults getRecommendations() { return recommendations; }
        public long getProcessingTime() { return processingTime; }
        public Instant getTimestamp() { return timestamp; }
    }

    public static class PrecisionRecallResult {
        private final double precision;
        private final double recall;

        public PrecisionRecallResult(double precision, double recall) {
            this.precision = precision;
            this.recall = recall;
        }

        public double getPrecision() { return precision; }
        public double getRecall() { return recall; }
    }

    // 模型管理器
    public static class ModelManager {
        private final SparkSession spark;
        private final Map<String, ALSModel> modelCache;

        public ModelManager(SparkSession spark) {
            this.spark = spark;
            this.modelCache = new ConcurrentHashMap<>();
        }

        public String saveModel(ALSModel model, ModelEvaluationResult evaluation) {
            String modelPath = "/models/recommendation_" + System.currentTimeMillis();
            model.write().overwrite().save(modelPath);

            // 保存模型元数据
            saveModelMetadata(modelPath, evaluation);

            System.out.printf("模型已保存到: %s%n", modelPath);
            return modelPath;
        }

        private void saveModelMetadata(String modelPath, ModelEvaluationResult evaluation) {
            // 保存模型评估元数据
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("rmse", evaluation.getRmse());
            metadata.put("mae", evaluation.getMae());
            metadata.put("coverage", evaluation.getCoverage());
            metadata.put("diversity", evaluation.getDiversity());
            metadata.put("precision", evaluation.getPrecision());
            metadata.put("recall", evaluation.getRecall());
            metadata.put("created_time", Instant.now().toString());

            // 简化实现：输出到控制台
            System.out.println("模型元数据: " + metadata);
        }

        public ALSModel loadModel(String modelPath) {
            return modelCache.computeIfAbsent(modelPath, path -> {
                try {
                    return ALSModel.load(path);
                } catch (Exception e) {
                    System.err.printf("模型加载失败: %s%n", e.getMessage());
                    return null;
                }
            });
        }
    }

    // 推荐服务
    public static class RecommendationService {
        private final SparkSession spark;
        private final ModelManager modelManager;
        private ALSModel currentModel;

        public RecommendationService(SparkSession spark, ModelManager modelManager) {
            this.spark = spark;
            this.modelManager = modelManager;
        }

        public void setCurrentModel(ALSModel model) {
            this.currentModel = model;
        }

        public List<Recommendation> getRecommendations(int userId, int count) {
            if (currentModel == null) {
                return Collections.emptyList();
            }

            try {
                // 为指定用户生成推荐
                Dataset<Row> userDF = spark.createDataset(
                    Arrays.asList(userId),
                    Encoders.INT()
                ).toDF("user_index");

                Dataset<Row> recommendations = currentModel.recommendForUserSubset(userDF, count);

                // 转换结果
                return recommendations.select("user_index", "recommendations")
                    .toJavaRDD()
                    .map(row -> {
                        int userIndex = row.getInt(0);
                        Seq<Row> recs = row.getSeq(1);
                        List<Recommendation> userRecs = new ArrayList<>();

                        for (Row rec : recs) {
                            userRecs.add(new Recommendation(
                                userIndex,
                                rec.getInt(0), // item_index
                                rec.getDouble(1) // rating
                            ));
                        }

                        return userRecs;
                    })
                    .flatMap(list -> list.iterator())
                    .collect();

            } catch (Exception e) {
                System.err.printf("获取推荐失败: %s%n", e.getMessage());
                return Collections.emptyList();
            }
        }
    }

    public static class Recommendation {
        private final int userId;
        private final int itemId;
        private final double score;

        public Recommendation(int userId, int itemId, double score) {
            this.userId = userId;
            this.itemId = itemId;
            this.score = score;
        }

        public int getUserId() { return userId; }
        public int getItemId() { return itemId; }
        public double getScore() { return score; }

        @Override
        public String toString() {
            return String.format("Recommendation{user=%d, item=%d, score=%.3f}", userId, itemId, score);
        }
    }

    // 测试示例
    public static void main(String[] args) {
        try {
            // 配置推荐系统
            RecommendationConfig config = new RecommendationConfig(
                "local[*]",                    // Spark master
                "parquet",                     // 数据格式
                "/data/interactions.parquet",  // 交互数据路径
                "/data/users.parquet",         // 用户特征路径
                "/data/items.parquet",         // 物品特征路径
                5,                             // 最大评分
                10,                            // 最大迭代次数
                0.1,                           // 正则化参数
                20,                            // 矩阵分解秩
                4,                             // 默认并行度
                200,                           // shuffle分区数
                30,                            // 测试期天数
                10                             // 推荐数量
            );

            // 创建推荐系统
            SparkRecommendationSystem recommendationSystem = new SparkRecommendationSystem(config);

            // 构建推荐系统
            RecommendationSystemResult result = recommendationSystem.buildRecommendationSystem();

            // 输出结果
            System.out.println("=== 推荐系统构建结果 ===");
            System.out.printf("构建状态: %s%n", result.isSuccess() ? "成功" : "失败");
            if (result.isSuccess()) {
                System.out.printf("模型路径: %s%n", result.getModelPath());
                System.out.printf("处理时间: %d ms%n", result.getProcessingTime());

                ModelEvaluationResult evaluation = result.getEvaluation();
                System.out.println("=== 模型评估结果 ===");
                System.out.printf("RMSE: %.4f%n", evaluation.getRmse());
                System.out.printf("MAE: %.4f%n", evaluation.getMae());
                System.out.printf("覆盖率: %.4f%n", evaluation.getCoverage());
                System.out.printf("多样性: %.4f%n", evaluation.getDiversity());
                System.out.printf("精确率: %.4f%n", evaluation.getPrecision());
                System.out.printf("召回率: %.4f%n", evaluation.getRecall());

                // 测试实时推荐
                System.out.println("\n=== 实时推荐测试 ===");
                List<Recommendation> realtimeRecs = recommendationSystem.getRealtimeRecommendations(1, 5);
                for (int i = 0; i < Math.min(3, realtimeRecs.size()); i++) {
                    Recommendation rec = realtimeRecs.get(i);
                    System.out.printf("推荐 %d: %s%n", i + 1, rec);
                }
            }

            // 关闭系统
            recommendationSystem.shutdown();

        } catch (Exception e) {
            System.err.printf("系统运行失败: %s%n", e.getMessage());
            e.printStackTrace();
        }
    }
}
```

## 🎓 面试要点总结

### 关键概念
1. **Spark MLlib** - 分布式机器学习库、DataFrame API、Pipeline
2. **协同过滤** - ALS算法、矩阵分解、隐式反馈
3. **推荐系统** - 离线推荐、实时推荐、混合推荐
4. **大规模数据处理** - 分区策略、内存管理、性能优化

### 技术深度
1. **分布式计算** - Spark架构、RDD、DataFrame、Dataset
2. **机器学习算法** - 监督学习、无监督学习、推荐算法
3. **特征工程** - 特征提取、特征选择、特征变换
4. **模型评估** - 交叉验证、指标计算、模型选择

### 实际应用场景
1. **电商推荐** - 商品推荐、个性化推荐、冷启动问题
2. **内容推荐** - 文章推荐、视频推荐、音乐推荐
3. **社交推荐** - 好友推荐、群组推荐、内容推荐
4. **广告推荐** - 精准广告、点击率预测、转化率优化

### 面试回答技巧
1. **实践经验** - 分享大规模推荐系统的实际开发经验
2. **性能优化** - 讨论Spark集群调优和算法优化技巧
3. **业务理解** - 展示对不同推荐算法适用场景的理解
4. **系统设计** - 体现分布式系统的架构设计能力

这个基于Spark MLlib的大规模推荐系统展示了工业级推荐系统的完整实现，涵盖了数据预处理、模型训练、评估和服务化的全过程。