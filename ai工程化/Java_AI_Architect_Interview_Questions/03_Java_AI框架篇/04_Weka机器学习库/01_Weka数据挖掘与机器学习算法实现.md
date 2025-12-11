# Weka数据挖掘与机器学习算法实现

## 题目1: ⭐⭐ Weka核心架构与数据表示

**问题描述**:
请详细说明Weka框架的核心架构设计，包括数据集的Instances结构、Attribute和Instance的关系，以及如何通过ARFF格式进行数据交换和持久化。

**答案要点**:
- **数据结构**: Instances数据集和Instance实例的层次关系
- **属性类型**: 数值型、名义型、字符串和日期属性的处理
- **ARFF格式**: Weka专用的数据格式规范和扩展
- **过滤器体系**: 数据预处理和特征工程的框架设计
- **分类器接口**: 统一的机器学习算法接口设计

**核心原理**:
1. Weka采用表格式的数据表示，每行代表一个实例，每列代表一个属性
2. 所有算法都通过统一的接口实现，便于算法组合和比较
3. 过滤器链式处理使得数据预处理更加灵活
4. 元学习器能够组合多个基础算法提升性能

**核心代码示例**:
```java
// Weka数据结构操作
public class WekaDataOperations {

    public void demonstrateDataStructures() throws Exception {
        // 创建数据集结构
        ArrayList<Attribute> attributes = new ArrayList<>();

        // 添加不同类型的属性
        attributes.add(new Attribute("age")); // 数值型属性
        attributes.add(new Attribute("income")); // 数值型属性

        // 名义型属性
        List<String> classValues = Arrays.asList("yes", "no");
        attributes.add(new Attribute("approved", classValues));

        // 创建空数据集
        Instances dataset = new Instances("CreditApplication", attributes, 0);
        dataset.setClassIndex(dataset.numAttributes() - 1);

        // 添加实例
        Instance instance1 = new DenseInstance(4);
        instance1.setValue(dataset.attribute("age"), 25.0);
        instance1.setValue(dataset.attribute("income"), 50000.0);
        instance1.setClassValue("yes");
        dataset.add(instance1);

        Instance instance2 = new DenseInstance(4);
        instance2.setValue(dataset.attribute("age"), 45.0);
        instance2.setValue(dataset.attribute("income"), 80000.0);
        instance2.setClassValue("no");
        dataset.add(instance2);

        // 数据集统计信息
        System.out.println("数据集大小: " + dataset.numInstances());
        System.out.println("属性数量: " + dataset.numAttributes());
        System.out.println("类别分布: " + dataset.attributeStats(dataset.classIndex()));
    }

    public Instances loadFromARFF(String filePath) throws Exception {
        // 从ARFF文件加载数据
        ArffLoader loader = new ArffLoader();
        loader.setSource(new File(filePath));
        Instances data = loader.getDataSet();

        // 设置类别属性
        if (data.classIndex() == -1) {
            data.setClassIndex(data.numAttributes() - 1);
        }

        return data;
    }

    public void saveToARFF(Instances data, String filePath) throws Exception {
        // 保存到ARFF文件
        ArffSaver saver = new ArffSaver();
        saver.setInstances(data);
        saver.setFile(new File(filePath));
        saver.writeBatch();
    }
}

// 数据预处理管道
public class DataPreprocessingPipeline {

    public Instances buildPreprocessingPipeline(Instances rawData) throws Exception {
        // 创建过滤器链
        Filter[] filters = new Filter[] {
            // 移除ID属性
            new Remove(),

            // 处理缺失值
            new ReplaceMissingValues(),

            // 数值属性标准化
            new Standardize(),

            // 名义属性离散化
            new Discretize(),

            // 特征选择
            new AttributeSelection()
        };

        // 配置过滤器
        configureFilters(filters, rawData);

        // 应用过滤器链
        Instances processedData = rawData;
        for (Filter filter : filters) {
            filter.setInputFormat(processedData);
            processedData = Filter.useFilter(processedData, filter);
        }

        return processedData;
    }

    private void configureFilters(Filter[] filters, Instances data) throws Exception {
        // 配置Remove过滤器
        Remove removeFilter = (Remove) filters[0];
        removeFilter.setAttributeIndices("1"); // 移除第一个属性（ID）

        // 配置Discretize过滤器
        Discretize discretizeFilter = (Discretize) filters[3];
        discretizeFilter.setFindBestNumBins(true);
        discretizeFilter.setUseBetterEncoding(true);

        // 配置AttributeSelection过滤器
        AttributeSelection selectionFilter = (AttributeSelection) filters[4];
        CfsSubsetEval evaluator = new CfsSubsetEval();
        GreedyStepwise search = new GreedyStepwise();
        search.setSearchBackwards(true);

        selectionFilter.setEvaluator(evaluator);
        selectionFilter.setSearch(search);
    }
}
```

---

## 题目2: ⭐⭐⭐ 监督学习算法在Weka中的实现

**问题描述**:
请详细说明Weka中常见监督学习算法的实现原理，包括决策树（J48、RandomForest）、朴素贝叶斯、支持向量机和神经网络等算法的核心思想和参数调优策略。

**答案要点**:
- **决策树算法**: J48（C4.5）的属性选择和剪枝策略
- **集成学习**: RandomForest和AdaBoost的集成策略
- **贝叶斯方法**: 朴素贝叶斯的假设和拉普拉斯平滑
- **SVM实现**: SMO算法的优化过程和核函数选择
- **神经网络**: MultilayerPerceptron的BP算法和正则化

**核心原理**:
1. 决策树通过信息增益最大化构建最优决策边界
2. 集成学习通过多个弱学习器的组合提高泛化能力
3. 朴素贝叶斯基于条件独立性假设进行概率推理
4. SVM通过最大间隔原理寻找最优分离超平面
5. 神经网络通过非线性变换学习复杂的数据模式

**核心代码示例**:
```java
// 决策树分类器
public class DecisionTreeClassifier {

    public void trainJ48Tree(Instances trainingData) throws Exception {
        // 创建J48决策树
        J48 tree = new J48();

        // 参数配置
        tree.setUnpruned(false);        // 启用剪枝
        tree.setC confidenceFactor(0.25f); // 剪枝置信度
        tree.setMinNumObj(2);           // 叶节点最小实例数
        tree.setNumFolds(3);            // 交叉验证折数

        // 训练模型
        tree.buildClassifier(trainingData);

        // 输出树结构
        System.out.println(tree);

        // 评估模型
        evaluateClassifier(tree, trainingData);
    }

    public void trainRandomForest(Instances trainingData) throws Exception {
        // 创建随机森林
        RandomForest rf = new RandomForest();

        // 参数配置
        rf.setNumIterations(100);        // 决策树数量
        rf.setMaxDepth(0);              // 无限深度
        rf.setBagSizePercent(100);      // Bagging采样比例
        rf.setNumFeatures(0);           // 自动选择特征数量

        // 训练模型
        rf.buildClassifier(trainingData);

        // 获取特征重要性
        double[] importance = rf.getAttributeImportances();
        System.out.println("特征重要性: " + Arrays.toString(importance));

        // 输出袋外误差
        System.out.println("袋外误差: " + rf.measureOutOfBagError());
    }

    private void evaluateClassifier(Classifier classifier, Instances data) throws Exception {
        Evaluation eval = new Evaluation(data);
        eval.crossValidateModel(classifier, data, 10, new Random(1));

        // 输出评估结果
        System.out.println("正确率: " + String.format("%.2f%%", eval.pctCorrect()));
        System.out.println("混淆矩阵:");
        System.out.println(eval.toMatrixString());
        System.out.println("详细指标:");
        System.out.println(eval.toClassDetailsString());
    }
}

// 朴素贝叶斯分类器
public class NaiveBayesImplementation {

    public void trainNaiveBayes(Instances trainingData) throws Exception {
        // 创建朴素贝叶斯分类器
        NaiveBayes nb = new NaiveBayes();

        // 配置选项
        nb.setUseSupervisedDiscretization(true);

        // 训练模型
        nb.buildClassifier(trainingData);

        // 获取条件概率
        Estimator[][] conditionalProbabilities = nb.getConditionalProbabilities();

        // 输出模型参数
        printModelParameters(nb, trainingData);
    }

    public void demonstrateBayesianInference(Instances trainingData, Instance testInstance)
            throws Exception {
        NaiveBayes nb = new NaiveBayes();
        nb.buildClassifier(trainingData);

        // 计算后验概率
        double[] posterior = nb.distributionForInstance(testInstance);

        // 手动计算贝叶斯推理过程
        String[] classValues = new String[trainingData.numClasses()];
        for (int i = 0; i < classValues.length; i++) {
            classValues[i] = trainingData.classAttribute().value(i);
        }

        System.out.println("后验概率:");
        for (int i = 0; i < posterior.length; i++) {
            System.out.printf("P(%s|x) = %.6f\n", classValues[i], posterior[i]);
        }

        // 计算似然和先验
        double[] likelihood = calculateLikelihood(nb, trainingData, testInstance);
        double[] prior = calculatePrior(trainingData);

        System.out.println("\n贝叶斯公式验证:");
        for (int i = 0; i < classValues.length; i++) {
            double calculatedPosterior = (likelihood[i] * prior[i]) / getTotalLikelihood(likelihood, prior);
            System.out.printf("P(%s|x) = P(x|%s) * P(%s) / P(x) = %.6f * %.6f / %.6f = %.6f\n",
                classValues[i], classValues[i], classValues[i],
                likelihood[i], prior[i], getTotalLikelihood(likelihood, prior),
                calculatedPosterior);
        }
    }
}

// 支持向量机实现
public class SVMImplementation {

    public void trainSMOClassifier(Instances trainingData) throws Exception {
        // 创建SMO分类器
        SMO svm = new SMO();

        // 核函数配置
        PolyKernel kernel = new PolyKernel();
        kernel.setExponent(2);  // 二次多项式核
        kernel.setUseLowerOrder(false);
        svm.setKernel(kernel);

        // SMO算法参数
        svm.setC(1.0);          // 正则化参数
        svm.setToleranceParameter(1.0e-3);
        svm.setEpsilon(1.0e-12);
        svm.setBuildLogisticModels(true);

        // 训练模型
        svm.buildClassifier(trainingData);

        // 获取支持向量
        Instances supportVectors = svm.getSupportVectors();
        System.out.println("支持向量数量: " + supportVectors.numInstances());

        // 输出决策函数参数
        System.out.println("核函数: " + svm.getKernel().toString());
        System.out.println("C参数: " + svm.getC());
    }

    public void compareKernels(Instances trainingData) throws Exception {
        String[] kernelNames = {"Linear", "Polynomial", "RBF", "Sigmoid"};
        Kernel[] kernels = {
            new PolyKernel(),                    // 默认线性核
            new PolyKernel(),                    // 多项式核
            new RBFKernel(),                     // RBF核
            new SigmoidKernel()                  // Sigmoid核
        };

        // 配置多项式核
        ((PolyKernel) kernels[1]).setExponent(2);

        // 配置RBF核
        ((RBFKernel) kernels[2]).setGamma(0.01);

        System.out.println("核函数比较:");
        for (int i = 0; i < kernels.length; i++) {
            SMO svm = new SMO();
            svm.setKernel(kernels[i]);
            svm.setC(1.0);

            Evaluation eval = new Evaluation(trainingData);
            eval.crossValidateModel(svm, trainingData, 10, new Random(1));

            System.out.printf("%-10s: 正确率=%.2f%%, F1=%.4f\n",
                kernelNames[i], eval.pctCorrect(), eval.weightedFMeasure());
        }
    }
}
```

---

## 题目3: ⭐⭐⭐⭐ 无监督学习与聚类分析

**问题描述**:
请详细说明Weka中无监督学习算法的实现，包括K-means、层次聚类、EM算法和关联规则挖掘等算法的原理和应用场景。

**答案要点**:
- **K-means算法**: 质心初始化策略和收敛性分析
- **层次聚类**: 聚类树构建和距离度量方法
- **EM算法**: 高斯混合模型和软聚类思想
- **关联规则**: Apriori算法和FP-Growth的实现
- **异常检测**: 离群点识别算法

**核心原理**:
1. K-means通过迭代优化最小化类内距离
2. 层次聚类构建数据的层次结构关系
3. EM算法处理隐变量的概率推理问题
4. 关联规则挖掘发现项集之间的有趣关系
5. 异常检测识别与正常模式不符的数据点

**核心代码示例**:
```java
// K-means聚类实现
public class KMeansClustering {

    public void performKMeans(Instances data, int k) throws Exception {
        // 创建K-means聚类器
        SimpleKMeans kmeans = new SimpleKMeans();

        // 参数配置
        kmeans.setNumClusters(k);
        kmeans.setMaxIterations(100);
        kmeans.setSeed(10);
        kmeans.setInitializationMethod(new SimpleKMeans.KMeansPlusPlus());

        // 执行聚类
        kmeans.buildClusterer(data);

        // 输出聚类结果
        Instances centroids = kmeans.getClusterCentroids();
        System.out.println("聚类中心:");
        for (int i = 0; i < centroids.numInstances(); i++) {
            System.out.printf("聚类 %d: %s\n", i, centroids.instance(i));
        }

        // 聚类质量评估
        evaluateClusteringQuality(kmeans, data);
    }

    private void evaluateClusteringQuality(SimpleKMeans kmeans, Instances data) throws Exception {
        // 计算类内平方和
        double[] withinClusterSS = kmeans.getSquaredErrors();
        double totalSS = Arrays.stream(withinClusterSS).sum();

        System.out.println("\n聚类质量指标:");
        for (int i = 0; i < withinClusterSS.length; i++) {
            System.out.printf("聚类 %d: WSS=%.2f, 占比=%.2f%%\n",
                i, withinClusterSS[i], withinClusterSS[i] / totalSS * 100);
        }

        // 轮廓系数计算
        double silhouetteScore = calculateSilhouetteScore(data, kmeans);
        System.out.printf("平均轮廓系数: %.4f\n", silhouetteScore);
    }

    public void findOptimalK(Instances data, int maxK) throws Exception {
        System.out.println("寻找最优聚类数:");

        double[] elbowValues = new double[maxK - 1];

        for (int k = 2; k <= maxK; k++) {
            SimpleKMeans kmeans = new SimpleKMeans();
            kmeans.setNumClusters(k);
            kmeans.setMaxIterations(100);
            kmeans.buildClusterer(data);

            elbowValues[k - 2] = Arrays.stream(kmeans.getSquaredErrors()).sum();
            System.out.printf("K=%d: 总误差=%.2f\n", k, elbowValues[k - 2]);
        }

        // 肘部法则可视化分析
        analyzeElbowMethod(elbowValues);
    }
}

// EM算法实现
public class EMClustering {

    public void performEMClustering(Instances data, int numClusters) throws Exception {
        // 创建EM聚类器
        EM em = new EM();

        // 参数配置
        em.setNumClusters(numClusters);
        em.setMaxIterations(100);
        em.setSeed(10);

        // 启用概率输出
        em.setDisplayStdDevs(true);

        // 执行聚类
        em.buildClusterer(data);

        // 获取聚类结果
        System.out.println("EM聚类结果:");
        System.out.println("聚类数量: " + em.numberOfClusters());

        // 输出各聚类的先验概率
        double[] priors = em.getClusterPriors();
        for (int i = 0; i < priors.length; i++) {
            System.out.printf("聚类 %d 先验概率: %.4f\n", i, priors[i]);
        }

        // 聚类概率分析
        analyzeClusterProbabilities(em, data);
    }

    private void analyzeClusterProbabilities(EM em, Instances data) throws Exception {
        System.out.println("\n聚类概率分析:");

        // 计算每个实例的聚类概率
        double[][] clusterProbs = new double[data.numInstances()][em.numberOfClusters()];

        for (int i = 0; i < data.numInstances(); i++) {
            Instance instance = data.instance(i);
            double[] probs = em.distributionForInstance(instance);

            clusterProbs[i] = probs;

            // 找到最可能的聚类
            int maxIndex = 0;
            for (int j = 1; j < probs.length; j++) {
                if (probs[j] > probs[maxIndex]) {
                    maxIndex = j;
                }
            }

            System.out.printf("实例 %d: 聚类=%d, 概率=%.4f\n", i + 1, maxIndex, probs[maxIndex]);
        }

        // 计算聚类的置信度
        double[] confidences = new double[em.numberOfClusters()];
        int[] counts = new int[em.numberOfClusters()];

        for (double[] probs : clusterProbs) {
            int maxIndex = 0;
            for (int j = 1; j < probs.length; j++) {
                if (probs[j] > probs[maxIndex]) {
                    maxIndex = j;
                }
            }
            confidences[maxIndex] += probs[maxIndex];
            counts[maxIndex]++;
        }

        System.out.println("\n聚类平均置信度:");
        for (int i = 0; i < confidences.length; i++) {
            System.out.printf("聚类 %d: %.4f\n", i, confidences[i] / counts[i]);
        }
    }
}

// 关联规则挖掘
public class AssociationRuleMining {

    public void mineAssociationRules(Instances transactions) throws Exception {
        // 创建Apriori算法
        Apriori apriori = new Apriori();

        // 参数配置
        apriori.setMinMetric(0.8);      // 最小置信度
        apriori.setNumRules(20);        // 最大规则数
        apriori.setLowerBoundMinSupport(0.1); // 最小支持度
        apriori.setSignificanceLevel(-1);      // 不计算显著性

        // 执行关联规则挖掘
        apriori.buildAssociations(transactions);

        // 输出结果
        System.out.println("关联规则:");
        System.out.println(apriori);

        // 获取规则详细分析
        analyzeRules(apriori, transactions);
    }

    private void analyzeRules(Apriori apriori, Instances data) {
        AssociationRules rules = apriori.getAssociationRules();

        System.out.println("\n规则详细分析:");
        System.out.println("总规则数: " + rules.getRules().size());

        for (AssociationRule rule : rules.getRules()) {
            ItemSet premise = rule.getPremise();
            ItemSet consequence = rule.getConsequence();

            System.out.printf("\n规则: %s => %s\n",
                premise.toString(data), consequence.toString(data));
            System.out.printf("支持度: %.4f\n", rule.getSupport());
            System.out.printf("置信度: %.4f\n", rule.getConfidence());
            System.out.printf("提升度: %.4f\n", rule.getLift());

            if (rule.getLift() > 1) {
                System.out.println("正向关联 (提升度 > 1)");
            } else if (rule.getLift() < 1) {
                System.out.println("负向关联 (提升度 < 1)");
            } else {
                System.out.println("无关联 (提升度 = 1)");
            }
        }
    }

    public void compareFPGrowthWithApriori(Instances transactions) throws Exception {
        System.out.println("Apriori vs FP-Growth 性能比较:");

        // Apriori算法
        long startTime = System.currentTimeMillis();
        Apriori apriori = new Apriori();
        apriori.setLowerBoundMinSupport(0.05);
        apriori.setMinMetric(0.7);
        apriori.buildAssociations(transactions);
        long aprioriTime = System.currentTimeMillis() - startTime;

        // FP-Growth算法 (需要自定义实现或使用其他库)
        // 这里仅作示意
        long fpgrowthTime = 0;

        System.out.printf("Apriori执行时间: %d ms\n", aprioriTime);
        System.out.printf("FP-Growth执行时间: %d ms\n", fpgrowthTime);
        System.out.printf("Apriori规则数: %d\n", apriori.getAssociationRules().getRules().size());
    }
}
```

---

## 题目4: ⭐⭐⭐⭐ 特征选择与模型评估

**问题描述**:
请详细说明Weka中特征选择算法的实现原理，包括Wrapper、Filter和Embedded三种方法的区别，以及交叉验证、网格搜索等模型评估和参数调优技术。

**答案要点**:
- **特征选择方法**: Wrapper、Filter、Embedded方法的原理和适用场景
- **评估指标**: 信息增益、增益率、卡方检验等评估准则
- **搜索策略**: 前向搜索、后向搜索和启发式搜索
- **模型评估**: 交叉验证、留出法和自助法的比较
- **参数优化**: 网格搜索、随机搜索和贝叶斯优化

**核心原理**:
1. 特征选择通过移除冗余特征提升模型性能
2. 不同的评估方法适用于不同的数据特征和任务需求
3. 交叉验证提供更可靠的模型性能估计
4. 参数优化通过系统搜索找到最优模型配置

**核心代码示例**:
```java
// 特征选择实现
public class FeatureSelectionMethods {

    public void wrapperFeatureSelection(Instances data) throws Exception {
        // 创建Wrapper特征选择
        AttributeSelection wrapper = new AttributeSelection();

        // 评估器设置
        J48 evaluator = new J48();
        wrapper.setEvaluator(evaluator);

        // 搜索策略
        BestFirst search = new BestFirst();
        search.setDirection(new SelectedTag(BestFirst.DIRECTION_FORWARD, BestFirst.TAGS_DIRECTION));
        wrapper.setSearch(search);

        // 执行特征选择
        wrapper.SelectAttributes(data);

        // 输出结果
        int[] selectedAttributes = wrapper.selectedAttributes();
        System.out.println("Wrapper选择的特征索引: " + Arrays.toString(selectedAttributes));

        // 创建简化数据集
        Instances reducedData = wrapper.reduceDimensionality(data);
        System.out.println("原始特征数: " + data.numAttributes());
        System.out.println("选择后特征数: " + reducedData.numAttributes());

        // 验证特征选择效果
        evaluateFeatureSelection(data, reducedData, evaluator);
    }

    public void filterFeatureSelection(Instances data) throws Exception {
        // 创建Filter特征选择
        AttributeSelection filter = new AttributeSelection();

        // 信息增益评估器
        InfoGainAttributeEval infoGain = new InfoGainAttributeEval();
        filter.setEvaluator(infoGain);

        // 排序搜索
        Ranker ranker = new Ranker();
        ranker.setNumToSelect(10); // 选择前10个特征
        filter.setSearch(ranker);

        // 执行特征选择
        filter.SelectAttributes(data);

        // 输出特征排名
        Attribute[] rankedAttributes = filter.rankedAttributes();
        System.out.println("特征排名 (信息增益):");
        for (int i = 0; i < rankedAttributes.length && i < 10; i++) {
            double gain = rankedAttributes[i].getWeight();
            System.out.printf("%d. %s: %.4f\n", i + 1,
                rankedAttributes[i].getName(), gain);
        }

        // 卡方检验特征选择
        chiSquareFeatureSelection(data);
    }

    private void chiSquareFeatureSelection(Instances data) throws Exception {
        ChiSquaredAttributeEval chiSquare = new ChiSquaredAttributeEval();
        AttributeSelection chiSelection = new AttributeSelection();
        chiSelection.setEvaluator(chiSquare);

        Ranker ranker = new Ranker();
        ranker.setNumToSelect(15);
        chiSelection.setSearch(ranker);

        chiSelection.SelectAttributes(data);

        Attribute[] chiRanked = chiSelection.rankedAttributes();
        System.out.println("\n特征排名 (卡方检验):");
        for (int i = 0; i < chiRanked.length && i < 10; i++) {
            System.out.printf("%d. %s: %.4f\n", i + 1,
                chiRanked[i].getName(), chiRanked[i].getWeight());
        }
    }

    private void evaluateFeatureSelection(Instances originalData, Instances reducedData,
            Classifier classifier) throws Exception {
        System.out.println("\n特征选择效果评估:");

        // 原始数据性能
        Evaluation originalEval = new Evaluation(originalData);
        originalEval.crossValidateModel(classifier, originalData, 10, new Random(1));

        // 简化数据性能
        Evaluation reducedEval = new Evaluation(reducedData);
        reducedEval.crossValidateModel(classifier, reducedData, 10, new Random(1));

        System.out.printf("原始特征 (%d个): 正确率=%.2f%%, 训练时间=%dms\n",
            originalData.numAttributes(), originalEval.pctCorrect(),
            originalEval.getClass().getSimpleName());
        System.out.printf("选择特征 (%d个): 正确率=%.2f%%, 训练时间=%dms\n",
            reducedData.numAttributes(), reducedEval.pctCorrect(),
            reducedEval.getClass().getSimpleName());

        // 性能提升分析
        double accuracyImprovement = reducedEval.pctCorrect() - originalEval.pctCorrect();
        System.out.printf("准确率变化: %+.2f%%\n", accuracyImprovement);
    }
}

// 模型评估与参数优化
public class ModelEvaluation {

    public void performCrossValidation(Instances data) throws Exception {
        System.out.println("交叉验证评估:");

        // 创建评估器
        Evaluation eval = new Evaluation(data);
        J48 classifier = new J48();

        // 10折交叉验证
        long startTime = System.currentTimeMillis();
        eval.crossValidateModel(classifier, data, 10, new Random(1));
        long cvTime = System.currentTimeMillis() - startTime;

        // 输出详细评估结果
        System.out.println("10折交叉验证结果:");
        System.out.printf("正确率: %.2f%%\n", eval.pctCorrect());
        System.out.printf("平均绝对误差: %.4f\n", eval.meanAbsoluteError());
        System.out.printf("均方根误差: %.4f\n", eval.rootMeanSquaredError());
        System.out.printf("Kappa统计量: %.4f\n", eval.kappa());
        System.out.println("执行时间: " + cvTime + "ms");

        // 分类详细报告
        System.out.println("\n分类报告:");
        System.out.println(eval.toClassDetailsString());

        // 混淆矩阵
        System.out.println("\n混淆矩阵:");
        System.out.println(eval.toMatrixString());
    }

    public void performGridSearch(Instances data) throws Exception {
        System.out.println("网格搜索参数优化:");

        // 创建网格搜索
        GridSearch gridSearch = new GridSearch();

        // 基础分类器
        SMO svm = new SMO();
        gridSearch.setClassifier(svm);

        // 参数网格设置
        GridSearch grid = new GridSearch();

        // C参数搜索范围
        String[] cOptions = {"0.1", "1.0", "10.0", "100.0"};
        String[] gammaOptions = {"0.01", "0.1", "1.0", "10.0"};

        // 设置搜索空间
        gridSearch.setCVPath(".");
        gridSearch.setXProperty("C");
        gridSearch.setYProperty("gamma");
        gridSearch.setXMin(Double.parseDouble(cOptions[0]));
        gridSearch.setXMax(Double.parseDouble(cOptions[cOptions.length - 1]));
        gridSearch.setYMin(Double.parseDouble(gammaOptions[0]));
        gridSearch.setYMax(Double.parseDouble(gammaOptions[gammaOptions.length - 1]));
        gridSearch.setNumSteps(4);
        gridSearch.setEvaluation(new CVParameterSelection());
        gridSearch.setFolds(5);

        // 执行网格搜索
        gridSearch.buildClassifier(data);

        // 输出最优参数
        System.out.println("最优参数:");
        System.out.println(gridSearch.getBestClassifier());

        // 获取性能矩阵
        System.out.println("\n参数性能矩阵:");
        double[][] performanceMatrix = gridSearch.getPerformanceMatrix();
        String[] xValues = gridSearch.getXValues();
        String[] yValues = gridSearch.getYValues();

        System.out.print("C\\Gamma\t");
        for (String y : yValues) {
            System.out.printf("%s\t", y);
        }
        System.out.println();

        for (int i = 0; i < xValues.length; i++) {
            System.out.printf("%s\t", xValues[i]);
            for (int j = 0; j < yValues.length; j++) {
                System.out.printf("%.2f\t", performanceMatrix[i][j] * 100);
            }
            System.out.println();
        }
    }

    public void performBayesianOptimization(Instances data) throws Exception {
        System.out.println("贝叶斯优化参数调优:");

        // 创建贝叶斯优化器
        BayesianOptimization bo = new BayesianOptimization();

        // 设置优化目标和参数空间
        bo.setObjective("accuracy");
        bo.setAcquisitionFunction("EI"); // Expected Improvement

        // 参数空间定义
        Map<String, double[]> paramSpace = new HashMap<>();
        paramSpace.put("C", new double[]{0.1, 100.0});
        paramSpace.put("gamma", new double[]{0.01, 10.0});
        paramSpace.put("epsilon", new double[]{0.001, 0.1});

        bo.setParameterSpace(paramSpace);
        bo.setMaxIterations(50);

        // 执行优化 (示意性代码)
        // bo.optimize(data);

        System.out.println("贝叶斯优化可以更高效地搜索参数空间");
        System.out.println("特别适合高维参数空间的优化问题");
    }
}
```

---

## 题目5: ⭐⭐⭐⭐⭐ Weka高级应用与集成

**问题描述**:
请详细说明Weka的高级功能应用，包括元学习器（Bagging、Boosting、Stacking）、成本敏感学习、不平衡数据处理，以及Weka与Java项目的集成部署策略。

**答案要点**:
- **集成学习方法**: Bagging、Boosting和Stacking的实现原理
- **成本敏感学习**: 成本矩阵和误分类成本的处理
- **不平衡数据**: 过采样、欠采样和算法调整策略
- **Java集成**: Weka API的使用和模型持久化
- **生产部署**: 模型服务和实时推理的实现

**核心原理**:
1. 集成学习通过组合多个学习器提升泛化能力
2. 成本敏感学习考虑不同错误类型的代价差异
3. 不平衡数据处理通过调整数据分布平衡学习过程
4. 模型持久化使得训练好的模型能够部署到生产环境
5. 实时推理服务将机器学习能力集成到业务流程中

**核心代码示例**:
```java
// 集成学习方法
public class EnsembleLearning {

    public void trainBaggingClassifier(Instances data) throws Exception {
        // 创建Bagging分类器
        Bagging bagging = new Bagging();

        // 基础分类器
        J48 baseClassifier = new J48();
        bagging.setClassifier(baseClassifier);

        // Bagging参数
        bagging.setNumIterations(50);    // 集成大小
        bagging.setBagSizePercent(100);  // 采样比例
        bagging.setCalcOutOfBag(true);   // 计算袋外误差

        // 训练集成模型
        bagging.buildClassifier(data);

        // 输出袋外误差
        double outOfBagError = bagging.measureOutOfBagError();
        System.out.printf("袋外误差: %.4f\n", outOfBagError);

        // 获取集成成员分析
        analyzeEnsembleMembers(bagging, data);
    }

    public void trainAdaBoost(Instances data) throws Exception {
        // 创建AdaBoost.M1
        AdaBoostM1 adaBoost = new AdaBoostM1();

        // 基础分类器
        DecisionStump stump = new DecisionStump(); // 决策树桩
        adaBoost.setClassifier(stump);

        // AdaBoost参数
        adaBoost.setNumIterations(100);
        adaBoost.setUseResampling(true);
        adaBoost.setWeightThreshold(100);

        // 训练模型
        adaBoost.buildClassifier(data);

        // 输出迭代信息
        System.out.println("AdaBoost训练信息:");
        System.out.println("基础分类器: " + adaBoost.getClassifier().getClass().getSimpleName());
        System.out.println("迭代次数: " + adaBoost.getNumIterations());

        // 权重分析
        analyzeBoostingWeights(adaBoost);
    }

    public void trainStackingClassifier(Instances data) throws Exception {
        // 创建Stacking分类器
        Stacking stacking = new Stacking();

        // 设置基础分类器
        Classifier[] baseClassifiers = {
            new J48(),
            new NaiveBayes(),
            new IBk(3),
            new SMO()
        };

        stacking.setClassifiers(baseClassifiers);

        // 元分类器
        Logistic metaClassifier = new Logistic();
        stacking.setMetaClassifier(metaClassifier);

        // 训练Stacking模型
        stacking.buildClassifier(data);

        // 分析基础分类器贡献
        analyzeBaseClassifiersContribution(stacking, data);

        // 与单独分类器比较
        compareWithSingleClassifiers(data, baseClassifiers, stacking);
    }

    private void analyzeEnsembleMembers(Bagging bagging, Instances data) throws Exception {
        System.out.println("\n集成成员分析:");

        Classifier[] members = bagging.getClassifiers();
        System.out.println("集成成员数量: " + members.length);

        // 计算每个成员的性能
        double[] memberAccuracies = new double[members.length];
        for (int i = 0; i < members.length; i++) {
            Evaluation eval = new Evaluation(data);
            eval.evaluateModel(members[i], data);
            memberAccuracies[i] = eval.pctCorrect();
        }

        System.out.printf("成员平均准确率: %.2f%%\n",
            Arrays.stream(memberAccuracies).average().orElse(0));
        System.out.printf("成员准确率标准差: %.2f%%\n",
            calculateStandardDeviation(memberAccuracies));
    }
}

// 成本敏感学习
public class CostSensitiveLearning {

    public void trainCostSensitiveClassifier(Instances data) throws Exception {
        // 创建成本矩阵
        CostMatrix costMatrix = new CostMatrix(data.numClasses());

        // 设置成本矩阵 (示例: 假阳性的代价高于假阴性)
        // costMatrix.setElement(预测类别, 实际类别, 成本)
        costMatrix.setElement(0, 1, 5.0); // 预测为0，实际为1的代价为5
        costMatrix.setElement(1, 0, 1.0); // 预测为1，实际为0的代价为1

        System.out.println("成本矩阵:");
        for (int i = 0; i < costMatrix.getNumRows(); i++) {
            for (int j = 0; j < costMatrix.getNumColumns(); j++) {
                System.out.printf("%.1f\t", costMatrix.getElement(i, j));
            }
            System.out.println();
        }

        // 创建成本敏感分类器
        CostSensitiveClassifier costSensitive = new CostSensitiveClassifier();

        // 基础分类器
        J48 baseClassifier = new J48();
        costSensitive.setClassifier(baseClassifier);
        costSensitive.setCostMatrix(costMatrix);
        costSensitive.setMinimizeExpectedCost(true);

        // 训练模型
        costSensitive.buildClassifier(data);

        // 评估成本敏感性能
        evaluateCostSensitivePerformance(costSensitive, data, costMatrix);
    }

    private void evaluateCostSensitivePerformance(CostSensitiveClassifier classifier,
            Instances data, CostMatrix costMatrix) throws Exception {

        // 成本敏感评估
        CostSensitiveEvaluation costEval = new CostSensitiveEvaluation(data);
        costEval.evaluateModel(classifier, data);

        System.out.println("\n成本敏感评估结果:");
        System.out.printf("总成本: %.2f\n", costEval.getTotalCost());
        System.out.printf("平均成本: %.4f\n", costEval.getAverageCost());
        System.out.printf("成本减少: %.2f%%\n", costEval.getCostReduction());

        // 与普通分类器比较
        J48 normalClassifier = new J48();
        normalClassifier.buildClassifier(data);

        Evaluation normalEval = new Evaluation(data);
        normalEval.evaluateModel(normalClassifier, data);

        double normalTotalCost = calculateTotalCost(normalEval, data, costMatrix);
        double costSensitiveTotalCost = costEval.getTotalCost();

        System.out.println("\n性能比较:");
        System.out.printf("普通分类器: 准确率=%.2f%%, 总成本=%.2f\n",
            normalEval.pctCorrect(), normalTotalCost);
        System.out.printf("成本敏感分类器: 准确率=%.2f%%, 总成本=%.2f\n",
            costEval.pctCorrect(), costSensitiveTotalCost);
        System.out.printf("成本节省: %.2f%%\n",
            (normalTotalCost - costSensitiveTotalCost) / normalTotalCost * 100);
    }
}

// 不平衡数据处理
public class ImbalancedDataHandling {

    public void handleImbalancedData(Instances imbalancedData) throws Exception {
        System.out.println("不平衡数据处理分析:");

        // 检查类别分布
        analyzeClassDistribution(imbalancedData);

        // 过采样处理
        Instances oversampledData = applyOversampling(imbalancedData);

        // 欠采样处理
        Instances undersampledData = applyUndersampling(imbalancedData);

        // 成本敏感学习
        trainCostSensitiveForImbalanced(imbalancedData);

        // 比较不同方法的效果
        compareImbalancedHandlingMethods(
            imbalancedData, oversampledData, undersampledData);
    }

    private void analyzeClassDistribution(Instances data) {
        int[] classCounts = new int[data.numClasses()];

        for (int i = 0; i < data.numInstances(); i++) {
            int classIndex = (int) data.instance(i).classValue();
            classCounts[classIndex]++;
        }

        System.out.println("\n类别分布:");
        for (int i = 0; i < classCounts.length; i++) {
            double percentage = classCounts[i] * 100.0 / data.numInstances();
            System.out.printf("类别 %s: %d (%.1f%%)\n",
                data.classAttribute().value(i), classCounts[i], percentage);
        }

        // 计算不平衡比例
        int maxCount = Arrays.stream(classCounts).max().orElse(1);
        int minCount = Arrays.stream(classCounts).min().orElse(1);
        System.out.printf("不平衡比例: %.1f:1\n", (double) maxCount / minCount);
    }

    public Instances applyOversampling(Instances data) throws Exception {
        // 创建过采样过滤器
        Resample oversample = new Resample();
        oversample.setBiasToUniformClass(1.0); // 均匀采样
        oversample.setSampleSizePercent(200.0); // 采样到200%
        oversample.setNoReplacement(false);

        oversample.setInputFormat(data);
        Instances oversampledData = Filter.useFilter(data, oversample);

        System.out.printf("过采样后数据集大小: %d -> %d\n",
            data.numInstances(), oversampledData.numInstances());

        return oversampledData;
    }

    public Instances applyUndersampling(Instances data) throws Exception {
        // 创建欠采样过滤器
        Resample undersample = new Resample();
        undersample.setBiasToUniformClass(0.0); // 保持原始分布
        undersample.setSampleSizePercent(50.0); // 采样到50%
        undersample.setNoReplacement(true);

        undersample.setInputFormat(data);
        Instances undersampledData = Filter.useFilter(data, undersample);

        System.out.printf("欠采样后数据集大小: %d -> %d\n",
            data.numInstances(), undersampledData.numInstances());

        return undersampledData;
    }
}
```

---

**总结**: Weka作为Java生态系统中最完整的机器学习库，提供了从数据预处理到模型部署的完整解决方案。理解其核心架构和算法实现对于构建基于Java的机器学习应用至关重要。Weka的模块化设计和丰富的算法库使其成为学术研究和工业应用的重要工具。