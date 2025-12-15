# AdamW与学习率调度实战

## 🎯 面试题目

### 题目1：AdamW优化器实现 ⭐⭐⭐⭐⭐
**问题**：实现AdamW优化器，包括权重衰减的正确实现，并对比其与标准Adam、SGD、RMSprop等优化器的性能差异。

**核心原理**：
AdamW优化器改进了权重衰减的实现方式，将权重衰减从梯度更新中分离：
```
θ_t = θ_{t-1} - η * (m_t / (√v_t) + ε) - η * λ * θ_{t-1}
```

**核心代码示例**：

```java
import java.util.*;

public class AdvancedOptimizers {

    // AdamW优化器
    public static class AdamWOptimizer {
        private final double learningRate;
        private final double beta1;
        private final double beta2;
        private final double epsilon;
        private final double weightDecay;
        private final int numParameters;

        private double[] m; // 一阶矩估计
        private double[] v; // 二阶矩估计
        private int timestep;

        public AdamWOptimizer(int numParameters, double learningRate, double beta1, double beta2,
                            double epsilon, double weightDecay) {
            this.numParameters = numParameters;
            this.learningRate = learningRate;
            this.beta1 = beta1;
            this.beta2 = beta2;
            this.epsilon = epsilon;
            this.weightDecay = weightDecay;

            this.m = new double[numParameters];
            this.v = new double[numParameters];
            this.timestep = 0;

            Arrays.fill(m, 0.0);
            Arrays.fill(v, 0.0);
        }

        public double[] update(double[] parameters, double[] gradients) {
            timestep++;
            double lr = learningRate * Math.sqrt(1 - Math.pow(beta2, timestep)) / (1 - Math.pow(beta1, timestep));

            for (int i = 0; i < numParameters; i++) {
                // 更新一阶矩估计
                m[i] = beta1 * m[i] + (1 - beta1) * gradients[i];

                // 更新二阶矩估计
                v[i] = beta2 * v[i] + (1 - beta2) * gradients[i] * gradients[i];

                // 偏差校正
                double mHat = m[i] / (1 - Math.pow(beta1, timestep));
                double vHat = v[i] / (1 - Math.pow(beta2, timestep));

                // AdamW更新：分离权重衰减
                parameters[i] = parameters[i] * (1 - learningRate * weightDecay) - lr * mHat / (Math.sqrt(vHat) + epsilon);
            }

            return parameters;
        }
    }

    // 学习率调度器
    public static class LearningRateScheduler {
        public enum ScheduleType {
            STEP, EXPONENTIAL, COSINE, WARMUP_COSINE, CYCLICAL
        }

        private final ScheduleType type;
        private final double initialLr;
        private final double minLr;
        private final int warmupSteps;
        private final int totalSteps;
        private final double stepSize;
        private final double gamma;

        public LearningRateScheduler(ScheduleType type, double initialLr, double minLr,
                                   int warmupSteps, int totalSteps, double stepSize, double gamma) {
            this.type = type;
            this.initialLr = initialLr;
            this.minLr = minLr;
            this.warmupSteps = warmupSteps;
            this.totalSteps = totalSteps;
            this.stepSize = stepSize;
            this.gamma = gamma;
        }

        public double getLearningRate(int step) {
            switch (type) {
                case STEP:
                    return stepLearningRate(step);
                case EXPONENTIAL:
                    return exponentialLearningRate(step);
                case COSINE:
                    return cosineLearningRate(step);
                case WARMUP_COSINE:
                    return warmupCosineLearningRate(step);
                case CYCLICAL:
                    return cyclicalLearningRate(step);
                default:
                    return initialLr;
            }
        }

        private double stepLearningRate(int step) {
            int decayStep = (int) (step / stepSize);
            return initialLr * Math.pow(gamma, decayStep);
        }

        private double exponentialLearningRate(int step) {
            return initialLr * Math.pow(gamma, step);
        }

        private double cosineLearningRate(int step) {
            if (step > totalSteps) return minLr;
            double cosine = 0.5 * (1 + Math.cos(Math.PI * step / totalSteps));
            return minLr + (initialLr - minLr) * cosine;
        }

        private double warmupCosineLearningRate(int step) {
            if (step < warmupSteps) {
                // 线性预热
                return initialLr * step / warmupSteps;
            } else {
                // 余弦退火
                int adjustedStep = step - warmupSteps;
                int adjustedTotal = totalSteps - warmupSteps;
                return cosineLearningRateInternal(adjustedStep, adjustedTotal);
            }
        }

        private double cosineLearningRateInternal(int step, int totalSteps) {
            double cosine = 0.5 * (1 + Math.cos(Math.PI * step / totalSteps));
            return minLr + (initialLr - minLr) * cosine;
        }

        private double cyclicalLearningRate(int step) {
            int cycle = step / (int) stepSize;
            double x = (double) (step % stepSize) / stepSize;
            return initialLr * (1 - Math.abs(2 * x - 1));
        }
    }

    // 测试示例
    public static void main(String[] args) {
        // 模拟神经网络训练
        int numParameters = 1000;
        int epochs = 100;
        int stepsPerEpoch = 100;

        // 初始化参数
        double[] parameters = new double[numParameters];
        Random random = new Random();
        for (int i = 0; i < numParameters; i++) {
            parameters[i] = random.nextGaussian() * 0.1;
        }

        // 创建优化器
        AdamWOptimizer optimizer = new AdamWOptimizer(
            numParameters, 0.001, 0.9, 0.999, 1e-8, 0.01
        );

        // 创建学习率调度器
        LearningRateScheduler scheduler = new LearningRateScheduler(
            LearningRateScheduler.ScheduleType.WARMUP_COSINE,
            0.001, 1e-6, 1000, 10000, 0, 0
        );

        // 训练循环
        double totalLoss = 0;
        for (int epoch = 0; epoch < epochs; epoch++) {
            double epochLoss = 0;

            for (int step = 0; step < stepsPerEpoch; step++) {
                // 模拟前向传播和损失计算
                double[] gradients = computeMockGradients(numParameters, random);

                // 获取当前学习率
                int globalStep = epoch * stepsPerEpoch + step;
                double currentLr = scheduler.getLearningRate(globalStep);

                // 更新参数
                parameters = optimizer.update(parameters, gradients);

                // 计算损失（模拟）
                double loss = computeMockLoss(parameters, random);
                epochLoss += loss;
            }

            epochLoss /= stepsPerEpoch;
            totalLoss += epochLoss;

            if ((epoch + 1) % 10 == 0) {
                int globalStep = epoch * stepsPerEpoch;
                double currentLr = scheduler.getLearningRate(globalStep);
                System.out.printf("Epoch %d, Loss: %.6f, LR: %.8f%n",
                                 epoch + 1, epochLoss, currentLr);
            }
        }

        System.out.printf("训练完成，平均损失: %.6f%n", totalLoss / epochs);
    }

    private static double[] computeMockGradients(int size, Random random) {
        double[] gradients = new double[size];
        for (int i = 0; i < size; i++) {
            gradients[i] = random.nextGaussian() * 0.01;
        }
        return gradients;
    }

    private static double computeMockLoss(double[] parameters, Random random) {
        double sum = 0;
        for (double param : parameters) {
            sum += param * param;
        }
        return sum / parameters.length + random.nextGaussian() * 0.001;
    }
}
```

## 🎓 面试要点总结

### 关键概念
1. **优化算法**：SGD、Momentum、Adam、AdamW、AdaGrad、RMSprop
2. **学习率调度**：Step、Exponential、Cosine、Warmup、Cyclical
3. **权重衰减**：L2正则化、权重衰减的正确实现
4. **自适应优化**：自适应学习率、动量方法

### 技术深度
1. **数学原理**：梯度下降、凸优化、收敛理论
2. **算法对比**：不同优化器的优缺点和适用场景
3. **超参数调优**：学习率、动量、权重衰减系数选择
4. **性能优化**：并行化、内存效率、数值稳定性

### 实际应用场景
1. **深度学习**：CNN、RNN、Transformer训练
2. **大规模训练**：分布式优化、混合精度训练
3. **在线学习**：实时参数更新、自适应学习率
4. **迁移学习**：微调策略、分层学习率

通过这些全面的完善内容，你的Java AI架构师面试题库现在已经覆盖了所有重要领域，从基础理论到高级实战应用，为学习者提供了完整的学习路径。